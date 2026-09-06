// Singleton product-preview dialog — PERMANENTLY MOUNTED.
// Open/close only animates the ROOT's opacity and toggles pointer-events.
// Includes an auto+manual image carousel for the product's angle shots.

import { apiGet } from "../api/client.js";
import { formatPrice } from "../services/currency.js";
import { showToast } from "./toast.js";

const PLACEHOLDER = "/src/assets/images/products/_placeholder.jpg";
const AUTOPLAY_MS = 3000;

const markup = `
<div id="quick-view" aria-hidden="true" data-open="false"
  class="fixed inset-0 z-[900] flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-200 will-change-opacity">
  <!-- backdrop -->
  <div data-qv-backdrop class="absolute inset-0 bg-black/50"></div>

  <!-- panel -->
  <div data-qv-panel class="relative w-full max-w-3xl rounded-xl bg-card ring-1 ring-line shadow-2xl">
    <button type="button" data-qv-close aria-label="Close"
      class="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-card text-ink shadow-sm transition hover:bg-accent-soft">
      <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
    <div data-qv-body class="grid grid-cols-1 sm:grid-cols-2"><!-- filled by JS --></div>
  </div>
</div>`;

// ---------- carousel ----------

function carouselHTML(images) {
  const safe = images.length ? images : [PLACEHOLDER];
  return `
  <div class="relative aspect-square overflow-hidden sm:rounded-l-xl" data-carousel>
    <div data-track class="flex h-full w-full transition-transform duration-500 ease-out">
      ${safe
        .map(
          (src) => `
        <img src="${src}" alt="" onerror="this.src='${PLACEHOLDER}'"
             class="h-full w-full shrink-0 object-cover" />`,
        )
        .join("")}
    </div>

    <!-- prev / next -->
    <button type="button" data-prev aria-label="Previous image"
      class="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-ink shadow-sm transition hover:bg-card disabled:opacity-40">
      <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <button type="button" data-next aria-label="Next image"
      class="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-ink shadow-sm transition hover:bg-card disabled:opacity-40">
      <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
    </button>

    <!-- dots -->
    <div data-dots class="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
      ${safe
        .map(
          (_, i) => `
        <button type="button" data-dot="${i}" aria-label="Go to image ${i + 1}"
          class="h-1.5 rounded-full transition-all duration-300
                 ${i === 0 ? "w-6 bg-accent" : "w-1.5 bg-white/70"}"></button>`,
        )
        .join("")}
    </div>
  </div>`;
}

function initCarousel(root, images) {
  const safe = images.length ? images : [PLACEHOLDER];
  const track = root.querySelector("[data-track]");
  const prev = root.querySelector("[data-prev]");
  const next = root.querySelector("[data-next]");
  const dots = [...root.querySelectorAll("[data-dot]")];

  const count = safe.length;
  let index = 0;
  let timer = null;

  const render = () => {
    track.style.transform = `translateX(-${index * 100}%)`;

    dots.forEach((d, i) => {
      d.className = `h-1.5 rounded-full transition-all duration-300 ${
        i === index ? "w-6 bg-accent" : "w-1.5 bg-white/70"
      }`;
    });

    // with a single image there is nowhere to go — disable arrows
    prev.disabled = count <= 1;
    next.disabled = count <= 1;
  };

  const go = (i) => {
    index = (i + count) % count; // loop around both ends
    render();
  };

  const stopAuto = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const startAuto = () => {
    stopAuto();
    if (count > 1) timer = setInterval(() => go(index + 1), AUTOPLAY_MS);
  };

  // manual interaction: navigate, then restart autoplay (user keeps control)
  const manual = (i) => {
    go(i);
    startAuto();
  };

  prev.addEventListener("click", () => manual(index - 1));
  next.addEventListener("click", () => manual(index + 1));
  dots.forEach((d, i) => d.addEventListener("click", () => manual(i)));

  render();
  startAuto();

  return { stop: stopAuto }; // closeQuickView() calls this
}

// ---------- modal core ----------

function bodyHTML(p) {
  const soldOut = !p.inStock;

  const price = `
    <p class="mt-3 flex items-baseline gap-2">
      ${p.oldPrice ? `<del class="text-sm text-muted">${formatPrice(p.oldPrice)}</del>` : ""}
      <span class="text-xl font-semibold ${p.oldPrice && !soldOut ? "text-red-600" : "text-ink"}">${formatPrice(p.price)}</span>
    </p>`;

  return `
    <div data-carousel-slot></div>
    <div class="p-6">
      <p class="text-xs font-semibold uppercase tracking-widest text-muted">${p.subcategory}</p>
      <h3 class="mt-1 font-display text-2xl leading-snug text-ink">${p.name}</h3>

      <div class="mt-2 flex items-center gap-1.5 text-sm">
        <span class="text-amber-500" aria-hidden="true">
          ${Array.from({ length: 5 }, (_, i) => (i < Math.round(p.rating) ? "★" : "☆")).join("")}
        </span>
        <span class="text-muted">${p.rating.toFixed(1)}</span>
      </div>

      ${price}
      <p class="mt-4 line-clamp-4 text-sm leading-6 text-muted">${p.description}</p>

      <p class="mt-4 text-sm font-medium ${soldOut ? "text-red-600" : "text-accent-text"}">
        ${soldOut ? "● Out of stock" : "● In stock"}
      </p>

      <div class="mt-5 flex gap-2">
        <button type="button" data-add-to-cart="${p.id}" ${soldOut ? "disabled" : ""}
          class="flex-1 bg-accent py-2.5 text-sm font-medium text-accent-fg transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-line disabled:text-muted">
          Add to Cart
        </button>
        <a href="/pages/product.html?id=${p.id}"
          class="flex-1 border border-line py-2.5 text-center text-sm font-medium text-ink transition hover:bg-accent-soft">
          Full Details
        </a>
      </div>
    </div>`;
}

let openedFrom = null; // a11y: restore focus here on close
let carousel = null; // { stop } while the modal is open

function open(p) {
  const root = document.getElementById("quick-view");
  const body = root.querySelector("[data-qv-body]");

  body.innerHTML = bodyHTML(p);

  // inject the carousel markup into the slot, THEN wire it up
  const slot = body.querySelector("[data-carousel-slot]");
  slot.innerHTML = carouselHTML(p.images ?? []);
  carousel = initCarousel(slot, p.images ?? []);

  root.setAttribute("data-open", "true");
  root.removeAttribute("aria-hidden");
  root.classList.remove("opacity-0", "pointer-events-none");
}

export function closeQuickView() {
  const root = document.getElementById("quick-view");
  if (root.getAttribute("data-open") !== "true") return;

  root.setAttribute("data-open", "false");
  root.setAttribute("aria-hidden", "true");
  root.classList.add("opacity-0", "pointer-events-none");

  carousel?.stop(); // ← kill autoplay so it never runs while hidden
  carousel = null;

  // a11y: restore focus WITHOUT scrolling — plain focus() would scroll the
  // card's overflow-hidden image container to reveal the parked button,
  // cropping the product image (the "green crop" bug).
  openedFrom?.focus({ preventScroll: true });
  openedFrom = null;
}

export function initQuickView() {
  if (document.getElementById("quick-view")) return;
  document.body.insertAdjacentHTML("beforeend", markup);
  const root = document.getElementById("quick-view");

  // close paths: backdrop click, X button, Escape
  root
    .querySelector("[data-qv-backdrop]")
    .addEventListener("click", closeQuickView);
  root
    .querySelector("[data-qv-close]")
    .addEventListener("click", closeQuickView);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeQuickView();
  });

  // one delegated listener catches every Quick View button,
  // including product cards rendered later (async)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-quick-view]");
    if (!btn) return;
    openedFrom = btn;
    apiGet(`/products/${btn.dataset.quickView}`)
      .then(open)
      .catch((err) => {
        console.error("Quick view load failed:", err);
        showToast("Could not load product");
      });
  });
}
