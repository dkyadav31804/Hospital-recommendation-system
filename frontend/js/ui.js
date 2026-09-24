/**
 * ui.js
 * ------------------------------------------------------------------
 * Shared, page-agnostic UI helpers: icons, formatting, toasts, modal,
 * mobile navigation, hospital card rendering, skeleton/empty/error
 * states. app.js imports from here and wires things up per page.
 * ------------------------------------------------------------------
 */

/* ---------------------------- Icons ---------------------------- */
// Small inline icon set (stroke-based, currentColor) so no icon font
// or external request is needed.
export const icons = {
  star: `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.6l2.5 5.7 6.2.6-4.7 4.1 1.4 6.1L10 14.9l-5.4 3.2 1.4-6.1-4.7-4.1 6.2-.6L10 1.6z"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg>`,
  check: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10.5l4 4 8-9"/></svg>`,
  alertTriangle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4 2 20h20L12 4z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.6 8.6 0 0 1-3.9-1L3 20l1.2-4.5A8.4 8.4 0 1 1 21 11.5z"/></svg>`,
  building: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h4l2 5-2.5 1.5a12 12 0 0 0 6 6L15 14l5 2v4a2 2 0 0 1-2 2C9.6 22 2 14.4 2 6a2 2 0 0 1 2-2z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>`,
  map: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 20l-6-2V6l6 2m0 12 6-2m-6 2V8m6 10 6 2V6l-6-2m0 16V6m0 0L9 8"/></svg>`,
  scale: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v18M5 7l7-4 7 4M3 7h4l-2 6a2.2 2.2 0 0 1-4 0L3 7zM17 7h4l-2 6a2.2 2.2 0 0 1-4 0l2-6z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5l14 14M19 5 5 19"/></svg>`
};

/* --------------------------- Formatting -------------------------- */
export function formatCurrency(amount) {
  return "\u20B9" + Number(amount).toLocaleString("en-IN");
}

export function formatCostRange(min, max) {
  return `${formatCurrency(min)} \u2013 ${formatCurrency(max)}`;
}

export function renderStars(rating) {
  if (rating == null || Number.isNaN(Number(rating))) {
    return `<span class="unavailable">No rating</span>`;
  }

  return `${icons.star}<span>${Number(rating).toFixed(1)}</span>`;
}

/* ----------------------------- Toasts ----------------------------- */
let toastRegion = null;
export function toast(message, type = "default", timeout = 3200) {
  if (!toastRegion) {
    toastRegion = document.createElement("div");
    toastRegion.className = "toast-region";
    toastRegion.setAttribute("aria-live", "polite");
    document.body.appendChild(toastRegion);
  }
  const el = document.createElement("div");
  el.className = `toast ${type === "error" ? "error" : type === "success" ? "success" : ""}`.trim();
  el.textContent = message;
  toastRegion.appendChild(el);
  setTimeout(() => el.remove(), timeout);
}

/* ------------------------------ Modal ------------------------------ */
export function openModal(backdropEl) {
  backdropEl.hidden = false;
  const focusable = backdropEl.querySelector("button, [href], input, select, textarea");
  if (focusable) focusable.focus();
  document.addEventListener("keydown", escCloseHandler(backdropEl));
}
export function closeModal(backdropEl) {
  backdropEl.hidden = true;
}
function escCloseHandler(backdropEl) {
  function handler(e) {
    if (e.key === "Escape" && !backdropEl.hidden) {
      closeModal(backdropEl);
      document.removeEventListener("keydown", handler);
    }
  }
  return handler;
}

/* -------------------------- Mobile navbar -------------------------- */
export function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
  links.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* --------------------------- Theme toggle ---------------------------
   Presentation-only: flips a `data-theme` attribute on <html> and
   persists the choice in localStorage. Does not touch search/filter
   state, the compare list, URL params, or any API call. A blocking
   inline script in each page's <head> reads the same key before paint
   so the page never flashes the wrong theme on load/navigation. */
const THEME_STORAGE_KEY = "vitality-theme";

export function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const readStoredTheme = () => {
    try { return localStorage.getItem(THEME_STORAGE_KEY); } catch { return null; }
  };
  const writeStoredTheme = value => {
    try { localStorage.setItem(THEME_STORAGE_KEY, value); } catch { /* storage unavailable — theme still works for this page view */ }
  };

  const applyTheme = theme => {
    document.documentElement.setAttribute("data-theme", theme);
    const isLight = theme === "light";
    btn.setAttribute("aria-pressed", String(isLight));
    btn.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
  };

  const systemPrefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
  const currentAttr = document.documentElement.getAttribute("data-theme");
  const initialTheme = readStoredTheme() || currentAttr || (systemPrefersLight ? "light" : "dark");
  applyTheme(initialTheme);

  btn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(next);
    writeStoredTheme(next);
  });
}

