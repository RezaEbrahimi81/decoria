// src/js/pages/shop.js
// URL-driven shop: filters, sorting, pagination AND search all live in the URL.

import { apiGet } from "../api/client.js";
import { initLoader, showLoader, hideLoader } from "../components/loader.js";
import { renderFilters } from "../components/filters.js";

const PER_PAGE = 9;
const HEADER_OFFSET = 96;

// ---------- URL <-> state ----------
function readState() {
  const p = new URLSearchParams(location.search);
  return {
    category: p.get("category") || null,
    subcategory: p.get("subcategory") || null,
    min: p.get("min") || null,
    max: p.get("max") || null,
    sale: p.get("sale") || null,
    inStock: p.get("instock") || null,
    q: p.get("q") || null,
    sort: p.get("sort") || "new",
    page: Number(p.get("page")) || 1,
  };
}

function writeState(state) {
  const p = new URLSearchParams();
  if (state.category) p.set("category", state.category);
  if (state.subcategory) p.set("subcategory", state.subcategory);
  if (state.min) p.set("min", state.min);
  if (state.max) p.set("max", state.max);
  if (state.sale) p.set("sale", "1");
  if (state.inStock) p.set("instock", "1");
  if (state.q) p.set("q", state.q);
  if (state.sort !== "new") p.set("sort", state.sort);
  if (state.page > 1) p.set("page", String(state.page));
  const qs = p.toString();
  history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
}

// ---------- API query builder (server-side parts) ----------
function buildQuery(state) {
  const p = new URLSearchParams();
  if (state.category) p.set("category", state.category);
  if (state.subcategory) p.set("subcategory", state.subcategory);
  if (state.min) p.set("price_gte", state.min);
  if (state.max) p.set("price_lte", state.max);
  if (state.sale) p.set("oldPrice_ne", "null");
  if (state.inStock) p.set("inStock", "true");

  switch (state.sort) {
    case "price_asc":
      p.set("_sort", "price");
      break;
    case "price_desc":
      p.set("_sort", "-price");
      break;
    case "rating_desc":
      p.set("_sort", "-rating");
      break;
  }

  // NOTE: q is intentionally NOT sent to the server — json-server's q
  // behavior varies across versions (case sensitivity). Search is applied
  // client-side in load() so it is guaranteed case-insensitive.

  p.set("_page", String(state.page));
  p.set("_per_page", String(PER_PAGE));
  return p.toString();
}

export async function initShop() {
  const grid = document.getElementById("product-grid");
  const countEl = document.getElementById("result-count");
  const pagEl = document.getElementById("pagination");
  const filtersEl = document.getElementById("filters");
  const filtersMobileBody = document.getElementById("filters-mobile-body");
  if (!grid) return;

  initLoader();

  const state = readState();
  const categories = await apiGet("/categories").catch(() => []);

  const renderFilterUI = () =>
    renderFilters(filtersEl, filtersMobileBody, {
      categories,
      state,
      onChange: applyPatch,
    });

  const scrollToResults = () => {
    const y = grid.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const applyPatch = (patch, { scroll = false } = {}) => {
    Object.assign(state, patch);
    writeState(state);
    renderFilterUI();
    load();
    if (scroll) scrollToResults();
  };

  renderFilterUI();

  const sortSel = document.getElementById("sort-select");
  sortSel.value = state.sort;
  sortSel.addEventListener("change", () =>
    applyPatch({ sort: sortSel.value, page: 1 }),
  );

  document
    .getElementById("filters-toggle")
    ?.addEventListener("click", () =>
      document.getElementById("filters-mobile")?.classList.toggle("hidden"),
    );

  async function load() {
    showLoader();
    try {
      let products, items, pages;

      if (state.q) {
        // ---- search mode: server-side filters, client-side full-text ----
        const qp = new URLSearchParams(buildQuery(state));
        qp.delete("_page");
        qp.delete("_per_page");
        const all = await apiGet(`/products?${qp.toString()}`);

        const ql = state.q.toLowerCase();
        const matches = all.filter((p) =>
          [p.name, p.description, p.material, p.category, p.subcategory].some(
            (f) => (f ?? "").toString().toLowerCase().includes(ql),
          ),
        );

        items = matches.length;
        pages = Math.max(1, Math.ceil(items / PER_PAGE));
        products = matches.slice(
          (state.page - 1) * PER_PAGE,
          state.page * PER_PAGE,
        );
      } else {
        const page = await apiGet(`/products?${buildQuery(state)}`);
        products = page.data;
        items = page.items;
        pages = page.pages;
      }

      if (state.sort === "new")
        products = [...products].sort(
          (a, b) => Number(b.isNew) - Number(a.isNew),
        );

      const { createProductCard } =
        await import("../components/product-card.js");
      grid.innerHTML = products.map(createProductCard).join("");

      countEl.textContent = `${items} product${items === 1 ? "" : "s"} found`;
      renderPagination(pagEl, state, { pages });
    } catch (err) {
      grid.innerHTML = `<p class="col-span-full text-muted">Could not load products. Is the API running?</p>`;
      console.error(err);
    } finally {
      setTimeout(hideLoader, 400);
    }
  }

  function renderPagination(el, st, page) {
    if (page.pages <= 1) {
      el.innerHTML = "";
      return;
    }

    const btn = (label, target, opts = {}) => `
      <button type="button" data-page="${target}" ${opts.disabled ? "disabled" : ""}
        class="h-10 min-w-10 rounded-lg border border-line px-3 text-sm font-medium text-ink transition
               hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40
               ${opts.active ? "bg-accent text-accent-fg hover:bg-accent border-accent" : ""}">
        ${label}
      </button>`;

    const nums = [];
    for (let i = 1; i <= page.pages; i++)
      if (i === 1 || i === page.pages || Math.abs(i - st.page) <= 1)
        nums.push(i);

    el.innerHTML =
      btn("‹", st.page - 1, { disabled: st.page <= 1 }) +
      nums
        .map(
          (n, i) =>
            (i > 0 && n - nums[i - 1] > 1
              ? `<span class="px-1 text-muted">…</span>`
              : "") + btn(n, n, { active: n === st.page }),
        )
        .join("") +
      btn("›", st.page + 1, { disabled: st.page >= page.pages });

    el.querySelectorAll("[data-page]").forEach((b) =>
      b.addEventListener("click", () => {
        applyPatch({ page: Number(b.dataset.page) });
        scrollToResults();
      }),
    );
  }

  await load();
}
