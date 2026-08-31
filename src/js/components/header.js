const headerHTML = `
<header class="sticky top-0 z-50 border-b border-neutral-200 bg-surface/90 backdrop-blur">
  <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">

    <a href="/index.html" class="font-display text-2xl tracking-widest text-primary">
      DECORIA
    </a>

    <nav class="hidden items-center gap-8 md:flex">
      <a href="/pages/shop.html" class="text-sm font-medium text-neutral-700 transition hover:text-primary">Shop</a>
      <a href="/pages/shop.html?category=decor" class="text-sm font-medium text-neutral-700 transition hover:text-primary">Decor</a>
      <a href="/pages/shop.html?category=home-office" class="text-sm font-medium text-neutral-700 transition hover:text-primary">Office</a>
    </nav>

    <div class="flex items-center gap-4">
      <button type="button" aria-label="Search" class="text-neutral-700 transition hover:text-accent">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      <a href="/pages/cart.html" aria-label="Cart" class="relative text-neutral-700 transition hover:text-accent">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <span id="cart-count" class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
          0
        </span>
      </a>

      <button id="menu-btn" type="button" aria-label="Menu" class="text-neutral-700 md:hidden">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>
    </div>
  </div>

  <nav id="mobile-menu" class="hidden border-t border-neutral-200 md:hidden">
    <a href="/pages/shop.html" class="block px-4 py-3 text-sm text-neutral-700 hover:bg-white">Shop</a>
    <a href="/pages/shop.html?category=decor" class="block px-4 py-3 text-sm text-neutral-700 hover:bg-white">Decor</a>
    <a href="/pages/shop.html?category=home-office" class="block px-4 py-3 text-sm text-neutral-700 hover:bg-white">Office</a>
  </nav>
</header>
`;

export function initHeader() {
  const mount = document.getElementById("site-header");
  if (!mount) return;

  // placeholder با هدر واقعی جایگزین می‌شود
  mount.outerHTML = headerHTML;

  // حالا که هدر توی DOM هست، می‌تونیم listener ببندیم
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  if (!menuBtn || !mobileMenu) return;

  menuBtn.addEventListener("click", () =>
    mobileMenu.classList.toggle("hidden"),
  );
}