/* --------------------------- Smooth scroll --------------------------- */
export function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", e => {
      const id = anchor.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

/* --------------------------- Hospital card --------------------------- */
/**
 * Build a hospital result card.
 * @param {object} hospital
 * @param {object} opts
 * @param {boolean} opts.isSelected - whether this hospital is in the compare tray
 * @param {boolean} opts.compareDisabled - true when 3 hospitals are already selected elsewhere
 * @param {boolean} opts.isBestMatch - true when this card is first under the current
 *   sort order ("Recommended"/default). Rendered as a neutral "Top result" badge —
 *   this reflects sort position only, never a personalized or medical judgment.
 * @param {(hospitalId:string, checked:boolean)=>void} opts.onCompareToggle
 */
export function renderHospitalCard(hospital, opts = {}) {
  const { isSelected = false, compareDisabled = false, isBestMatch = false, onCompareToggle } = opts;
  const card = document.createElement("article");
  card.className = `hospital-card${isBestMatch ? " best-match" : ""}`;
  card.setAttribute("data-hospital-id", hospital.hospitalId);

  const outcomeBlock = hospital.outcomeRate != null
    ? `<strong>${hospital.outcomeRate}%</strong>`
    : `<span class="unavailable">Outcome data unavailable</span>`;

  card.innerHTML = `
    <div class="hospital-card-media">
      <span class="type-tag">${hospital.hospitalType}</span>
      ${isBestMatch ? `<span class="best-match-badge">${icons.check} Top result</span>` : ""}
      <img src="${hospital.image}" alt="" loading="lazy" />
    </div>
    <div class="hospital-card-body">
      <div class="hospital-card-top">
        <h3><a href="hospital-details.html?id=${hospital.hospitalId}">${hospital.name}</a></h3>
        <div class="hospital-rating" aria-label="Rating ${hospital.rating} out of 5">${renderStars(hospital.rating)}</div>
      </div>
      <div class="hospital-location">${icons.pin}<span>${hospital.city}, ${hospital.state}</span><span aria-hidden="true">&middot;</span><span>${hospital.distance} km away</span></div>
      <div class="hospital-tags">
        <span class="tag">${hospital.specialization}</span>
        <span class="tag tag-teal">${hospital.treatments[0]}</span>
      </div>
      <div class="hospital-meta-row">
        <div class="meta-block"><span>Estimated cost</span><strong>${formatCostRange(hospital.costMin, hospital.costMax)}</strong></div>
        <div class="meta-block"><span>Outcome information</span>${outcomeBlock}</div>
        <div class="meta-block"><span>Facilities</span><strong>${hospital.facilities.length} listed</strong></div>
      </div>
      <div class="hospital-card-actions">
        <a class="btn btn-secondary btn-sm" href="hospital-details.html?id=${hospital.hospitalId}">View Details</a>
        <label class="compare-check ${isSelected ? "checked" : ""}">
          <input type="checkbox" ${isSelected ? "checked" : ""} ${(!isSelected && compareDisabled) ? "disabled" : ""} />
          Compare
        </label>
      </div>
    </div>
  `;

  const checkbox = card.querySelector(".compare-check input");
  checkbox.addEventListener("change", () => {
    onCompareToggle?.(hospital.hospitalId, checkbox.checked);
  });

  return card;
}

export function renderSkeletonCards(container, count = 4) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "skeleton-card";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `
      <div class="skeleton-block media"></div>
      <div>
        <div class="skeleton-block line w-60"></div>
        <div class="skeleton-block line w-40"></div>
        <div class="skeleton-block line w-80"></div>
        <div class="skeleton-block line w-40"></div>
      </div>
    `;
    container.appendChild(el);
  }
}

export function renderEmptyState(container, { title, message, actionLabel, onAction }) {
  container.innerHTML = "";
  const el = document.createElement("div");
  el.className = "state-panel";
  el.innerHTML = `
    <div class="state-icon">${icons.search}</div>
    <h3>${title}</h3>
    <p>${message}</p>
    ${actionLabel ? `<button type="button" class="btn btn-primary state-action">${actionLabel}</button>` : ""}
  `;
  if (actionLabel && onAction) {
    el.querySelector(".state-action").addEventListener("click", onAction);
  }
  container.appendChild(el);
}

export function renderErrorState(container, { onRetry }) {
  container.innerHTML = "";
  const el = document.createElement("div");
  el.className = "state-panel";
  el.innerHTML = `
    <div class="state-icon state-icon-error">${icons.alertTriangle}</div>
    <h3>Unable to load hospital information.</h3>
    <p>Something went wrong while fetching results. Check your connection and try again.</p>
    <button type="button" class="btn btn-primary state-action">Try Again</button>
  `;
  el.querySelector(".state-action").addEventListener("click", onRetry);
  container.appendChild(el);
}
