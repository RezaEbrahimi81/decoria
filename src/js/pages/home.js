// src/js/pages/home.js — everything below the hero on index.html
//
// Sections (each optional — hidden gracefully if the API or data is missing):
//   1. Shop by Category   → dynamic cover grid, one card per category
//   2. Curator's Picks    → featured grid (skips what the hero carousel shows)
//   3. The Decoria Edit   → static story + live catalogue stats
//   4. New Arrivals       → horizontal snap scroller
//   5. Seasonal Sale      → dark banner with live sale count / biggest cut
//   6. Fairs marquee      → static
//   7. Testimonials       → static

import { apiGet } from "../api/client.js";
import { initHeroCarousel, heroPickIds } from "../components/hero-carousel.js";
import { createProductCard } from "../components/product-card.js";
import { onCurrencyChange } from "../services/currency.js";

const PLACEHOLDER = "/src/assets/images/products/_placeholder.jpg";

// Curated covers for known categories (aesthetically checked).
// Any category without an entry (e.g. textile) falls back to the first
// product image inside it — so the grid adapts to db.json changes.
const CATEGORY_COVERS = {
  furniture:
    "/src/assets/images/products/furniture-seating-armchair_chieftain-teak_and_oridinal_leather-1.jpg",
  lighting:
    "/src/assets/images/products/lighting-ceiling-lamps-artichoke-model-ph-8792-1.jpg",
  art: "/src/assets/images/products/art-painting-no-ii-by-harry-boostrom-1587-1.jpg",
  ceramics:
    "/src/assets/images/products/ceramics-bowl-farsta-designed-by-willhelm-kage-for-gustavsberg-1.jpg",
  glass:
    "/src/assets/images/products/glass-glassware-model-vase-savoy3030-aal-1.jpg",
};

// ---------- shared catalogue fetch (one request for all sections) ----------
let catalogue = null;
function getCatalogue() {
  catalogue ??= apiGet("/products").catch((err) => {
    catalogue = null; // allow retry on next currency change
    throw err;
  });
  return catalogue;
}

const sellable = (p) => p.inStock && p.images?.length;

// Spread picks across categories (max `maxPerCat` each) so grids feel varied,
// optionally excluding ids already shown by the hero carousel.
function pickSpread(pool, n, { maxPerCat = 2, exclude } = {}) {
  const ranked = [
    ...pool.filter((p) => p.isFeatured),
    ...pool.filter((p) => !p.isFeatured),
  ];
  const perCategory = new Map();
  const picked = [];
  for (const p of ranked) {
    if (exclude?.has(p.id)) continue;
    const count = perCategory.get(p.category) ?? 0;
    if (count >= maxPerCat) continue;
    perCategory.set(p.category, count + 1);
    picked.push(p);
    if (picked.length === n) break;
  }
  return picked;
}

// ---------- section renderers ----------

async function renderCategories(categories) {
  const grid = document.querySelector("[data-categories-grid]");
  if (!grid) return;
  const all = await getCatalogue();

  grid.innerHTML = categories
    .map((c) => {
      const inCat = all.filter((p) => p.category === c.slug);
      const count = inCat.length;
      if (!count) return ""; // empty category → no card
      const cover =
        CATEGORY_COVERS[c.slug] ??
        (inCat.find((p) => p.isFeatured && sellable(p)) ?? inCat[0])
          .images?.[0] ??
        PLACEHOLDER;
      return `
      <a href="/pages/shop.html?category=${c.slug}"
         class="group relative block overflow-hidden rounded-2xl ring-1 ring-line">
        <img src="${cover}" alt="${c.name}" loading="lazy" decoding="async"
             onerror="this.src='${PLACEHOLDER}'"
             class="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" aria-hidden="true"></div>
        <div class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
          <div>
            <h3 class="font-display text-xl font-semibold text-white">${c.name}</h3>
            <p class="text-sm text-white/75">${count} ${count === 1 ? "piece" : "pieces"}</p>
          </div>
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur transition group-hover:bg-accent group-hover:text-accent-fg group-hover:ring-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </span>
        </div>
      </a>`;
    })
    .join("");
}

let featuredProducts = [];

function renderFeatured() {
  const grid = document.querySelector("[data-featured-grid]");
  if (!grid || !featuredProducts.length) return;
  grid.innerHTML = featuredProducts.map(createProductCard).join("");
}

let newProducts = [];

function renderNewArrivals() {
  const track = document.querySelector("[data-new-track]");
  if (!track || !newProducts.length) return;
  track.innerHTML = newProducts
    .map(
      (p) => `
    <div class="w-[220px] shrink-0 snap-start sm:w-[250px]">
      ${createProductCard(p)}
    </div>`,
    )
    .join("");
  updateNewArrows();
}

