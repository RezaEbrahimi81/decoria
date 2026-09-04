// src/js/components/product-card.js

import { formatPrice } from "../services/currency.js";

export function createProductCard(product) {
  const [img1, img2] = product.images;

  const saleBadge = product.oldPrice
    ? `<span class="absolute left-2 top-2 z-10 rounded-sm bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">Sale</span>`
    : "";

  const isNewBadge = product.isNew
    ? `<span class="absolute right-2 top-2 z-10 rounded-sm bg-primary px-2 py-0.5 text-xs font-semibold text-white">New</span>`
    : "";

  return `
    <article class="group overflow-hidden rounded-xl bg-white shadow-sm transition duration-300 hover:shadow-lg">

      <!-- image area: position anchor for badges & the slide-up overlay -->
      <div class="relative overflow-hidden bg-neutral-100">
        ${saleBadge}${isNewBadge}

        <a href="/pages/product.html?id=${product.id}" aria-label="${product.name}">
          <img src="${img1}" alt="${product.name}" loading="lazy"
               class="aspect-square w-full object-cover transition duration-500 ${img2 ? "group-hover:opacity-0" : ""}" />
          ${
            img2
              ? `
          <img src="${img2}" alt="" aria-hidden="true" loading="lazy"
               class="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />`
              : ""
          }
        </a>

        <!-- overlay: parked below the image, slides UP on hover -->
        <div class="absolute inset-x-0 bottom-0 flex translate-y-full flex-col gap-1 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button type="button" data-add-to-cart="${product.id}"
            class="flex items-center justify-center gap-2 bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-black">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Add to Cart
          </button>
          <a href="/pages/product.html?id=${product.id}"
            class="flex items-center justify-center gap-2 bg-white/95 py-2.5 text-sm font-medium text-primary transition hover:bg-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            Quick View
          </a>
        </div>
      </div>

      <!-- text area -->
      <div class="p-4">
        <p class="text-xs font-semibold uppercase tracking-widest text-neutral-500">${product.subcategory}</p>
        <a href="/pages/product.html?id=${product.id}"
           class="mt-1 block font-medium leading-snug text-primary transition hover:text-accent line-clamp-2">
          ${product.name}
        </a>
        <p class="mt-2 flex items-baseline gap-2">
          ${product.oldPrice ? `<del class="text-sm text-neutral-400">${formatPrice(product.oldPrice)}</del>` : ""}
          <span class="font-semibold ${product.oldPrice ? "text-red-600" : "text-primary"}">${formatPrice(product.price)}</span>
        </p>
      </div>
    </article>
  `;
}
