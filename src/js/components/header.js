// src/js/components/header.js
import { apiGet } from "../api/client.js";
import { toggleTheme, currentTheme } from "../services/theme.js";

// Brand mark: armchair line icon (lucide), inherits color via currentColor
const armchair = `
<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"
     fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/>
  <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"/>
  <path d="M5 18v2"/><path d="M19 18v2"/>
</svg>`;

const chevron = `
<svg data-chevron class="h-4 w-4 transition-transform" xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
  <path d="m6 9 6 6 6-6"/>
</svg>`;

const headerHTML = `
<header class="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur">
  <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">

    <!-- logo: furniture mark + wordmark -->
    <a href="/index.html" class="flex items-center gap-2 text-ink">
      <span class="text-accent-text">${armchair}</span>
      <span class="font-display text-2xl tracking-[0.18em]">DECORIA</span>
    </a>

    <!-- desktop nav -->
    <nav class="hidden items-center gap-1 md:flex">

      <!-- Shop dropdown: categories are fetched from the API -->
      <div class="relative" data-dropdown>
        <button type="button" data-dropdown-btn aria-expanded="false"
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink transition hover:bg-accent-soft">
          Shop ${chevron}
        </button>
        <div data-dropdown-panel class="hidden absolute left-0 top-full mt-1 w-56 rounded-xl border border-line bg-card p-2 shadow-xl">
          <a href="/pages/shop.html" class="block rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-accent-soft">All Products</a>
          <div data-categories></div>
        </div>
      </div>

      <!-- Collections dropdown: curated entry points (filters come in the filters phase) -->
      <div class="relative" data-dropdown>
        <button type="button" data-dropdown-btn aria-expanded="false"
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink transition hover:bg-accent-soft">
          Collections ${chevron}
        </button>
        <div data-dropdown-panel class="hidden absolute left-0 top-full mt-1 w-56 rounded-xl border border-line bg-card p-2 shadow-xl">
          <a href="/pages/shop.html?filter=new" class="block rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-accent-soft">New Arrivals</a>
          <a href="/pages/shop.html?filter=sale" class="block rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-accent-soft">On Sale</a>
          <a href="/pages/shop.html?filter=featured" class="block rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-accent-soft">Hot Items</a>
        </div>
      </div>

      <a href="/pages/shop.html" class="rounded-lg px-3 py-2 text-sm font-medium text-ink transition hover:bg-accent-soft">About</a>
    </nav>

    <!-- action icons -->
    <div class="flex items-center gap-1">
      <button type="button" aria-label="Search"
        class="hidden rounded-lg p-2 text-ink transition hover:bg-accent-soft sm:block">
        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </button>

      <!-- theme toggle: shows the icon of the mode you will switch TO -->
      <button id="theme-toggle" type="button" aria-label="Toggle dark mode"
        class="rounded-lg p-2 text-ink transition hover:bg-accent-soft">
        <svg data-icon-sun class="hidden h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></svg>
        <svg data-icon-moon class="hidden h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      </button>

      <a href="/pages/cart.html" aria-label="Cart" class="relative rounded-lg p-2 text-ink transition hover:bg-accent-soft">
        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <span id="cart-count" class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-surface">0</span>
      </a>

      <button id="menu-btn" type="button" aria-label="Menu" class="rounded-lg p-2 text-ink transition hover:bg-accent-soft md:hidden">
        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>
    </div>
  </div>

  <!-- mobile menu: native <details> accordions, zero extra JS -->
  <nav id="mobile-menu" class="hidden border-t border-line px-4 py-2 md:hidden">
    <details class="border-b border-line py-1">
      <summary class="flex cursor-pointer items-center justify-between py-3 text-sm font-medium text-ink">Shop</summary>
      <div class="pb-2">
        <a href="/pages/shop.html" class="block rounded-lg px-3 py-2 text-sm text-muted">All Products</a>
        <div data-categories></div>
      </div>
    </details>
    <details class="border-b border-line py-1">
      <summary class="flex cursor-pointer items-center justify-between py-3 text-sm font-medium text-ink">Collections</summary>
      <div class="pb-2">
        <a href="/pages/shop.html?filter=new" class="block rounded-lg px-3 py-2 text-sm text-muted">New Arrivals</a>
        <a href="/pages/shop.html?filter=sale" class="block rounded-lg px-3 py-2 text-sm text-muted">On Sale</a>
        <a href="/pages/shop.html?filter=featured" class="block rounded-lg px-3 py-2 text-sm text-muted">Hot Items</a>
      </div>
    </details>
    <a href="/pages/shop.html" class="block py-3 text-sm font-medium text-ink">About</a>
  </nav>
</header>
`;

// one link builder reused for the desktop panel and the mobile accordion
const categoryLink = (c) =>
  `<a href="/pages/shop.html?category=${c.slug}" class="block rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-accent-soft">${c.name}</a>`;

export function initHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return;

  mount.outerHTML = headerHTML;
  const headerEl = document.querySelector("header");

  /* ---- dropdowns: click to open, outside-click / Escape to close ---- */
  const dropdowns = headerEl.querySelectorAll("[data-dropdown]");
  const closeAll = (except) =>
    dropdowns.forEach((d) => {
      if (d === except) return;
      d.querySelector("[data-dropdown-panel]").classList.add("hidden");
      d.querySelector("[data-dropdown-btn]").setAttribute(
        "aria-expanded",
        "false",
      );
    });

  dropdowns.forEach((d) => {
    const btn = d.querySelector("[data-dropdown-btn]");
    const panel = d.querySelector("[data-dropdown-panel]");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = panel.classList.contains("hidden");
      closeAll(d);
      panel.classList.toggle("hidden", !willOpen);
      btn.setAttribute("aria-expanded", String(willOpen));
      btn
        .querySelector("[data-chevron]")
        ?.classList.toggle("rotate-180", willOpen);
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-dropdown]")) closeAll();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });

  /* ---- mobile menu ---- */
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  menuBtn?.addEventListener("click", () =>
    mobileMenu.classList.toggle("hidden"),
  );

  /* ---- theme toggle: sync sun/moon icons with the current theme ---- */
  const syncThemeIcons = () => {
    const dark = currentTheme() === "dark";
    headerEl
      .querySelector("[data-icon-sun]")
      ?.classList.toggle("hidden", !dark);
    headerEl
      .querySelector("[data-icon-moon]")
      ?.classList.toggle("hidden", dark);
  };
  document
    .getElementById("theme-toggle")
    ?.addEventListener("click", toggleTheme);
  window.addEventListener("themechange", syncThemeIcons);
  syncThemeIcons();

  /* ---- data-driven nav: fill both Shop panels from the API ---- */
  apiGet("/categories")
    .then((cats) => {
      headerEl.querySelectorAll("[data-categories]").forEach((el) => {
        el.innerHTML = cats.map(categoryLink).join("");
      });
    })
    .catch((e) => console.warn("Nav categories not loaded:", e.message));
}
