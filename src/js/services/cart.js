// Single source of truth for the cart. Persists in localStorage and
// broadcasts changes so header badge / cart page / toast stay in sync.

const KEY = "decoria-cart-v1"; // versioned key → future migrations are painless

// ---------- low-level ----------
function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return []; // corrupted storage → start clean instead of crashing
  }
}

function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cartchange", { detail: count() }));
}

// ---------- helpers ----------
const count = () => read().reduce((n, i) => n + i.qty, 0);

export function find(id) {
  return read().find((i) => i.id === Number(id));
}

// ---------- public API ----------
export function getItems() {
  return read();
}

export function getCount() {
  return count();
}

export function addToCart(id, qty = 1) {
  const items = read();
  const existing = items.find((i) => i.id === Number(id));
  if (existing) existing.qty += qty;
  else items.push({ id: Number(id), qty });
  write(items);
}

export function setQty(id, qty) {
  let items = read();
  if (qty <= 0) return removeFromCart(id);
  items = items.map((i) => (i.id === Number(id) ? { ...i, qty } : i));
  write(items);
}

export function removeFromCart(id) {
  write(read().filter((i) => i.id !== Number(id)));
}

export function clearCart() {
  write([]);
}
