import {
  formatPrice,
  getCurrency,
  setCurrency,
  onCurrencyChange,
} from "../services/currency.js";

const API = "http://localhost:3000"; // later extracted to api/client.js

export async function initProduct() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    console.warn("No product id in URL");
    return;
  }

  const res = await fetch(`${API}/products/${id}`);
  if (!res.ok) {
    document.getElementById("product-name").textContent = "Product not found";
    return;
  }
  const p = await res.json();

  // fill static fields
  document.getElementById("product-image").src = p.images[0];
  document.getElementById("product-image").alt = p.name;
  document.getElementById("product-name").textContent = p.name;
  document.getElementById("product-category").textContent =
    `${p.category} / ${p.subcategory}`;
  document.getElementById("product-description").textContent = p.description;

  // price rendering — always through the currency service
  const priceEl = document.getElementById("product-price");
  const renderPrice = () => {
    priceEl.textContent = formatPrice(p.price);
  };
  renderPrice();

  // dropdown: reflect saved choice, react to user, react to other tabs/components
  const select = document.getElementById("currency-select");
  select.value = getCurrency();
  select.addEventListener("change", () => setCurrency(select.value));
  onCurrencyChange(renderPrice);
}
