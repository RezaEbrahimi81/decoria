// src/js/main.js — single entry point of the whole site

import { initHeader } from "./components/header.js";
import { initFooter } from "./components/footer.js";
import { initHome } from "./pages/home.js";
import { initShop } from "./pages/shop.js";
import { initProduct } from "./pages/product.js";
import { initCart } from "./pages/cart.js";
import { addToCart } from "./services/cart.js";
import { showToast } from "./components/toast.js";
import { initTransition } from "./services/transition.js";

// 1) Shared components — run on every page
initHeader();
initFooter();
initTransition();

// 2) Page router — maps body[data-page] to its init function
const routes = {
  home: initHome,
  shop: initShop,
  product: initProduct,
  cart: initCart,
};

const initPage = routes[document.body.dataset.page];
if (initPage) initPage();

// 3) Cart: delegated add-to-cart — works for product cards
//    rendered later (async), and on every page
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add-to-cart]");
  if (!btn || btn.disabled) return;
  addToCart(btn.dataset.addToCart);
  showToast("✓ Added to cart");
});
