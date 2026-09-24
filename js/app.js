/**
 * app.js
 * ------------------------------------------------------------------
 * Entry point loaded on every page. Reads `document.body.dataset.page`
 * to decide which page-specific controller to run. Talks to the app
 * only through js/api.js (never js/mock-data.js) and renders through
 * helpers in js/ui.js, so it stays UI-logic, not data logic.
 * ------------------------------------------------------------------
 */

import { getAllHospitals, searchHospitals, getHospitalById, getHospitalsByIds, getSpecialties, getCitySuggestions } from "./api.js";
import { initAiAssistant } from "./ai-assistant.js";
import {
  icons, toast, openModal, closeModal, initMobileNav, initSmoothScroll, initThemeToggle,
  renderHospitalCard, renderSkeletonCards, renderEmptyState, renderErrorState,
  formatCostRange, renderStars
} from "./ui.js";

const COMPARE_KEY = "vitality_compare_ids";
const MAX_COMPARE = 3;

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  initSmoothScroll();
  initThemeToggle();
  initYear();

  const page = document.body.dataset.page;
  if (page === "home") initHomePage();
  if (page === "search") initSearchPage();
  if (page === "details") initDetailsPage();
});

function initYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

/* ==================================================================
   Compare-list state (shared between search & details pages)
   ================================================================== */
function getCompareIds() {
  try {
    return JSON.parse(sessionStorage.getItem(COMPARE_KEY)) || [];
  } catch {
    return [];
  }
}
function setCompareIds(ids) {
  sessionStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
}
function addToCompare(id) {
  const ids = getCompareIds();
  if (ids.includes(id)) return { ok: true, ids };
  if (ids.length >= MAX_COMPARE) return { ok: false, ids };
  ids.push(id);
  setCompareIds(ids);
  return { ok: true, ids };
}
function removeFromCompare(id) {
  const ids = getCompareIds().filter(x => x !== id);
  setCompareIds(ids);
  return ids;
}

/* ==================================================================
   HOME PAGE
   ================================================================== */
function initHomePage() {
  // Options are populated through api.js (never mock-data.js directly),
  // so when a real backend is connected these come from real records
  // with no changes needed here. Non-blocking: the rest of the page
  // doesn't depend on these having loaded yet.
  getSpecialties().then(list => populateSelect(document.getElementById("home-specialty"), list, "Any specialty"));
  getCitySuggestions().then(list => populateDatalist(document.getElementById("home-city-options"), list));
  populateHomeStats();

  const budgetInput = document.getElementById("home-budget");
  const budgetValue = document.getElementById("home-budget-value");
  if (budgetInput && budgetValue) {
    const sync = () => (budgetValue.textContent = formatCostRange(0, Number(budgetInput.value)));
    budgetInput.addEventListener("input", sync);
    sync();
  }
  const distanceInput = document.getElementById("home-distance");
  const distanceValue = document.getElementById("home-distance-value");
  if (distanceInput && distanceValue) {
    const sync = () => (distanceValue.textContent = `${distanceInput.value} km`);
    distanceInput.addEventListener("input", sync);
    sync();
  }

  const form = document.getElementById("home-search-form");
  form?.addEventListener("submit", e => {
    e.preventDefault();
    const params = new URLSearchParams();
    const disease = document.getElementById("home-disease").value.trim();
    const specialization = document.getElementById("home-specialty").value;
    const city = document.getElementById("home-city").value.trim();
    const outcome = document.getElementById("home-outcome").checked;

    if (disease) params.set("disease", disease);
    if (specialization) params.set("specialization", specialization);
    if (city) params.set("city", city);
    if (budgetInput) params.set("maxBudget", budgetInput.value);
    if (distanceInput) params.set("maxDistance", distanceInput.value);
    if (outcome) params.set("outcome", "1");

    window.location.href = `search.html?${params.toString()}`;
  });

  function scrollToAiAssistant(e) {
    e.preventDefault();
    document.getElementById("ai-assistant")?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("ai-chat-input")?.focus({ preventScroll: true });
  }
  document.getElementById("ask-ai-link")?.addEventListener("click", scrollToAiAssistant);
  document.getElementById("ask-ai-link-2")?.addEventListener("click", scrollToAiAssistant);

  initAiAssistant({
    onSearchSpecialty: specialty => {
      window.location.href = `search.html?specialization=${encodeURIComponent(specialty)}`;
    }
  });
}

