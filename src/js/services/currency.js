// Fixed rates relative to the canonical currency (EUR).
// For a real store these would come from a live FX API — see README.
const RATES = { EUR: 1, USD: 1.08 };

const STORAGE_KEY = "decoria-currency";

// Current currency, persisted across pages via localStorage
export function getCurrency() {
  return localStorage.getItem(STORAGE_KEY) ?? "EUR";
}

export function setCurrency(code) {
  localStorage.setItem(STORAGE_KEY, code);
  // notify every listening component (detail page, cards, cart, …)
  window.dispatchEvent(new CustomEvent("currencychange", { detail: code }));
}

// Convert from canonical EUR → selected currency and format professionally
export function formatPrice(priceInEur) {
  const code = getCurrency();
  const value = priceInEur * (RATES[code] ?? 1);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0, // furniture prices look cleaner without cents
  }).format(value);
}

export function onCurrencyChange(handler) {
  window.addEventListener("currencychange", (e) => handler(e.detail));
}
