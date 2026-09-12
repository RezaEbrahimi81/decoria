import { apiGet } from "../api/client.js";
import { toggleTheme, currentTheme } from "../services/theme.js";
import { getCount } from "../services/cart.js";

const icons = {
  armchair: `<svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>`,
  home: `<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/></svg>`,
  shop: `<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7h20l-1.5 12a2 2 0 0 1-2 1.7H5.5a2 2 0 0 1-2-1.7Z"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg>`,
  collection: `<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>`,
  help: `<svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
  search: `<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  sun: `<svg data-icon-sun class="hidden h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></svg>`,
  moon: `<svg data-icon-moon class="hidden h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  cart: `<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  user: `<svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>`,
  chevron: `<svg data-chevron class="h-3.5 w-3.5 transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>`,
};

// nav item: text is EXPLICITLY ink (readable in both themes);
// the active state tints text AND its icon
function navItem({ id, href, label, icon, dropdown = null }) {
  return `
  <li class="relative" data-nav-item ${dropdown ? "data-hover-menu" : ""}>
    ${
      dropdown
        ? `
    <button type="button" aria-haspopup="true" data-menu-btn
      class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink transition">
      <span class="text-muted">${icon}</span>${label}${icons.chevron}
    </button>
    ${dropdown}`
        : `
    <a href="${href}" data-nav-link="${id}"
      class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink transition">
      <span class="text-muted">${icon}</span>${label}
    </a>`
    }
  </li>`;
}

// Shop mega panel — subcategory flyouts are PURE CSS (named group), zero JS
function shopMegaPanel(cats) {
  return `
  <div data-panel class="invisible absolute left-0 top-full z-50 w-[36rem] -translate-y-1 rounded-xl border border-line bg-card p-4 opacity-0 shadow-xl transition-all duration-200 data-[open=true]:visible data-[open=true]:translate-y-0 data-[open=true]:opacity-100">
    <a href="/pages/shop.html" class="mb-3 block text-sm font-semibold text-accent-text hover:underline">View all products →</a>
    <div class="grid grid-cols-2 gap-1 md:grid-cols-4">
      ${cats
        .map((c, i) => {
          const subs = c.subcategories ?? [];
          const flyLeft = i % 4 >= 2; // columns 3 & 4 fly out to the LEFT
          return `
        <div class="group/c relative rounded-lg p-2 transition hover:bg-accent-soft">
          <a href="/pages/shop.html?category=${c.slug}" class="block text-sm font-medium text-ink">${c.name}</a>
          ${
            subs.length
              ? `
          <div class="invisible absolute top-0 z-10 w-44 rounded-xl border border-line bg-card p-2 opacity-0 shadow-xl transition-all duration-150 group-hover/c:visible group-hover/c:opacity-100 ${flyLeft ? "right-full mr-2" : "left-full -ml-2"}">
            ${subs
              .map(
                (s) => `
              <a href="/pages/shop.html?category=${c.slug}&subcategory=${s.slug}"
                 class="block rounded-lg px-2 py-1.5 text-xs text-muted transition hover:bg-accent-soft hover:text-accent-text">${s.name}</a>`,
              )
              .join("")}
          </div>`
              : ""
          }
        </div>`;
        })
        .join("")}
    </div>
  </div>`;
}

const collectionsPanel = `
  <div data-panel class="invisible absolute left-0 top-full z-50 w-52 -translate-y-1 rounded-xl border border-line bg-card p-2 opacity-0 shadow-xl transition-all duration-200 data-[open=true]:visible data-[open=true]:translate-y-0 data-[open=true]:opacity-100">
    <a href="/pages/shop.html?filter=new" class="block rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-accent-soft">New Arrivals</a>
    <a href="/pages/shop.html?filter=sale" class="block rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-accent-soft">On Sale</a>
    <a href="/pages/shop.html?filter=featured" class="block rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-accent-soft">Hot Items</a>
  </div>`;

const helpPanel = `
  <div data-panel class="invisible absolute left-0 top-full z-50 w-52 -translate-y-1 rounded-xl border border-line bg-card p-2 opacity-0 shadow-xl transition-all duration-200 data-[open=true]:visible data-[open=true]:translate-y-0 data-[open=true]:opacity-100">
    <a href="#" class="block rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-accent-soft">Contact Us</a>
    <a href="#" class="block rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-accent-soft">FAQ</a>
    <a href="#" class="block rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-accent-soft">Shipping &amp; Returns</a>
  </div>`;

