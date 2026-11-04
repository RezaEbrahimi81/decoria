// src/js/pages/home.js — everything on index.html
//
// Hero       → scene carousel behind a synced product-card carousel
//              (template: ecommerce-hero3): the big wall cycles through
//              room scenes, the small card walks through the catalogue
//              pieces that live inside the current scene (HERO_SCENES)
// Sections (each optional — hidden gracefully if the API or data is missing):
//   1. Shop by Category   → dynamic cover grid, one card per category
//   2. Curator's Picks    → featured grid (spread across categories)
//   3. The Decoria Edit   → static story + live catalogue stats
//   4. New Arrivals       → horizontal snap scroller
//   5. Seasonal Sale      → dark banner with live sale count / biggest cut
//   6. Fairs marquee      → static
//   7. Testimonials       → static

import { apiGet } from "../api/client.js";
import { createProductCard } from "../components/product-card.js";
import { formatPrice, onCurrencyChange } from "../services/currency.js";

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

// ---------- hero: scene carousel + synced product card ----------

const PRODUCT_INTERVAL = 4800; // ms each piece stays on the card

// The big wall behind the copy is itself a carousel of room scenes; each
// scene lists the pieces of OUR catalogue that live inside that photo, and
// the small card carousel walks through them one by one. When the last piece
// of a scene has been shown, the wall itself turns to the next room.
//  - { id: N }            → exact product (verified against the photo)
//  - { match, pick }      → runtime pick (adapts when db.json changes)
const HERO_SCENES = [
  {
    image: "/src/assets/images/hero/scene-dining-room.jpg",
    label: "The Dining Room",
    alt: "Mid-century dining room with a rosewood dining suite, flat-weave rug and PH chandelier",
    products: [
      { id: 29 }, // Oxford dining set — the table & chairs in the centre
      { id: 116 }, // Sideboard model 2106 — against the back wall
      { id: 6 }, // Aalto armchair 42 — in the right corner
      { match: /rug/i, category: "textile", pick: 0 }, // the rug under the table
    ],
  },
  {
    image: "/src/assets/images/banners/fairs-pad-london-october-2024.jpg",
    label: "PAD London",
    alt: "Modernity booth at PAD London with leather easy chairs, PH pendants and a flat-weave rug",
    products: [
      { id: 32 }, // pair of leather easy chairs — the two wingbacks
      { id: 148 }, // PH 4/4 pendant — the lamps hanging above
      { match: /rug/i, category: "textile", pick: 1 }, // the booth rug
    ],
  },
  {
    image: "/src/assets/images/banners/fairs-tefaf-maastricht-2019.jpg",
    label: "TEFAF Maastricht",
    alt: "Modernity booth at TEFAF Maastricht with a blue wall, brass wall spots and ceramics",
    products: [
      { id: 152 }, // brass wall spots — the spotlights on the blue wall
      { id: 222 }, // Tyra Lundgren plate — the decorative wall plates
      { id: 24 }, // Otto Schulz easy chair — the cream wingback
    ],
  },
];

const heroPickIds = new Set(); // shown in the hero → excluded from featured grid
let heroPlaylist = []; // [{ scene, product }] — kept for currency re-renders

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

// descriptions read like “…designed by Arne Norell, with…” — lift the name
function designerOf(p) {
  const m = /designed by\s+(.+?)(?:\s+for\s+[A-Z]|[,.;]|$)/.exec(
    p.description ?? "",
  );
  const name = m?.[1]?.trim() ?? "";
  return name.length <= 42 ? name : "";
}

function renderHeroPrices() {
  document.querySelectorAll("[data-hero-price]").forEach((el) => {
    const entry = heroPlaylist[Number(el.dataset.index)];
    if (entry) el.textContent = formatPrice(entry.product.price);
  });
}

function resolveSceneProducts(scene, catalogue) {
  return scene.products
    .map((sel) => {
      let p = null;
      if (sel.id != null) {
        p = catalogue.find((x) => Number(x.id) === Number(sel.id));
      } else if (sel.match) {
        const hits = catalogue.filter(
          (x) =>
            sel.match.test(x.name) &&
            (!sel.category || x.category === sel.category) &&
            sellable(x),
        );
        p = hits[sel.pick ?? 0] ?? null;
      }
      return p && sellable(p) ? p : null;
    })
    .filter(Boolean);
}

