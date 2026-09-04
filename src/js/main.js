import { initHeader } from "./components/header.js";
import { initFooter } from "./components/footer.js";
import { initHome } from "./pages/home.js";
import { initShop } from "./pages/shop.js"; // ← اضافه شد؟
import { initProduct } from "./pages/product.js";

initHeader();
initFooter();

const routes = {
  home: initHome,
  shop: initShop, // ← اضافه شد؟
  product: initProduct,
};

const initPage = routes[document.body.dataset.page];
if (initPage) initPage();
