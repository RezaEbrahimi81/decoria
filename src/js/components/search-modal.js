// Singleton search dialog — PERMANENTLY MOUNTED (no display toggling).
// Search strategy: the full catalog is cached on first open and suggestions
// are filtered CLIENT-SIDE (case-insensitive, instant). This is immune to
// json-server's q case-sensitivity / _per_page quirks and costs zero
// network requests per keystroke.

import { apiGet } from "../api/client.js";
import { formatPrice } from "../services/currency.js";

const PLACEHOLDER = "/src/assets/images/products/_placeholder.jpg";
const MAX_SUGGESTIONS = 5;
const MAX_RECOMMENDED = 3;

// tweak these to whatever you want to promote
const POPULAR = ["Furniture", "Lighting", "Storage", "Rugs", "Desk"];

let cache = null; // all products — fetched once, reused for every keystroke

const markup = `
<div id="search-modal" aria-hidden="true" data-open="false"
  class="fixed inset-0 z-[950] flex items-start justify-center p-4 pt-20 opacity-0 pointer-events-none transition-opacity duration-200 will-change-opacity">
  <div data-sm-backdrop class="absolute inset-0 bg-black/50"></div>

  <div data-sm-panel
    class="relative w-full max-w-2xl rounded-xl bg-card ring-1 ring-line shadow-2xl">
    <!-- input row -->
    <div class="flex items-center gap-3 border-b border-line px-4 py-3">
      <svg class="h-5 w-5 text-accent-text" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input id="search-input" name="q" type="text" autocomplete="off" placeholder="Search products…"
        class="w-full bg-transparent text-base text-ink outline-none placeholder:text-muted" />
      <button type="button" data-sm-close aria-label="Close"
        class="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-accent-soft hover:text-ink">
        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>

    <!-- content: popular / suggestions / recommended — filled by JS -->
    <div data-sm-body class="max-h-[60vh] overflow-y-auto scroll-slim p-4"></div>
  </div>
</div>`;

// ---------- templates ----------

function popularHTML() {
  return `
    <p class="mb-2 text-sm font-semibold uppercase tracking-wider text-ink">Popular Searches</p>
    <div class="flex flex-wrap gap-2">
      ${POPULAR.map(
        (t) => `
        <button type="button" data-popular="${t}"
          class="rounded-full bg-accent-soft px-3.5 py-1.5 text-sm font-medium text-accent-text transition hover:bg-accent hover:text-accent-fg">
          ${t}
        </button>`,
      ).join("")}
    </div>
    <p data-sm-label class="mt-6 mb-2 text-sm font-semibold uppercase tracking-wider text-ink">Recommended Products</p>
    <div data-sm-results class="space-y-1"></div>`;
}

function resultRow(p) {
  const soldOut = !p.inStock;
  return `
    <a href="/pages/product.html?id=${p.id}"
       class="flex items-center gap-3 rounded-lg p-2 transition hover:bg-accent-soft">
      <img src="${p.images[0] ?? PLACEHOLDER}" alt=""
           onerror="this.src='${PLACEHOLDER}'"
           class="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-line" />
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-ink">${p.name}</p>
        <p class="text-xs uppercase tracking-wider text-muted">${p.subcategory}</p>
      </div>
      <p class="flex items-baseline gap-2 whitespace-nowrap text-sm">
        ${p.oldPrice ? `<del class="text-xs text-muted">${formatPrice(p.oldPrice)}</del>` : ""}
        <span class="font-semibold ${p.oldPrice && !soldOut ? "text-red-600" : "text-ink"}">${formatPrice(p.price)}</span>
      </p>
    </a>`;
}

function suggestionsHTML(matches, q) {
  if (!matches.length) {
    return `
      <p class="py-8 text-center text-sm text-muted">
        No results for “${q}” — try a different keyword.
      </p>
      <a href="/pages/shop.html" class="block text-center text-sm font-medium text-accent-text hover:underline">
        Browse all products →
      </a>`;
  }
  return `
    ${matches.map(resultRow).join("")}
    <a href="/pages/shop.html?q=${encodeURIComponent(q)}"
       class="mt-3 block rounded-lg border border-line py-2.5 text-center text-sm font-medium text-accent-text transition hover:bg-accent-soft">
      See all results →
    </a>`;
}

// ---------- client-side search over the cached catalog ----------

function renderSuggestions(body, q) {
  const labelEl = body.querySelector("[data-sm-label]");
  const resultsEl = body.querySelector("[data-sm-results]");
  if (!labelEl || !resultsEl) return;

  if (!q) {
    labelEl.textContent = "Recommended Products";
    resultsEl.innerHTML = (cache ?? [])
      .filter((p) => p.isFeatured)
      .slice(0, MAX_RECOMMENDED)
      .map(resultRow)
      .join("");
    return;
  }

  const ql = q.toLowerCase();
  const matches = (cache ?? [])
    .filter((p) =>
      [p.name, p.material, p.category, p.subcategory, p.description].some((f) =>
        (f ?? "").toString().toLowerCase().includes(ql),
      ),
    )
    .slice(0, MAX_SUGGESTIONS);

  labelEl.textContent = `Results for “${q}”`;
  resultsEl.innerHTML = suggestionsHTML(matches, q);
}

// ---------- open / close (singleton, permanently mounted) ----------

let openedFrom = null;

function open() {
  const root = document.getElementById("search-modal");
  const input = root.querySelector("#search-input");
  const body = root.querySelector("[data-sm-body]");

  if (!body.dataset.populated) {
    body.innerHTML = popularHTML();
    body.dataset.populated = "1";

    // popular chips → fill input and search
    body.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-popular]");
      if (chip) {
        input.value = chip.dataset.popular;
        renderSuggestions(body, input.value);
        input.focus();
      }
    });

    // typing → instant client-side filtering (no debounce needed)
    input.addEventListener("input", () =>
      renderSuggestions(body, input.value.trim()),
    );

    // cache the catalog once — every keystroke after this is instant
    apiGet("/products")
      .then((all) => {
        cache = all;
        renderSuggestions(body, input.value.trim());
      })
      .catch(() => {});
  }

  root.setAttribute("data-open", "true");
  root.removeAttribute("aria-hidden");
  root.classList.remove("opacity-0", "pointer-events-none");
  setTimeout(() => input.focus(), 50);
}

export function closeSearchModal() {
  const root = document.getElementById("search-modal");
  if (root.getAttribute("data-open") !== "true") return;
  root.setAttribute("data-open", "false");
  root.setAttribute("aria-hidden", "true");
  root.classList.add("opacity-0", "pointer-events-none");
  openedFrom?.focus({ preventScroll: true });
  openedFrom = null;
}

export function initSearchModal() {
  if (document.getElementById("search-modal")) return;
  document.body.insertAdjacentHTML("beforeend", markup);
  const root = document.getElementById("search-modal");

  root
    .querySelector("[data-sm-backdrop]")
    .addEventListener("click", closeSearchModal);
  root
    .querySelector("[data-sm-close]")
    .addEventListener("click", closeSearchModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearchModal();
  });

  // open from the header search button (delegated → works on every page)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest('button[aria-label="Search"]');
    if (!btn) return;
    openedFrom = btn;
    open();
  });
}
