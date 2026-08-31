import { initHeader } from "./components/header.js";
import { initFooter } from "./components/footer.js";
import { initHome } from "./pages/home.js";

// 1) Shared components — run on every page
initHeader();
initFooter();

// 2) Page router — maps body[data-page] to its init function.
//    Each HTML page declares which module it needs via data-page.
const routes = {
  home: initHome,
  // shop: initShop,      // uncomment when src/js/pages/shop.js exists
  // product: initProduct,
  // cart: initCart,
};

const initPage = routes[document.body.dataset.page];
if (initPage) initPage();