function populateSelect(selectEl, values, placeholder) {
  if (!selectEl) return;
  selectEl.innerHTML = `<option value="">${placeholder}</option>` +
    values.map(v => `<option value="${v}">${v}</option>`).join("");
}

// City is a free-text input (see section 2 of the frontend brief) so the
// person isn't limited to the handful of cities present in the mock
// dataset. The datalist below only offers suggestions; it never blocks
// what can be typed, and the `city` URL parameter still carries the
// entered text through search/filter/reload exactly as before.
function populateDatalist(datalistEl, values) {
  if (!datalistEl) return;
  datalistEl.innerHTML = values.map(v => `<option value="${v}"></option>`).join("");
}

// Home page "N demo hospitals / N specialties / N per comparison" stats.
// These read through api.js (getAllHospitals/getSpecialties), so once a
// real backend is connected the counts update on their own — no rewrite
// needed. If the request fails, the static fallback numbers already in
// the HTML are simply left in place.
async function populateHomeStats() {
  try {
    const [hospitals, specialties] = await Promise.all([getAllHospitals(), getSpecialties()]);
    setStatValue("stat-hospitals", hospitals.length);
    setStatValue("stat-specialties", specialties.length);
    setStatValue("stat-compare", MAX_COMPARE);
  } catch (err) {
    console.error("Could not load home page stats:", err);
  }
}

function setStatValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* ==================================================================
   SEARCH / RESULTS PAGE
   ================================================================== */
async function initSearchPage() {
  const els = {
    list: document.getElementById("hospital-list"),
    resultsCount: document.getElementById("results-count"),
    sortSelect: document.getElementById("sort-select"),
    sidebar: document.getElementById("filters-sidebar"),
    scrim: document.getElementById("filters-scrim"),
    filterToggle: document.getElementById("filter-toggle-mobile"),
    applyBtn: document.getElementById("apply-filters"),
    resetBtn: document.getElementById("reset-filters"),
    compareTray: document.getElementById("compare-tray"),
    compareSlots: document.getElementById("compare-tray-slots"),
    compareOpenBtn: document.getElementById("compare-open-btn"),
    compareClearBtn: document.getElementById("compare-clear-btn"),
    compareModalBackdrop: document.getElementById("compare-modal-backdrop"),
    compareModalBody: document.getElementById("compare-modal-body"),
    compareModalClose: document.getElementById("compare-modal-close"),
  };

  // City suggestions can populate whenever they're ready — a free-text
  // input has no race condition. The specialization <select>, however,
  // must have its <option> list in place *before* hydrateFiltersFromUrl()
  // tries to set its value from the URL, or a specialization named in
  // the URL would silently fail to select (no matching <option> yet).
  getCitySuggestions().then(list => populateDatalist(document.getElementById("filter-city-options"), list));
  const specialties = await getSpecialties();
  populateSelect(document.getElementById("filter-specialization"), specialties, "Any specialty");

  hydrateFiltersFromUrl(els);

  els.filterToggle?.addEventListener("click", () => toggleSidebar(els, true));
  els.scrim?.addEventListener("click", () => toggleSidebar(els, false));

  els.applyBtn?.addEventListener("click", () => {
    runSearch(els, { pushUrl: true });
    // Keep the mobile filter drawer open if budget validation just
    // failed, so the person can see the message and fix the values.
    const budgetError = document.getElementById("budget-error");
    if (budgetError && !budgetError.hidden) return;
    toggleSidebar(els, false);
  });
  els.resetBtn?.addEventListener("click", () => {
    document.getElementById("filters-form")?.reset();
    document.getElementById("filter-max-distance").value = 150;
    syncRangeLabel();
    runSearch(els, { pushUrl: true });
  });
  els.sortSelect?.addEventListener("change", () => runSearch(els, { pushUrl: true }));

  // Clear the budget validation message as soon as the user starts
  // correcting either field, rather than leaving a stale error visible.
  document.getElementById("filter-min-budget")?.addEventListener("input", clearBudgetError);
  document.getElementById("filter-max-budget")?.addEventListener("input", clearBudgetError);

  const distanceRange = document.getElementById("filter-max-distance");
  const distanceLabel = document.getElementById("filter-max-distance-value");
  function syncRangeLabel() {
    if (distanceRange && distanceLabel) distanceLabel.textContent = `${distanceRange.value} km`;
  }
  distanceRange?.addEventListener("input", syncRangeLabel);
  syncRangeLabel();

  els.compareOpenBtn?.addEventListener("click", () => openCompareModal(els));
  els.compareClearBtn?.addEventListener("click", () => {
    setCompareIds([]);
    renderCompareTray(els);
  });
  els.compareModalClose?.addEventListener("click", () => closeModal(els.compareModalBackdrop));
  els.compareModalBackdrop?.addEventListener("click", e => {
    if (e.target === els.compareModalBackdrop) closeModal(els.compareModalBackdrop);
  });

  // Makes browser Back/Forward "sensible": since Apply/Reset/Sort push a
  // new history entry (see runSearch's pushUrl option below), navigating
  // back or forward changes the address bar but, without this, would
  // leave the on-screen filters/results stale relative to it. Re-reading
  // the URL and re-running the search on every popstate keeps them in sync.
  window.addEventListener("popstate", () => {
    hydrateFiltersFromUrl(els);
    syncRangeLabel();
    runSearch(els);
  });

  renderCompareTray(els);

  // Read this before runSearch() rewrites the URL to reflect only the
  // current filters (see syncUrlWithFilters) — otherwise a one-time
  // "?compare=1" link (used to land here with the compare modal open)
  // would already be gone from the URL by the time we check for it.
  const arrivedViaCompareLink = new URLSearchParams(window.location.search).get("compare") === "1";
  runSearch(els);

  if (arrivedViaCompareLink && getCompareIds().length) {
    openCompareModal(els);
  }
}

