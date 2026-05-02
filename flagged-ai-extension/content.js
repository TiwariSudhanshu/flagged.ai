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
