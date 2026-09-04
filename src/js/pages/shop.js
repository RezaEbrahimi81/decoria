import { apiGet } from "../api/client.js";

export async function initShop() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  try {
    // json-server v1 quirk: bare _limit acts as a filter → empty array.
    // Fetch all (87 items is trivial) and slice client-side for now.
    const all = await apiGet("/products");
    const products = all.slice(0, 12);

    const { createProductCard } = await import("../components/product-card.js");
    grid.innerHTML = products.map(createProductCard).join("");
  } catch (err) {
    grid.innerHTML = `<p class="col-span-full text-neutral-500">Could not load products.</p>`;
    console.error(err);
  }
}
