// Lightweight company name extraction from common page signals.
function normalizeCandidate(value) {
  if (!value) return "";
  return value
    .replace(/\s+/g, " ")
    .replace(/\|.+$/, "")
    .replace(/-\s+.+$/, "")
    .trim();
}

function extractCompanyCandidates() {
  const candidates = [];

  const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.content;
  const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
  const appName = document.querySelector('meta[name="application-name"]')?.content;
  const title = document.title;

  [ogSiteName, ogTitle, appName, title].forEach((value) => {
    const candidate = normalizeCandidate(value);
    if (candidate) candidates.push(candidate);
  });

  // Try to grab a likely org name from common header elements.
  const h1 = document.querySelector("h1")?.textContent;
  const h2 = document.querySelector("h2")?.textContent;
  [h1, h2].forEach((value) => {
    const candidate = normalizeCandidate(value);
    if (candidate && candidate.length <= 60) candidates.push(candidate);
  });

  return candidates;
}

function pickBestCandidate(candidates) {
  if (!candidates.length) return "";
  // Prefer shorter, brand-like strings.
  const sorted = [...new Set(candidates)].sort((a, b) => a.length - b.length);
  return sorted[0] || "";
}

function getCompanyFromPage() {
  const candidates = extractCompanyCandidates();
  return pickBestCandidate(candidates);
}

function getHostSpecificCompanyElement() {
  const host = window.location.hostname;
  const isLinkedIn = host.includes("linkedin.com");
  const isIndeed = host.includes("indeed.com");

  if (isLinkedIn) {
    return (
      document.querySelector(".job-details-jobs-unified-top-card__company-name a") ||
      document.querySelector(".jobs-unified-top-card__company-name a") ||
      document.querySelector(".jobs-unified-top-card__company-name")
    );
  }

  if (isIndeed) {
    return (
      document.querySelector('[data-testid="companyName"]') ||
      document.querySelector(".jobsearch-CompanyInfoContainer a") ||
      document.querySelector(".jobsearch-CompanyInfoContainer")
    );
  }

  return null;
}

function createBadge(text, color) {
  const badge = document.createElement("span");
  badge.dataset.h1bBadge = "true";
  badge.textContent = text;
  badge.style.marginLeft = "8px";
  badge.style.fontSize = "12px";
  badge.style.fontWeight = "600";
  badge.style.color = color;
  return badge;
}

function attachBadge(target, isSponsored) {
  if (!target) return;
  if (target.querySelector('[data-h1b-badge="true"]')) return;

  const badge = createBadge(
    isSponsored ? "H1B Sponsored" : "No H1B Data",
    isSponsored ? "#1a7f37" : "#9c4a1f"
  );
  target.appendChild(badge);
}

async function lookupCompany(company) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "LOOKUP_COMPANY", company },
      (response) => resolve(response)
    );
  });
}

let lookupInFlight = false;
async function updateOnPageIndicator() {
  if (lookupInFlight) return;
  const companyElement = getHostSpecificCompanyElement();
  if (!companyElement) return;

  const company =
    companyElement.textContent?.trim() ||
    getCompanyFromPage();

  if (!company) return;
  lookupInFlight = true;

  const response = await lookupCompany(company);
  if (response?.ok) {
    attachBadge(companyElement, Boolean(response.match));
  }
  lookupInFlight = false;
}

function watchForCompanyElement() {
  updateOnPageIndicator();
  const observer = new MutationObserver(() => {
    updateOnPageIndicator();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", watchForCompanyElement);
} else {
  watchForCompanyElement();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "GET_COMPANY_CANDIDATE") return;
  const candidates = extractCompanyCandidates();
  const best = pickBestCandidate(candidates);
  sendResponse({ company: best, candidates });
});
