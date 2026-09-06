import { apiGet } from "../api/client.js";
import {
  formatPrice,
  getCurrency,
  setCurrency,
  onCurrencyChange,
} from "../services/currency.js";

export async function initProduct() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    console.warn("No product id in URL");
    return;
  }

  const set = (elId, value) => {
    const el = document.getElementById(elId);
    if (el) el.textContent = value;
  };

  try {
    const p = await apiGet(`/products/${id}`);

    /* ---------- breadcrumb & basic info ---------- */
    set("breadcrumb-name", p.name);
    set("product-name", p.name);
    set("product-category", `${p.category} / ${p.subcategory}`);
    set("product-description", p.description);

    /* ---------- gallery: main image + thumbnails ---------- */
    const mainImg = document.getElementById("gallery-main");
    mainImg.src = p.images[0];
    mainImg.alt = p.name;

    const thumbsWrap = document.getElementById("gallery-thumbs");
    thumbsWrap.innerHTML = p.images
      .map(
        (src, i) => `
      <button type="button" data-src="${src}" aria-label="View image ${i + 1}"
        class="thumb overflow-hidden rounded-lg border-2 bg-card transition
               ${i === 0 ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"}">
        <img src="${src}" alt="" class="h-20 w-20 object-cover" />
      </button>
    `,
      )
      .join("");

    // one delegated listener: click any thumbnail → swap main image + active border
    thumbsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".thumb");
      if (!btn) return;
      mainImg.src = btn.dataset.src;
      thumbsWrap
        .querySelectorAll(".thumb")
        .forEach((t) =>
          t.classList.replace("border-accent", "border-transparent"),
        );
      btn.classList.replace("border-transparent", "border-accent");
    });

    /* ---------- rating: stars + numeric value ---------- */
    const ratingWrap = document.getElementById("product-rating");
    const fullStars = Math.round(p.rating); // 4.6 → 5 filled
    ratingWrap.innerHTML = `
      <span class="text-sm text-amber-500" aria-hidden="true">
        ${Array.from({ length: 5 }, (_, i) =>
          i < fullStars
            ? `<i class="fa-solid fa-star"></i>`
            : `<i class="fa-regular fa-star"></i>`,
        ).join("")}
      </span>
      <span class="text-sm text-muted">${p.rating.toFixed(1)}</span>
    `;

    /* ---------- price (reactive to currency) ---------- */
    const priceEl = document.getElementById("product-price");
    const oldEl = document.getElementById("product-oldprice");
    const renderPrice = () => {
      priceEl.textContent = formatPrice(p.price);
      if (p.oldPrice) {
        oldEl.textContent = formatPrice(p.oldPrice);
        oldEl.classList.remove("hidden");
      } else {
        oldEl.classList.add("hidden");
      }
    };
    renderPrice();

    const select = document.getElementById("currency-select");
    select.value = getCurrency();
    select.addEventListener("change", () => setCurrency(select.value));
    onCurrencyChange(renderPrice);

    /* ---------- specs table ---------- */
    const specs = [
      ["Material", p.material],
      ["Dimensions", p.dimensions],
      ["Category", `${p.category} / ${p.subcategory}`],
    ];
    document.getElementById("product-specs").innerHTML = specs
      .map(
        ([k, v]) => `
      <div class="flex justify-between gap-4 py-3">
        <dt class="font-medium text-muted">${k}</dt>
        <dd class="text-right text-ink">${v}</dd>
      </div>
    `,
      )
      .join("");

    /* ---------- stock + CTA ---------- */
    const stockEl = document.getElementById("product-stock");
    const btn = document.getElementById("add-to-cart");
    if (p.inStock) {
      stockEl.innerHTML = `<span class="mr-1 inline-block h-2 w-2 rounded-full bg-green-500"></span> In stock`;
    } else {
      stockEl.innerHTML = `<span class="mr-1 inline-block h-2 w-2 rounded-full bg-red-500"></span> Out of stock`;
      btn.disabled = true;
      if (p.inStock) {
        stockEl.innerHTML = `<span class="mr-1 inline-block h-2 w-2 rounded-full bg-green-500"></span> In stock`;
      } else {
        stockEl.innerHTML = `<span class="mr-1 inline-block h-2 w-2 rounded-full bg-red-500"></span> Out of stock`;
        btn.disabled = true;
        document.getElementById("gallery-soldout")?.classList.remove("hidden");
      }
    }
    // hand the product id to the global delegated handler in main.js
    btn.dataset.addToCart = p.id;
  } catch (err) {
    console.error(err);
    set("product-name", "Product not found");
  }
}
