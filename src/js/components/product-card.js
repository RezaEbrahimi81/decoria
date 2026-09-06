import { formatPrice } from "../services/currency.js";

const PLACEHOLDER = "/src/assets/images/products/_placeholder.jpg";

export function createProductCard(product) {
  const [img1, img2] = product.images;

  const soldOut = !product.inStock;

  const badge = soldOut
    ? `<span class="absolute left-2 top-2 z-10 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-fg">Sold Out</span>`
    : product.oldPrice
      ? `<span class="absolute left-2 top-2 z-10 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-white/10 dark:text-rose-200">Sale</span>`
      : "";

  const isNewBadge = product.isNew
    ? `<span class="absolute right-2 top-2 z-10 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-text">New</span>`
    : "";

  const imgStateClass = soldOut ? "opacity-70" : "";
  const swapClass = img2 && !soldOut ? "group-hover:opacity-0" : "";

  return `
    <article class="group flex flex-col overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-line transition duration-300 hover:shadow-lg">

      <!-- transform-gpu: this container gets its own GPU compositing layer,
           so stale-tile re-rasterization of the modal layer can never touch it -->
      <div class="relative aspect-square overflow-hidden bg-accent-soft transform-gpu">
        ${badge}${isNewBadge}

        <a href="/pages/product.html?id=${product.id}" aria-label="${product.name}" class="absolute inset-0 block">
          <img src="${img1 ?? PLACEHOLDER}" alt="${product.name}" loading="lazy"
               decoding="async"
               onerror="this.src='${PLACEHOLDER}'"
               class="h-full w-full object-cover transition duration-500 ${imgStateClass} ${swapClass}" />
          ${
            img2 && !soldOut
              ? `
          <img src="${img2}" alt="" aria-hidden="true" loading="lazy" decoding="async"
               class="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />`
              : ""
          }
        </a>

        <div class="absolute inset-x-0 bottom-0 flex translate-y-full flex-col gap-1 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button type="button" data-add-to-cart="${product.id}" ${soldOut ? "disabled" : ""}
            class="flex items-center justify-center gap-2 rounded-sm bg-accent py-2.5 text-sm font-medium text-accent-fg transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-line disabled:text-muted disabled:hover:bg-line">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Add to Cart
          </button>
          <button type="button" data-quick-view="${product.id}"
            class="flex items-center justify-center gap-2 rounded-sm bg-card/95 py-2.5 text-sm font-medium text-ink backdrop-blur transition hover:bg-accent-soft">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            Quick View
          </button>
        </div>
      </div>

      <div class="flex flex-1 flex-col p-4">
        <p class="text-xs font-semibold uppercase tracking-widest text-muted">${product.subcategory}</p>
        <a href="/pages/product.html?id=${product.id}"
           class="mt-1 min-h-11 font-medium leading-snug text-ink transition hover:text-accent-text line-clamp-2">
          ${product.name}
        </a>
        <p class="mt-auto flex items-baseline gap-2 whitespace-nowrap pt-3">
          ${product.oldPrice ? `<del class="text-sm text-muted">${formatPrice(product.oldPrice)}</del>` : ""}
          <span class="font-semibold ${product.oldPrice && !soldOut ? "text-red-600" : "text-ink"}">${formatPrice(product.price)}</span>
        </p>
      </div>
    </article>
  `;
}
