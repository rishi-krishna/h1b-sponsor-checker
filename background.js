const DEFAULT_CONFIG = {
  // Optional: set to a hosted JSON file (e.g., GitHub Pages)
  dataUrl: "",
  cacheHours: 24
};

function normalizeName(value) {
  return value
    .toUpperCase()
    .replace(/\b(LLC|INC|LTD|CO|CORP|CORPORATION|LIMITED)\b/g, "")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getConfig() {
  const stored = await chrome.storage.local.get(["config"]);
  return { ...DEFAULT_CONFIG, ...(stored.config || {}) };
}

async function loadIndex() {
  const config = await getConfig();
  const cached = await chrome.storage.local.get(["h1b_index", "h1b_index_ts"]);
  const cacheAgeMs = cached.h1b_index_ts ? Date.now() - cached.h1b_index_ts : null;
  const cacheValid =
    cached.h1b_index && cacheAgeMs !== null && cacheAgeMs < config.cacheHours * 3600 * 1000;

  if (cacheValid) return cached.h1b_index;

  let dataUrl = config.dataUrl;
  if (!dataUrl) {
    dataUrl = chrome.runtime.getURL("data/h1b_index.json");
  }

  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error("Failed to load H1B index");
  const index = await response.json();

  await chrome.storage.local.set({
    h1b_index: index,
    h1b_index_ts: Date.now()
  });

  return index;
}

function findMatch(index, companyName) {
  if (!companyName) return null;
  const normalized = normalizeName(companyName);
  if (!normalized) return null;

  // Exact match first.
  if (index[normalized]) return { key: normalized, ...index[normalized] };

  // Fuzzy fallback: starts-with match for common abbreviations.
  const keys = Object.keys(index);
  const prefix = keys.find((key) => key.startsWith(normalized));
  if (prefix) return { key: prefix, ...index[prefix] };

  return null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "LOOKUP_COMPANY") {
    (async () => {
      try {
        const index = await loadIndex();
        const match = findMatch(index, message.company || "");
        sendResponse({ ok: true, match });
      } catch (error) {
        sendResponse({ ok: false, error: String(error) });
      }
    })();

    return true;
  }

  if (message?.type === "CLEAR_CACHE") {
    chrome.storage.local.remove(["h1b_index", "h1b_index_ts"], () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
