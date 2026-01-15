const companyInput = document.getElementById("companyInput");
const checkButton = document.getElementById("checkButton");
const result = document.getElementById("result");
const resultTitle = document.getElementById("resultTitle");
const resultMeta = document.getElementById("resultMeta");
const rolesList = document.getElementById("rolesList");
const status = document.getElementById("status");

function setStatus(message) {
  status.textContent = message;
}

function renderResult(match) {
  result.classList.remove("hidden");
  rolesList.innerHTML = "";

  if (!match) {
    resultTitle.textContent = "No sponsorship found";
    resultMeta.textContent = "No H1B records found for this company.";
    return;
  }

  resultTitle.textContent = "H1B sponsorship found";
  const displayName = match.company || "Unknown company";
  resultMeta.textContent = displayName;

  (match.roles || []).slice(0, 5).forEach((role) => {
    const li = document.createElement("li");
    li.textContent = role;
    rolesList.appendChild(li);
  });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function detectCompanyFromPage() {
  const tab = await getActiveTab();
  if (!tab?.id) return;

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(
      tab.id,
      { type: "GET_COMPANY_CANDIDATE" },
      (response) => resolve(response)
    );
  });
}

async function lookupCompany(company) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "LOOKUP_COMPANY", company },
      (response) => resolve(response)
    );
  });
}

async function runLookup(company) {
  if (!company) {
    setStatus("Paste a company name to check.");
    return;
  }

  setStatus("Checking...");
  result.classList.add("hidden");

  const response = await lookupCompany(company);
  if (!response?.ok) {
    setStatus(response?.error || "Lookup failed.");
    return;
  }

  setStatus("");
  renderResult(response.match);
}

async function init() {
  setStatus("Detecting company...");
  const response = await detectCompanyFromPage();
  if (response?.company) {
    companyInput.value = response.company;
    await runLookup(response.company);
    return;
  }
  setStatus("Paste a company name to check.");
}

checkButton.addEventListener("click", async () => {
  const company = companyInput.value.trim();
  await runLookup(company);
});

companyInput.addEventListener("keydown", async (event) => {
  if (event.key === "Enter") {
    await runLookup(companyInput.value.trim());
  }
});

init();
