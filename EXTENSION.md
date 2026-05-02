# Flagged AI Browser Extension Guide

This doc explains how to build a Chrome/Edge extension that sends job posts to the Flagged AI pipeline and shows a live verdict.

---

## Goal

Build a lightweight extension that can:

- Grab selected text or full job post content from the current page.
- Send it to the Flagged AI `/api/analyze` endpoint.
- Stream the verdict and render the risk score + reasons in the popup.

---

## Architecture (MV3)

Use Manifest V3 with a popup and a content script:

- **Popup**: UI, collects input, displays streaming results.
- **Content script**: extracts page text/selection.
- **Background (optional)**: centralizes API calls if you want the popup to stay thin.

For the quickest build, call the API directly from the popup (no background needed).

---

## Endpoint Contract

`POST /api/analyze` expects:

```json
{ "input": "string" }
```

It returns an **NDJSON stream** (newline-delimited JSON) of events:

- `preprocess`
- `agent_start`
- `agent_done`
- `verdict`
- `recovery`
- `error`

Your extension should read the stream line by line and render partial updates.

---

## Step 1: Create the Extension Folder

```
flagged-ai-extension/
  manifest.json
  popup.html
  popup.js
  popup.css
  content.js
```

---

## Step 2: Manifest (MV3)

```json
{
  "manifest_version": 3,
  "name": "Flagged AI - Job Scam Checker",
  "version": "0.1.0",
  "description": "Send job posts to Flagged AI and get a risk verdict.",
  "action": {
    "default_popup": "popup.html"
  },
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": ["http://localhost:3000/*"],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ]
}
```

Notes:

- Swap `http://localhost:3000/*` with your deployed domain when live.
- Keep permissions minimal.

---

## Step 3: Content Script (Extract Text)

```js
// content.js
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "GET_PAGE_TEXT") return;

  const selection = window.getSelection()?.toString().trim();
  if (selection) {
    sendResponse({ text: selection });
    return;
  }

  // Fallback: grab main content (simple heuristic)
  const bodyText = document.body?.innerText || "";
  sendResponse({ text: bodyText.slice(0, 12000) });
});
```

This prioritizes user selection. It trims to 12k chars to match API limits.

---

## Step 4: Popup UI

```html
<!-- popup.html -->
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="popup.css" />
  </head>
  <body>
    <div id="app">
      <h1>Flagged AI</h1>
      <textarea
        id="input"
        placeholder="Paste a job post or click 'Use Page'..."
      ></textarea>
      <div class="row">
        <button id="usePage">Use Page</button>
        <button id="analyze">Analyze</button>
      </div>
      <pre id="output">Ready.</pre>
    </div>
    <script src="popup.js"></script>
  </body>
</html>
```

---

## Step 5: Popup Logic (Stream NDJSON)

```js
// popup.js
const inputEl = document.getElementById("input");
const outputEl = document.getElementById("output");

const API_BASE = "http://localhost:3000";

function logLine(line) {
  outputEl.textContent = `${outputEl.textContent}\n${line}`.trim();
}

async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

document.getElementById("usePage").addEventListener("click", async () => {
  const tabId = await getActiveTabId();
  if (!tabId) return;

  chrome.tabs.sendMessage(tabId, { type: "GET_PAGE_TEXT" }, (resp) => {
    inputEl.value = resp?.text || "";
  });
});

document.getElementById("analyze").addEventListener("click", async () => {
  const input = inputEl.value.trim();
  if (!input) return;

  outputEl.textContent = "Analyzing...";

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });

  const reader = res.body?.getReader();
  if (!reader) {
    outputEl.textContent = "No stream returned.";
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;

      try {
        const event = JSON.parse(line);
        if (event.type === "verdict") {
          logLine(`Score: ${event.score} (${event.label})`);
          logLine(event.summary || "No summary provided");
        } else if (event.type === "error") {
          logLine(`Error: ${event.message}`);
        } else {
          logLine(`• ${event.type}`);
        }
      } catch {
        logLine(line);
      }
    }
  }
});
```

---

## Step 6: CORS (Required for Extensions)

The extension runs on a `chrome-extension://` origin. The API must allow it.

Add CORS headers in your API response so the browser allows the request. Minimal example:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: Content-Type, X-API-Key`

If you deploy the API, replace `*` with your extension origin for better security.

---

## Step 7: API Keys (Optional)

The API accepts anonymous calls **only when the `X-API-Key` header is missing**.

For production, consider:

- Generate a dedicated API key for the extension.
- Send `X-API-Key` from the popup.
- Rate-limit based on key.

---

## Step 8: Load in Chrome/Edge

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select your extension folder.

---

## Step 9: Deploy Option

Host the web app (Next.js) and update `API_BASE` + `host_permissions` to the deployed domain.

---

## Future Enhancements

- Add page-specific parsers (LinkedIn, Naukri, Indeed) for cleaner inputs.
- Show a compact “risk badge” injected into the page (content script + CSS).
- Store history in `chrome.storage`.
- Add a report flow to `/api/report`.

---

## Troubleshooting

- If requests fail, check the browser console in the popup.
- If the stream closes early, make sure the API is running and not blocked by CORS.
- If you get 401, an API key header is present but invalid.