function toggleSidebar(els, open) {
  els.sidebar?.classList.toggle("open", open);
  els.scrim?.classList.toggle("open", open);
}

function hydrateFiltersFromUrl(els) {
  const params = new URLSearchParams(window.location.search);
  const setVal = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
  setVal("filter-disease", params.get("disease") || "");
  setVal("filter-specialization", params.get("specialization") || "");
  setVal("filter-city", params.get("city") || "");
  setVal("filter-min-budget", params.get("minBudget") || "");
  setVal("filter-max-budget", params.get("maxBudget") || "");
  setVal("filter-max-distance", params.get("maxDistance") || "150");
  setVal("filter-hospital-type", params.get("hospitalType") || "");
  setVal("filter-rating", params.get("minRating") || "");
  const outcomeEl = document.getElementById("filter-outcome");
  if (outcomeEl) outcomeEl.checked = params.get("outcome") === "1";

  const selectedFacilities = (params.get("facilities") || "").split(",").filter(Boolean);
  document.querySelectorAll('input[name="facility"]').forEach(cb => {
    cb.checked = selectedFacilities.includes(cb.value);
  });

  const sortParam = params.get("sort");
  if (sortParam && els.sortSelect) els.sortSelect.value = sortParam;
}

/**
 * Maps the current filter state onto URL query params, using the same
 * param names the backend search endpoint uses (see api.js
 * buildSearchParams) wherever the two overlap, so the URL a person can
 * copy/refresh/bookmark stays consistent with what actually gets searched.
 */
function filtersToUrlParams(filters) {
  const params = new URLSearchParams();
  if (filters.disease) params.set("disease", filters.disease);
  if (filters.specialization) params.set("specialization", filters.specialization);
  if (filters.city) params.set("city", filters.city);
  if (filters.minBudget != null) params.set("minBudget", String(filters.minBudget));
  if (filters.maxBudget != null) params.set("maxBudget", String(filters.maxBudget));
  if (filters.maxDistance != null && filters.maxDistance < 150) params.set("maxDistance", String(filters.maxDistance));
  if (filters.outcomeAvailableOnly) params.set("outcome", "1");
  if (filters.hospitalType) params.set("hospitalType", filters.hospitalType);
  if (filters.facilities && filters.facilities.length) params.set("facilities", filters.facilities.join(","));
  if (filters.minRating) params.set("minRating", String(filters.minRating));
  if (filters.sortBy && filters.sortBy !== "recommended") params.set("sort", filters.sortBy);
  return params;
}

function syncUrlWithFilters(filters, { push = false } = {}) {
  const qs = filtersToUrlParams(filters).toString();
  const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
  if (`${window.location.pathname}${window.location.search}` === newUrl) return;
  if (push) {
    window.history.pushState({}, "", newUrl);
  } else {
    window.history.replaceState({}, "", newUrl);
  }
}