const headerHTML = `
<header class="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur">
  <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">

    <a href="/index.html" class="flex items-center gap-2 text-ink">
      <span class="text-accent-text">${icons.armchair}</span>
      <span class="font-display text-2xl tracking-[0.18em]">DECORIA</span>
    </a>

    <nav aria-label="Main" class="hidden md:block">
      <ul class="flex items-center gap-1">
        ${navItem({ id: "home", href: "/index.html", label: "Home", icon: icons.home })}
        <li class="relative" data-nav-item data-hover-menu>
          <button type="button" aria-haspopup="true" data-menu-btn
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink transition">
            <span class="text-muted">${icons.shop}</span>Shop${icons.chevron}
          </button>
          <div data-panel-slot></div>
        </li>
        <li class="relative" data-nav-item data-hover-menu>
          <button type="button" aria-haspopup="true" data-menu-btn
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink transition">
            <span class="text-muted">${icons.collection}</span>Collections${icons.chevron}
          </button>
          ${collectionsPanel}
        </li>
        ${navItem({ id: "help", label: "Help", icon: icons.help, dropdown: helpPanel })}
      </ul>
    </nav>

    <div class="flex items-center gap-1">
      <button type="button" aria-label="Search" class="hidden rounded-lg p-2 text-ink transition hover:bg-accent-soft sm:block">${icons.search}</button>
      <button id="theme-toggle" type="button" aria-label="Toggle dark mode" class="rounded-lg p-2 text-ink transition hover:bg-accent-soft">${icons.sun}${icons.moon}</button>
      <a href="/pages/account.html" aria-label="Account" class="hidden rounded-lg p-2 text-ink transition hover:bg-accent-soft sm:block">${icons.user}</a>
      <a href="/pages/cart.html" aria-label="Cart" class="relative rounded-lg p-2 text-ink transition hover:bg-accent-soft">${icons.cart}
        <span id="cart-count" class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-fg">0</span>
      </a>
      <button id="menu-btn" type="button" aria-label="Menu" class="rounded-lg p-2 text-ink transition hover:bg-accent-soft md:hidden">
        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>
    </div>
  </div>

  <!-- mobile menu -->
  <nav id="mobile-menu" class="hidden border-t border-line px-4 py-2 md:hidden">
    <a href="/index.html" class="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink">Home</a>
    <a href="/pages/shop.html" class="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink">Shop</a>
    <a href="/pages/shop.html?filter=new" class="block rounded-lg px-3 py-2.5 text-sm text-muted">New Arrivals</a>
    <a href="/pages/shop.html?filter=sale" class="block rounded-lg px-3 py-2.5 text-sm text-muted">On Sale</a>
    <a href="#" class="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink">Help</a>
  </nav>
</header>
`;

export function initHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return;
  mount.outerHTML = headerHTML;
  const headerEl = document.querySelector("header");

  /* ---------- hover menus: panel is queried AT EVENT TIME,
     so the async-injected Shop panel is picked up automatically ---------- */
  const items = headerEl.querySelectorAll("[data-hover-menu]");
  const closeAll = (except) =>
    items.forEach((li) => {
      if (li !== except) {
        li.querySelector("[data-panel]")?.removeAttribute("data-open");
        li.querySelector("[data-menu-btn]")?.setAttribute(
          "aria-expanded",
          "false",
        );
      }
    });

  items.forEach((li) => {
    const btn = li.querySelector("[data-menu-btn]");
    const show = () => {
      closeAll(li);
      li.querySelector("[data-panel]")?.setAttribute("data-open", "true");
      btn?.setAttribute("aria-expanded", "true");
    };
    const hide = () => {
      li.querySelector("[data-panel]")?.removeAttribute("data-open");
      btn?.setAttribute("aria-expanded", "false");
    };
    li.addEventListener("mouseenter", show);
    li.addEventListener("mouseleave", hide);
    btn?.addEventListener("click", (e) => {
      // touch fallback
      e.stopPropagation();
      li.querySelector("[data-panel]")?.hasAttribute("data-open")
        ? hide()
        : show();
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });

  /* ---------- mobile menu ---------- */
  document
    .getElementById("menu-btn")
    ?.addEventListener("click", () =>
      headerEl.querySelector("#mobile-menu")?.classList.toggle("hidden"),
    );

  /* ---------- cart badge: reacts to any cart change ---------- */
  const syncBadge = () => {
    const badge = headerEl.querySelector("#cart-count");
    if (!badge) return;
    const n = getCount();
    badge.textContent = String(n);
    badge.classList.toggle("hidden", n === 0); // empty cart → no badge
  };
  window.addEventListener("cartchange", syncBadge);
  syncBadge();

  /* ---------- active state: tint text AND its icon ---------- */
  const markActive = (el) => {
    if (!el) return;
    el.classList.add(
      "text-accent-text",
      "underline",
      "decoration-2",
      "underline-offset-8",
      "decoration-accent-text",
    );
    el.querySelector("svg")?.classList.add("text-accent-text");
  };

  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);

  headerEl.querySelectorAll("[data-nav-link]").forEach((a) => {
    if (a.dataset.navLink === "home" && page === "home") markActive(a);
  });

  if (page === "shop") {
    const [shopBtn] = [...headerEl.querySelectorAll("[data-menu-btn]")].filter(
      (b) => b.textContent.includes("Shop"),
    );
    const [collBtn] = [...headerEl.querySelectorAll("[data-menu-btn]")].filter(
      (b) => b.textContent.includes("Collections"),
    );
    params.get("filter") ? markActive(collBtn) : markActive(shopBtn);
  }

  /* ---------- theme toggle ---------- */
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

  /* ---------- data-driven Shop panel: inject, done ---------- */
  apiGet("/categories")
    .then((cats) => {
      const slot = headerEl.querySelector("[data-panel-slot]");
      if (slot) slot.outerHTML = shopMegaPanel(cats);
    })
    .catch((e) => console.warn("Nav categories not loaded:", e.message));
}
