// Hero featured-products carousel (index.html → [data-hero-carousel])
// Design: shadcnblocks "ecommerce-hero3" adapted to Decoria.
// Shows 2 portrait product cards with a right-edge peek, arrows, and a
// Quick View bar that reuses the site-wide quick-view singleton.

import { apiGet } from "../api/client.js";
import { formatPrice, onCurrencyChange } from "../services/currency.js";

// ids currently shown in the hero — home.js reads this so the
// "Curator's Picks" grid below never repeats the same products
export const heroPickIds = new Set();

const PLACEHOLDER = "/src/assets/images/products/_placeholder.jpg";
const VISIBLE = 6; // how many products to feature

// ---------- product selection ----------

// Featured items first, spread across categories (max 2 per category)
// so the hero feels varied rather than all-lamp/all-chair.
function pickProducts(all) {
  const pool = all.filter((p) => p.inStock && p.images?.length);
  const ranked = [
    ...pool.filter((p) => p.isFeatured),
    ...pool.filter((p) => !p.isFeatured),
  ];
  const perCategory = new Map();
  const picked = [];
  for (const p of ranked) {
    const n = perCategory.get(p.category) ?? 0;
    if (n >= 2) continue;
    perCategory.set(p.category, n + 1);
    picked.push(p);
    if (picked.length === VISIBLE) break;
  }
  return picked;
}

// ---------- card markup ----------

function cardHTML(p) {
  const img = p.images[0] ?? PLACEHOLDER;
  return `
  <article class="group w-[62%] shrink-0 snap-start overflow-hidden rounded-xl bg-neutral-900 shadow-xl ring-1 ring-black/10">
    <div class="relative aspect-[3/4] overflow-hidden">
      <a href="/pages/product.html?id=${p.id}" aria-label="${p.name}" class="absolute inset-0 block">
        <img src="${img}" alt="${p.name}" loading="eager" decoding="async"
             onerror="this.src='${PLACEHOLDER}'"
             class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </a>
      <button type="button" data-quick-view="${p.id}"
        class="absolute inset-x-0 bottom-0 z-10 bg-black/55 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm transition hover:bg-accent hover:text-accent-fg">
        Quick View
      </button>
    </div>
    <div class="flex items-baseline justify-between gap-3 px-3.5 py-3">
      <a href="/pages/product.html?id=${p.id}"
         class="line-clamp-1 text-sm font-medium text-white/90 transition hover:text-white">
        ${p.name}
      </a>
      <span class="shrink-0 text-sm font-semibold text-white">${formatPrice(p.price)}</span>
    </div>
  </article>`;
}

// ---------- carousel behaviour ----------

export async function initHeroCarousel() {
  const root = document.querySelector("[data-hero-carousel]");
  if (!root) return;

  const track = root.querySelector("[data-hero-track]");
  const prevBtn = root.querySelector("[data-hero-prev]");
  const nextBtn = root.querySelector("[data-hero-next]");

  let products = [];
  let index = 0;

  // last useful position: second-to-last card (keeps the right card peeking)
  const maxIndex = () => Math.max(0, products.length - 2);

  function update() {
    if (!track.children.length) return;
    index = Math.min(Math.max(index, 0), maxIndex());
    const cards = track.children;
    const x = cards[index].offsetLeft - cards[0].offsetLeft;
    track.style.transform = `translateX(-${x}px)`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index >= maxIndex();
  }

  function render() {
    track.innerHTML = products.map(cardHTML).join("");
    update();
  }

  prevBtn.addEventListener("click", () => {
    index -= 1;
    update();
  });
  nextBtn.addEventListener("click", () => {
    index += 1;
    update();
  });
  window.addEventListener("resize", update);

  // keep prices in sync when the user switches currency (EUR/USD)
  onCurrencyChange(() => render());

  // featured first; fall back to the whole catalogue if none flagged
  const featured = await apiGet("/products?isFeatured=true").catch(() => []);
  products = pickProducts(
    featured.length ? featured : await apiGet("/products"),
  );
  heroPickIds.clear();
  products.forEach((p) => heroPickIds.add(p.id));
  if (!products.length) {
    root.hidden = true;
    return;
  }
  render();
}