function readFiltersFromForm() {
  const val = id => document.getElementById(id)?.value || "";
  const facilities = Array.from(document.querySelectorAll('input[name="facility"]:checked')).map(c => c.value);
  return {
    disease: val("filter-disease").trim(),
    specialization: val("filter-specialization"),
    city: val("filter-city").trim(),
    minBudget: val("filter-min-budget") ? Number(val("filter-min-budget")) : null,
    maxBudget: val("filter-max-budget") ? Number(val("filter-max-budget")) : null,
    maxDistance: val("filter-max-distance") ? Number(val("filter-max-distance")) : null,
    outcomeAvailableOnly: !!document.getElementById("filter-outcome")?.checked,
    hospitalType: val("filter-hospital-type"),
    facilities,
    minRating: val("filter-rating") ? Number(val("filter-rating")) : null,
    sortBy: document.getElementById("sort-select")?.value || "recommended"
  };
}

// Bumped on every runSearch() call so a slow/late-resolving request can
// detect it has been superseded and avoid overwriting a newer result set.
// Without this guard, two overlapping searches (e.g. changing the sort
// dropdown right after clicking Apply Filters) can resolve out of order,
// which is what caused results to sometimes appear "shuffled".
let searchRequestId = 0;

function showBudgetError(els, message) {
  const minField = document.getElementById("filter-min-budget")?.closest(".field");
  const maxField = document.getElementById("filter-max-budget")?.closest(".field");
  const errorEl = document.getElementById("budget-error");
  minField?.classList.add("invalid");
  maxField?.classList.add("invalid");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }
}

function clearBudgetError() {
  const minField = document.getElementById("filter-min-budget")?.closest(".field");
  const maxField = document.getElementById("filter-max-budget")?.closest(".field");
  const errorEl = document.getElementById("budget-error");
  minField?.classList.remove("invalid");
  maxField?.classList.remove("invalid");
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }
}

async function runSearch(els, { pushUrl = false } = {}) {
  const filters = readFiltersFromForm();

  // Reflect the currently-applied filters in the URL (see section 2 of
  // the frontend brief) so it can be refreshed, bookmarked, or shared.
  // User-initiated changes (Apply/Reset/Sort) push a new history entry;
  // internal refreshes (initial load, compare-tray updates) just replace
  // the current one so they don't clutter Back/Forward.
  syncUrlWithFilters(filters, { push: pushUrl });

  // Budget validation: minimum must not exceed maximum. The search is
  // blocked (not silently corrected) so the user's own entered values
  // stay visible and other filters are left untouched.
  clearBudgetError();
  if (filters.minBudget != null && filters.maxBudget != null && filters.minBudget > filters.maxBudget) {
    showBudgetError(els, "Minimum budget can't be greater than maximum budget. Please adjust the values and try again.");
    els.resultsCount.textContent = "";
    return;
  }

  const requestId = ++searchRequestId;
  renderSkeletonCards(els.list, 4);
  els.resultsCount.textContent = "Searching...";

  try {
    const results = await searchHospitals(filters);
    if (requestId !== searchRequestId) return; // a newer search superseded this one
    renderResults(els, results, filters.sortBy);
  } catch (err) {
    if (requestId !== searchRequestId) return;
    console.error(err);
    renderErrorState(els.list, { onRetry: () => runSearch(els) });
    els.resultsCount.textContent = "";
    toast("Unable to load hospital information.", "error");
  }
}

function renderResults(els, results, sortBy) {
  els.list.innerHTML = "";

  if (!results.length) {
    els.resultsCount.textContent = "0 hospitals found";
    renderEmptyState(els.list, {
      title: "No hospitals found matching your current filters.",
      message: "Try widening your budget, distance, or clearing a filter to see more options.",
      actionLabel: "Reset Filters",
      onAction: () => els.resetBtn?.click()
    });
    return;
  }

  els.resultsCount.innerHTML = `<strong>${results.length}</strong> hospital${results.length === 1 ? "" : "s"} found`;

  const compareIds = getCompareIds();
  results.forEach((hospital, index) => {
    const card = renderHospitalCard(hospital, {
      isSelected: compareIds.includes(hospital.hospitalId),
      compareDisabled: compareIds.length >= MAX_COMPARE,
      isBestMatch: index === 0 && (sortBy === "recommended" || !sortBy) && results.length > 1,
      onCompareToggle: (id, checked) => {
        if (checked) {
          const { ok } = addToCompare(id);
          if (!ok) {
            toast(`You can compare up to ${MAX_COMPARE} hospitals at a time.`, "error");
            runSearch(els);
            return;
          }
        } else {
          removeFromCompare(id);
        }
        renderCompareTray(els);
        renderResults(els, results, sortBy); // re-render to sync disabled state on other checkboxes
      }
    });
    els.list.appendChild(card);
  });
}

