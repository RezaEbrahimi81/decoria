import { initHeader } from "./components/header.js";
import { initFooter } from "./components/footer.js";
import { initHome } from "./pages/home.js";
import { initShop } from "./pages/shop.js";
import { initProduct } from "./pages/product.js";
import { initTransition } from "./services/transition.js";
initHeader();
initFooter();
initTransition();
const routes = {
  home: initHome,
  shop: initShop,
  product: initProduct,
};

const initPage = routes[document.body.dataset.page];
if (initPage) initPage();
