const dataUrlInput = document.getElementById("dataUrl");
const cacheHoursInput = document.getElementById("cacheHours");
const saveButton = document.getElementById("saveButton");
const clearCacheButton = document.getElementById("clearCacheButton");
const status = document.getElementById("status");

const DEFAULT_CONFIG = {
  dataUrl: "",
  cacheHours: 24
};

function setStatus(message) {
  status.textContent = message;
}

async function loadConfig() {
  const stored = await chrome.storage.local.get(["config"]);
  return { ...DEFAULT_CONFIG, ...(stored.config || {}) };
}

async function saveConfig(config) {
  await chrome.storage.local.set({ config });
}

async function init() {
  const config = await loadConfig();
  dataUrlInput.value = config.dataUrl;
  cacheHoursInput.value = config.cacheHours;
}

saveButton.addEventListener("click", async () => {
  const config = {
    dataUrl: dataUrlInput.value.trim(),
    cacheHours: Number(cacheHoursInput.value) || DEFAULT_CONFIG.cacheHours
  };

  await saveConfig(config);
  setStatus("Saved.");
});

clearCacheButton.addEventListener("click", async () => {
  setStatus("Clearing cache...");
  const response = await chrome.runtime.sendMessage({ type: "CLEAR_CACHE" });
  if (response?.ok) {
    setStatus("Cache cleared.");
  } else {
    setStatus("Failed to clear cache.");
  }
});

init();