async function renderCompareTray(els) {
  const ids = getCompareIds();
  if (!els.compareTray) return;

  if (!ids.length) {
    els.compareTray.classList.remove("open");
    els.compareSlots.innerHTML = "";
    return;
  }

  els.compareTray.classList.add("open");
  const hospitals = await getHospitalsByIds(ids);
  els.compareSlots.innerHTML = hospitals.map(h => `
    <div class="compare-slot" data-id="${h.hospitalId}">
      <span>${h.name}</span>
      <button type="button" aria-label="Remove ${h.name} from comparison">&times;</button>
    </div>
  `).join("");

  els.compareSlots.querySelectorAll(".compare-slot button").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.closest(".compare-slot").dataset.id;
      removeFromCompare(id);
      renderCompareTray(els);
      runSearch(els);
    });
  });

  if (els.compareOpenBtn) {
    els.compareOpenBtn.disabled = ids.length < 2;
  }
}

async function openCompareModal(els) {
  const ids = getCompareIds();
  if (ids.length < 2) {
    toast("Select at least 2 hospitals to compare.", "error");
    return;
  }
  const hospitals = await getHospitalsByIds(ids);
  els.compareModalBody.innerHTML = buildComparisonTable(hospitals);
  els.compareModalBody.querySelectorAll("[data-remove-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      removeFromCompare(btn.dataset.removeId);
      renderCompareTray(els);
      runSearch(els);
      const remaining = getCompareIds();
      if (remaining.length < 2) {
        closeModal(els.compareModalBackdrop);
      } else {
        openCompareModal(els);
      }
    });
  });
  openModal(els.compareModalBackdrop);
}