// scroller arrows: disabled at the ends, step by a "page" of cards
function initNewScroller() {
  const track = document.querySelector("[data-new-track]");
  const prev = document.querySelector("[data-new-prev]");
  const next = document.querySelector("[data-new-next]");
  if (!track || !prev || !next) return;

  const step = () => {
    const card = track.firstElementChild;
    const w = card ? card.offsetWidth + 20 : 280;
    return w * (window.innerWidth >= 1024 ? 4 : 2);
  };
  prev.addEventListener("click", () => track.scrollBy({ left: -step() }));
  next.addEventListener("click", () => track.scrollBy({ left: step() }));

  track.addEventListener("scroll", updateNewArrows, { passive: true });
  window.addEventListener("resize", updateNewArrows);
}

function updateNewArrows() {
  const track = document.querySelector("[data-new-track]");
  const prev = document.querySelector("[data-new-prev]");
  const next = document.querySelector("[data-new-next]");
  if (!track?.children.length || !prev || !next) return;
  prev.disabled = track.scrollLeft <= 4;
  next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
}

async function renderSale() {
  const all = await getCatalogue();
  const sale = all.filter((p) => p.oldPrice != null && p.oldPrice > p.price);
  const section = document.querySelector('[data-home-section="sale"]');
  if (!section) return;
  if (!sale.length) {
    section.hidden = true;
    return;
  }
  const biggestCut = Math.max(
    ...sale.map((p) => Math.round((1 - p.price / p.oldPrice) * 100)),
  );
  section.querySelectorAll("[data-sale-count]").forEach((el) => {
    el.textContent = sale.length;
  });
  section.querySelectorAll("[data-sale-discount]").forEach((el) => {
    el.textContent = biggestCut;
  });
}

function renderStats(categories) {
  return getCatalogue().then((all) => {
    const rating =
      all.reduce((sum, p) => sum + (p.rating ?? 0), 0) / (all.length || 1);
    const set = (sel, text) =>
      document.querySelectorAll(sel).forEach((el) => {
        el.textContent = text;
      });
    set("[data-stat-pieces]", String(all.length));
    set("[data-stat-rating]", rating.toFixed(1));
    set("[data-stat-categories]", String(categories.length));
  });
}

// ---------- scroll-reveal (classes applied via JS so no-JS users see all) ----------

function initReveal() {
  const targets = document.querySelectorAll("[data-reveal]");
  if (!targets.length) return;

  if (!("IntersectionObserver" in window)) return; // keep everything visible
  targets.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${Math.min(i * 60, 240)}ms`;
  });
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("reveal-visible");
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  targets.forEach((el) => io.observe(el));
}

// hide a dynamic section when its data never arrives (API down, empty data)
function hideSection(name) {
  const section = document.querySelector(`[data-home-section="${name}"]`);
  if (section) section.hidden = true;
}

const safe = (label, fn) =>
  Promise.resolve()
    .then(fn)
    .catch((err) => {
      console.error(`[home] ${label} failed:`, err);
      hideSection(label);
    });

// ---------- entry ----------

export function initHome() {
  // hero and sections run in parallel — but "featured" awaits the hero first,
  // so its grid can skip the products the hero carousel already shows
  const heroReady = Promise.resolve(initHeroCarousel()).catch(() => {});
  initReveal();
  initNewScroller();

  Promise.all([getCatalogue(), apiGet("/categories")])
    .then(async ([products, categories]) => {
      await safe("categories", () => renderCategories(categories));

      await safe("featured", async () => {
        await heroReady;
        const pool = products.filter(sellable);
        // skip whatever the hero carousel is already showing
        const rest = pool.filter((p) => !heroPickIds.has(p.id));
        featuredProducts = pickSpread(rest, 4, { exclude: heroPickIds });
        if (featuredProducts.length < 4)
          featuredProducts = pickSpread(pool, 4, { exclude: heroPickIds });
        renderFeatured();
      });

      await safe("new", () => {
        newProducts = products
          .filter((p) => p.isNew && sellable(p))
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 8);
        renderNewArrivals();
      });

      await safe("sale", () => renderSale());
      await safe("story", () => renderStats(categories));
    })
    .catch((err) => {
      console.error("[home] catalogue unavailable:", err);
      ["categories", "featured", "new", "sale", "story"].forEach(hideSection);
    });

  // prices inside the two product sections follow the EUR/USD switch
  onCurrencyChange(() => {
    renderFeatured();
    renderNewArrivals();
  });
}
