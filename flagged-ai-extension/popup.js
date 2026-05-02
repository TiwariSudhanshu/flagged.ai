const inputEl = document.getElementById("input");
const statusEl = document.getElementById("statusText");
const progressEl = document.getElementById("progressText");
const usePageBtn = document.getElementById("usePage");
const analyzeBtn = document.getElementById("analyze");
const verdictEl = document.getElementById("verdict");
const verdictScoreEl = document.getElementById("verdictScore");
const verdictLabelEl = document.getElementById("verdictLabel");
const verdictHeadlineEl = document.getElementById("verdictHeadline");

let totalChecks = 0;
let completedChecks = 0;

const API_BASE = "http://localhost:3000";

function setStatus(text) {
  statusEl.textContent = text;
}

function setProgress() {
  progressEl.textContent = `${completedChecks}/${totalChecks} checks completed`;
}

function clearVerdict() {
  verdictEl.classList.add("hidden");
  verdictScoreEl.textContent = "--";
  verdictLabelEl.textContent = "--";
  verdictHeadlineEl.textContent = "";
  totalChecks = 0;
  completedChecks = 0;
  setProgress();
}

function renderVerdict(verdict) {
  if (!verdict) return;
  verdictEl.classList.remove("hidden");
  verdictScoreEl.textContent = Number.isFinite(verdict.score)
    ? verdict.score
    : "--";
  verdictLabelEl.textContent = verdict.verdict
    ? verdict.verdict.replace(/_/g, " ")
    : "--";
  verdictHeadlineEl.textContent = verdict.headline || "";
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

usePageBtn.addEventListener("click", async () => {
  setStatus("Reading page...");
  const tab = await getActiveTab();
  const tabId = tab?.id;
  if (!tabId) {
    setStatus("No active tab.");
    return;
  }

  const url = tab?.url || "";
  if (
    url.startsWith("chrome://") ||
    url.startsWith("edge://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("about:")
  ) {
    setStatus("Cannot read this page.");
    return;
  }

  chrome.tabs.sendMessage(tabId, { type: "GET_PAGE_TEXT" }, async (resp) => {
    const lastError = chrome.runtime.lastError;
    if (lastError || !resp?.text) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const selection = window.getSelection()?.toString().trim();
            if (selection) return selection;
            const bodyText = document.body?.innerText || "";
            return bodyText.slice(0, 12000);
          },
        });
        const text = results?.[0]?.result || "";
        inputEl.value = text;
        setStatus(text ? "Page captured." : "No text found on page.");
      } catch (err) {
        setStatus("Cannot read this page.");
      }
      return;
    }

    inputEl.value = resp.text;
    setStatus(resp.text ? "Page captured." : "No text found on page.");
  });
});

analyzeBtn.addEventListener("click", async () => {
  const input = inputEl.value.trim();
  if (!input) return;

  clearVerdict();
  setStatus("Analyzing...");

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });

  const reader = res.body?.getReader();
  if (!reader) {
    setStatus("No stream returned.");
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
          renderVerdict(event.verdict);
          setStatus("Done");
        } else if (event.type === "plan") {
          const names = (event.agents || []).map((a) => a.name).filter(Boolean);
          totalChecks = names.length;
          completedChecks = 0;
          setProgress();
        } else if (event.type === "agent_start") {
          setStatus("Analyzing...");
        } else if (event.type === "agent_done") {
          completedChecks += 1;
          setProgress();
        } else if (event.type === "recovery") {
          setStatus("Recovery mode");
        } else if (event.type === "error") {
          setStatus(`Error: ${event.message}`);
        } else {
          setStatus("Analyzing...");
        }
      } catch {
        setStatus("Analyzing...");
      }
    }
  }
});