function buildComparisonTable(hospitals) {
  const rows = [
    { label: "Location", render: h => `${h.city}, ${h.state}` },
    { label: "Distance", render: h => `${h.distance} km` },
    { label: "Specialization", render: h => h.specialization },
    { label: "Treatment", render: h => h.treatments.join(", ") },
    { label: "Estimated cost", render: h => formatCostRange(h.costMin, h.costMax) },
    { label: "Outcome information", render: h => h.outcomeRate != null ? `${h.outcomeRate}%` : `<span class="unavailable">Outcome data unavailable</span>` },
    { label: "Rating", render: h => `${h.rating.toFixed(1)} / 5` },
    { label: "Facilities", render: h => `${h.facilities.length} listed` },
  ];

  const lowestCostId = hospitals.reduce((a, b) => (a.costMin <= b.costMin ? a : b)).hospitalId;
  const closestId = hospitals.reduce((a, b) => (a.distance <= b.distance ? a : b)).hospitalId;

  const head = hospitals.map(h => `
    <th class="col-head">
      <h4>${h.name}</h4>
      <div>
        ${h.hospitalId === closestId ? `<span class="indicator">${icons.check} Closer location</span><br/>` : ""}
        ${h.hospitalId === lowestCostId ? `<span class="indicator">${icons.check} Lower estimated cost</span><br/>` : ""}
        ${h.outcomeRate != null ? `<span class="indicator">${icons.check} Outcome data available</span>` : ""}
      </div>
      <span class="remove-col" data-remove-id="${h.hospitalId}" role="button" tabindex="0">Remove</span>
    </th>
  `).join("");

  const body = rows.map(row => `
    <tr>
      <td class="row-label">${row.label}</td>
      ${hospitals.map(h => `<td>${row.render(h)}</td>`).join("")}
    </tr>
  `).join("");

  return `
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead><tr><th></th>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

/* ==================================================================
   HOSPITAL DETAILS PAGE
   ================================================================== */
async function initDetailsPage() {
  const container = document.getElementById("details-content");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    renderErrorState(container, { onRetry: () => (window.location.href = "search.html") });
    return;
  }

  try {
    const hospital = await getHospitalById(id);
    if (!hospital) {
      renderEmptyState(container, {
        title: "Hospital not found.",
        message: "This demo record may have been removed. Go back and search again.",
        actionLabel: "Back to Search",
        onAction: () => (window.location.href = "search.html")
      });
      return;
    }
    renderHospitalDetails(container, hospital);
  } catch (err) {
    console.error(err);
    renderErrorState(container, { onRetry: () => initDetailsPage() });
  }
}

function renderHospitalDetails(container, h) {
  document.title = `${h.name} · Vitality`;

  const outcomeStat = h.outcomeRate != null
    ? `<strong>${h.outcomeRate}%</strong><div class="outcome-note">Source: ${h.outcomeSource} &middot; ${h.outcomeYear}</div>`
    : `<span class="unavailable">Outcome data unavailable</span>`;

  container.innerHTML = `
    <div class="mock-flag">${icons.alertTriangle} DEMO DATA — for hackathon preview only. Not verified medical information.</div>

    <div class="details-banner">
      <img src="${h.image}" alt="" />
      <div class="details-banner-overlay"><span class="type-tag">${h.hospitalType}</span></div>
    </div>

    <div class="details-head">
      <div>
        <h1>${h.name}</h1>
        <div class="hospital-location">${icons.pin}<span>${h.address}</span></div>
        <div class="hospital-rating" style="margin-top:8px;" aria-label="Rating ${h.rating} of 5">${renderStars(h.rating)}<span style="color:var(--ink-muted); font-weight:500;">&nbsp;&middot; ${h.distance} km away</span></div>
      </div>
      <div class="details-actions">
        <button type="button" class="btn btn-secondary" id="compare-btn">${icons.scale} Compare</button>
        <a class="btn btn-primary" id="directions-btn" target="_blank" rel="noopener">${icons.map} Get Directions</a>
      </div>
    </div>

    <div class="details-layout">
      <div>
        <section class="details-section">
          <h2>Specialization &amp; Treatments</h2>
          <div class="chip-row">
            <span class="tag">${h.specialization}</span>
            ${h.treatments.map(t => `<span class="tag tag-teal">${t}</span>`).join("")}
          </div>
        </section>

        <section class="details-section">
          <h2>Cost &amp; Outcome</h2>
          <div class="stat-cards">
            <div class="stat-card"><span>Estimated cost</span><strong>${formatCostRange(h.costMin, h.costMax)}</strong></div>
            <div class="stat-card"><span>Outcome information</span>${outcomeStat}</div>
            <div class="stat-card"><span>Hospital type</span><strong>${h.hospitalType}</strong></div>
          </div>
        </section>

        <section class="details-section">
          <h2>Doctors</h2>
          <div class="doctor-list">
            ${h.doctors.map(d => `
              <div class="doctor-row">
                <div class="doctor-avatar">${d.name.split(" ").slice(-1)[0][0]}</div>
                <div>
                  <strong>${d.name}<span class="demo-flag">Demo</span></strong>
                  <span>${d.specialty} &middot; ${d.experience}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </section>

        <section class="details-section">
          <h2>Facilities</h2>
          <div class="facility-grid">
            ${h.facilities.map(f => `<div class="facility-item">${icons.check} ${f}</div>`).join("")}
          </div>
        </section>
      </div>

      <aside class="details-sidebar">
        <div class="info-card">
          <h3>Contact</h3>
          <div class="info-row">${icons.phone}<div>${h.contact.phone}<span>Phone</span></div></div>
          <div class="info-row">${icons.mail}<div>${h.contact.email}<span>Email</span></div></div>
          <div class="info-row">${icons.clock}<div>${h.hours}<span>Opening hours</span></div></div>
        </div>
        <div class="info-card">
          <h3>Location</h3>
          <div class="map-placeholder">${icons.map}<span>Map preview placeholder &mdash; connect a maps API in the backend phase</span></div>
        </div>
      </aside>
    </div>
  `;

  document.getElementById("directions-btn").href =
    `https://www.google.com/maps/search/?api=1&query=${h.latitude},${h.longitude}`;

  document.getElementById("compare-btn").addEventListener("click", () => {
    const { ok } = addToCompare(h.hospitalId);
    if (!ok) {
      toast(`You can compare up to ${MAX_COMPARE} hospitals at a time.`, "error");
      return;
    }
    toast(`${h.name} added to comparison.`, "success");
    setTimeout(() => { window.location.href = "search.html?compare=1"; }, 700);
  });
}