function renderHero(products) {
  const root = document.querySelector("[data-hero-showcase]");
  const scenesWrap = document.querySelector("[data-hero-scenes]");
  const label = document.querySelector("[data-hero-scene-label]");
  const chip = document.querySelector("[data-hero-count]");
  const cardWrap = document.querySelector("[data-hero-card-wrap]");
  const card = document.querySelector("[data-hero-card]");
  const dotsWrap = document.querySelector("[data-hero-dots]");
  if (chip) chip.textContent = products.length;
  if (!root || !scenesWrap || !card || !cardWrap) return;

  // resolve scenes against the live catalogue; a scene with no pieces in
  // stock simply doesn't make it onto the wall
  const scenes = HERO_SCENES.map((s) => ({
    ...s,
    items: resolveSceneProducts(s, products),
  })).filter((s) => s.items.length);
  if (!scenes.length) return; // keep the standby photograph, skip the chrome

  // scene layers (the standby image inside scenesWrap is replaced wholesale)
  scenesWrap.innerHTML = scenes
    .map(
      (s, i) => `
      <figure class="hero-slide${i === 0 ? " is-active" : ""}" aria-hidden="${i !== 0}">
        <img src="${s.image}" alt="${esc(s.alt)}"
             ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"
             class="absolute inset-0 h-full w-full object-cover" />
      </figure>`,
    )
    .join("");

  // flat playlist: every piece of every scene, in order
  heroPlaylist = scenes.flatMap((s, si) =>
    s.items.map((product) => ({ scene: si, product })),
  );
  heroPickIds.clear();
  heroPlaylist.forEach((e) => heroPickIds.add(e.product.id));

  cardWrap.hidden = false;
  dotsWrap.innerHTML = scenes
    .map(
      (s, i) =>
        `<button type="button" data-hero-dot="${i}" aria-label="Show ${esc(s.label)}"
          class="hero-dot${i === 0 ? " is-active" : ""}"></button>`,
    )
    .join("");

  const sceneFigs = [...scenesWrap.querySelectorAll(".hero-slide")];
  const dotEls = [...dotsWrap.querySelectorAll(".hero-dot")];
  const bar = root.querySelector("[data-hero-progress]");
  const noMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let index = 0;
  let curScene = -1;
  let timer = null;

  function paintCard(entry, i) {
    const p = entry.product;
    const designer = designerOf(p);
    card.innerHTML = `
      <div class="relative overflow-hidden rounded-xl bg-surface">
        <img src="${p.images[0]}" alt="${esc(p.name)}" loading="lazy" decoding="async"
             onerror="this.src='${PLACEHOLDER}'"
             class="aspect-square w-full object-cover" />
      </div>
      <button type="button" data-quick-view="${p.id}"
        class="mt-3 w-full rounded-lg bg-ink py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-surface transition hover:bg-accent hover:text-accent-fg">
        Quick View
      </button>
      <div class="mt-3 flex items-end justify-between gap-3 px-1 pb-1">
        <a href="/pages/product.html?id=${p.id}" class="min-w-0">
          <h3 class="line-clamp-2 text-sm font-semibold leading-snug text-ink transition hover:text-accent-text">${esc(p.name)}</h3>
          ${designer ? `<p class="mt-0.5 text-xs text-muted">designed by ${esc(designer)}</p>` : ""}
        </a>
        <span class="shrink-0 text-sm font-bold text-accent-text" data-hero-price data-index="${i}">${formatPrice(p.price)}</span>
      </div>`;
    card.classList.remove("is-in");
    void card.offsetWidth; // reflow → the entrance animation replays
    card.classList.add("is-in");
  }

  function go(next) {
    index =
      ((next % heroPlaylist.length) + heroPlaylist.length) %
      heroPlaylist.length;
    const entry = heroPlaylist[index];

    if (entry.scene !== curScene) {
      curScene = entry.scene;
      sceneFigs.forEach((f, i) => {
        f.classList.toggle("is-active", i === curScene);
        f.setAttribute("aria-hidden", String(i !== curScene));
      });
      if (label) label.textContent = scenes[curScene].label;
      dotEls.forEach((d, i) => d.classList.toggle("is-active", i === curScene));
    }

    paintCard(entry, index);
    restartBar();
  }

  const restartBar = () => {
    if (noMotion || !bar) return;
    bar.classList.remove("is-running");
    void bar.offsetWidth;
    bar.classList.add("is-running");
  };
  const restartTimer = () => {
    clearInterval(timer);
    if (noMotion) return;
    timer = setInterval(() => go(index + 1), PRODUCT_INTERVAL);
  };
  const pause = () => {
    clearInterval(timer);
    timer = null;
    bar?.classList.add("is-paused");
  };
  const resume = () => {
    if (timer || noMotion) return;
    bar?.classList.remove("is-paused");
    restartBar();
    restartTimer();
  };

  root.querySelector("[data-hero-card-prev]").addEventListener("click", () => {
    go(index - 1);
    restartTimer();
  });
  root.querySelector("[data-hero-card-next]").addEventListener("click", () => {
    go(index + 1);
    restartTimer();
  });
  dotEls.forEach((d, i) =>
    d.addEventListener("click", () => {
      go(heroPlaylist.findIndex((e) => e.scene === i));
      restartTimer();
    }),
  );

  // hovering the card (or focusing it) pauses the show; tab switch too
  cardWrap.addEventListener("mouseenter", pause);
  cardWrap.addEventListener("mouseleave", resume);
  cardWrap.addEventListener("focusin", pause);
  cardWrap.addEventListener("focusout", resume);
  document.addEventListener("visibilitychange", () =>
    document.hidden ? pause() : resume(),
  );

  go(0);
  restartTimer();
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
             class="aspect-4/3 w-full object-cover transition duration-500 group-hover:scale-105" />
        <div class="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" aria-hidden="true"></div>
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
    <div class="w-55 shrink-0 snap-start sm:w-62.5">
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
  initReveal();
  initNewScroller();

  Promise.all([getCatalogue(), apiGet("/categories")])
    .then(async ([products, categories]) => {
      await safe("hero", () => renderHero(products));
      await safe("categories", () => renderCategories(categories));

      await safe("featured", () => {
        // keep the featured grid complementary to the hero slideshow
        const rest = products
          .filter(sellable)
          .filter((p) => !heroPickIds.has(p.id));
        featuredProducts = pickSpread(rest, 4);
        if (featuredProducts.length < 4)
          featuredProducts = pickSpread(products.filter(sellable), 4);
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
      // the hero keeps its standby photograph — a quiet image beats a blank wall
    });

  // prices in the hero captions and both product sections follow the EUR/USD switch
  onCurrencyChange(() => {
    renderHeroPrices();
    renderFeatured();
    renderNewArrivals();
  });
}
