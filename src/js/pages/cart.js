// src/js/pages/cart.js
import { apiGet } from "../api/client.js";
import { getItems, setQty, removeFromCart } from "../services/cart.js";
import { formatPrice } from "../services/currency.js";

export async function initCart() {
  const itemsEl = document.getElementById("cart-items");
  const emptyEl = document.getElementById("cart-empty");
  const gridEl = document.querySelector("main .grid"); // items + summary wrapper
  const subtotalEl = document.getElementById("cart-subtotal");

  // product cache — prices are always fetched fresh, never trusted from storage
  const catalog = new Map();

  async function syncCatalog() {
    await Promise.all(
      getItems().map(async (i) => {
        if (catalog.has(i.id)) return;
        const p = await apiGet(`/products/${i.id}`).catch(() => null);
        if (p) catalog.set(i.id, p);
        else removeFromCart(i.id); // product gone from catalog → drop the line
      }),
    );
  }

  function render() {
    // ALWAYS read fresh state from the service — this was the whole bug
    const items = getItems().filter((i) => catalog.has(i.id));

    emptyEl.classList.toggle("hidden", items.length > 0);
    gridEl.classList.toggle("hidden", items.length === 0);
    if (!items.length) return;

    itemsEl.innerHTML = items
      .map(({ id, qty }) => {
        const p = catalog.get(id);
        return `
      <div class="flex flex-wrap items-center gap-4 p-4">
        <img src="${p.images[0]}" alt="${p.name}" class="h-20 w-20 rounded-lg object-cover" />
        <div class="min-w-0 flex-1">
          <a href="/pages/product.html?id=${p.id}" class="block truncate font-medium text-ink hover:text-accent-text">${p.name}</a>
          <p class="mt-1 text-sm text-muted">${formatPrice(p.price)} each</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" data-dec="${id}" class="h-8 w-8 rounded-lg border border-line text-ink transition hover:bg-accent-soft">−</button>
          <span class="w-8 text-center text-sm font-medium text-ink">${qty}</span>
          <button type="button" data-inc="${id}" class="h-8 w-8 rounded-lg border border-line text-ink transition hover:bg-accent-soft">+</button>
        </div>
        <p class="w-24 text-right font-semibold text-ink">${formatPrice(p.price * qty)}</p>
        <button type="button" data-remove="${id}" aria-label="Remove" class="rounded-lg p-2 text-muted transition hover:text-red-600">
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>`;
      })
      .join("");

    const subtotal = items.reduce(
      (s, i) => s + catalog.get(i.id).price * i.qty,
      0,
    );
    subtotalEl.textContent = formatPrice(subtotal);
  }

  // event-driven rendering: ANY cart change (from this page or elsewhere)
  // re-renders from fresh state. No manual render() calls anywhere.
  window.addEventListener("cartchange", render);

  itemsEl.addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    const rem = e.target.closest("[data-remove]");

    if (inc || dec) {
      const id = Number(inc?.dataset.inc ?? dec?.dataset.dec);
      const item = getItems().find((i) => i.id === id);
      if (!item) return; // ← the crash guard for the old cart.js:78 bug
      setQty(id, item.qty + (inc ? 1 : -1));
    }
    if (rem) removeFromCart(rem.dataset.remove);
  });

  await syncCatalog();
  render();
}
