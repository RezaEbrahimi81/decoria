// 4-step wizard (Contact → Shipping → Payment → Review) with a live
// Order Summary. Cart items are enriched from the API; shipping cost is
// real (Standard €10 / FREE over €500, Express €25). Placing the order
// clears the cart and shows a confirmation with an order number.

import { apiGet } from "../api/client.js";
import { getItems, clearCart } from "../services/cart.js";
import { formatPrice } from "../services/currency.js";
import { initLoader, showLoader, hideLoader } from "../components/loader.js";

const STEPS = ["contact", "shipping", "payment", "review"];
const FREE_SHIPPING_MIN = 500;
const EXPRESS_COST = 25;

let step = 1;
let items = []; // enriched cart lines: { product, qty }
let subtotal = 0;
let shippingMethod = "standard";

const data = {}; // checkout form data (email, names, address, card…)

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ---------- shipping cost ----------
const shippingCost = () => {
  if (shippingMethod === "express") return EXPRESS_COST;
  return subtotal >= FREE_SHIPPING_MIN ? 0 : 10;
};

// ---------- summary ----------
function renderSummary() {
  const count = items.reduce((n, i) => n + i.qty, 0);
  $("#sum-count").textContent = `${count} item${count === 1 ? "" : "s"}`;

  $("#sum-items").innerHTML = items
    .map(
      ({ product: p, qty }) => `
    <div class="flex items-center gap-3">
      <img src="${p.images[0] ?? "/src/assets/images/products/_placeholder.jpg"}"
           alt="" class="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-line" />
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-ink">${p.name}</p>
        <p class="text-xs text-muted">Qty ${qty}</p>
      </div>
      <p class="text-sm font-semibold text-ink">${formatPrice(p.price * qty)}</p>
    </div>`,
    )
    .join("");

  const ship = shippingCost();
  $("#sum-subtotal").textContent = formatPrice(subtotal);
  $("#sum-shipping").innerHTML =
    ship === 0
      ? `<span class="font-medium text-accent-text">FREE</span>`
      : formatPrice(ship);
  $("#sum-total").textContent = formatPrice(subtotal + ship);
}

// ---------- stepper ----------
function renderStepper() {
  $$("[data-step-label]").forEach((li) => {
    const n = Number(li.dataset.stepLabel);
    const dot = li.querySelector("[data-dot]");
    const label = li.querySelector("[data-label]");

    const done = n < step,
      active = n === step;
    dot.className =
      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium " +
      (done
        ? "bg-accent text-accent-fg border border-accent"
        : active
          ? "border-2 border-accent text-accent-text bg-card"
          : "border border-line text-muted");
    dot.innerHTML = done
      ? '<i class="fa-solid fa-check text-xs"></i>'
      : String(n);
    label.className =
      "text-sm font-medium " + (active ? "text-ink" : "text-muted");
  });
  $$("[data-line]").forEach((l) =>
    l.classList.toggle("bg-accent", Number(l.dataset.line) < step),
  );
}

// ---------- step navigation ----------
function setStep(n) {
  step = n;
  STEPS.forEach((name, i) =>
    document
      .getElementById(`step-${name}`)
      .classList.toggle("hidden", i + 1 !== n),
  );

  // review fills its read-only rows
  if (n === 4) renderReview();

  renderStepper();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateStep(n) {
  const section = document.getElementById(`step-${STEPS[n - 1]}`);
  for (const el of section.querySelectorAll("input, select")) {
    if (!el.checkValidity()) {
      el.reportValidity();
      return false;
    }
  }
  if (n === 3) {
    const digits = $("#pay-number").value.replace(/\D/g, "");
    if (digits.length !== 16) {
      showToast("Card number must be 16 digits");
      $("#pay-number").focus();
      return false;
    }
  }
  return true;
}

function collectStep(n) {
  const section = document.getElementById(`step-${STEPS[n - 1]}`);
  for (const el of section.querySelectorAll("input, select")) {
    if (el.name)
      data[el.name] = el.type === "checkbox" ? el.checked : el.value.trim();
  }
  shippingMethod =
    section.querySelector('input[name="ship-method"]:checked')?.value ??
    "standard";
  renderSummary();
}

// ---------- review ----------
function renderReview() {
  $('[data-review="email"]').textContent = data.email;

  const method =
    shippingMethod === "express"
      ? "Express (1–2 business days)"
      : "Standard (3–5 business days)";
  $('[data-review="shipping"]').innerHTML =
    `${data.firstName} ${data.lastName}<br>${data.address}, ${data.city}` +
    `${data.state ? ", " + data.state : ""} ${data.postal}, ${data.country}<br>` +
    `<span class="text-muted">${method}</span>`;

  $('[data-review="card"]').textContent =
    "•••• " + data.cardNumber.replace(/\D/g, "").slice(-4);
}

// ---------- input niceties (formatting) ----------
function wireFormatting() {
  const number = $("#pay-number");
  number.addEventListener("input", () => {
    const d = number.value.replace(/\D/g, "").slice(0, 16);
    number.value = d.replace(/(.{4})/g, "$1 ").trim();
  });

  const expiry = $("#pay-expiry");
  expiry.addEventListener("input", () => {
    let d = expiry.value.replace(/\D/g, "").slice(0, 4);
    if (d.length >= 3) d = d.slice(0, 2) + "/" + d.slice(2);
    expiry.value = d;
  });

  const cvc = $("#pay-cvc");
  cvc.addEventListener("input", () => {
    cvc.value = cvc.value.replace(/\D/g, "").slice(0, 4);
  });
}

// ---------- init ----------
async function init() {
  initLoader();

  const cartItems = getItems();

  // empty cart → guard screen
  if (!cartItems.length) {
    $("#checkout-body").classList.add("hidden");
    $("#stepper").classList.add("hidden");
    $("#cart-empty").classList.remove("hidden");
    return;
  }

  showLoader();
  try {
    items = (
      await Promise.all(
        cartItems.map(async (i) => {
          const p = await apiGet(`/products/${i.id}`).catch(() => null);
          return p ? { product: p, qty: i.qty } : null;
        }),
      )
    ).filter(Boolean);

    subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
    renderSummary();

    // next/continue buttons
    $$("[data-next]").forEach((b) =>
      b.addEventListener("click", () => {
        const current = STEPS[step - 1];
        if (!validateStep(step)) return;
        collectStep(step);
        setStep(Math.min(step + 1, 4));
        if (current === "shipping") renderSummary(); // method change → totals
      }),
    );

    // back buttons
    $$("[data-back]").forEach((b) =>
      b.addEventListener("click", () => setStep(Math.max(step - 1, 1))),
    );

    // review edit buttons
    $$("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => setStep(Number(b.dataset.edit))),
    );

    // shipping method change → totals update
    $$('input[name="ship-method"]').forEach((r) =>
      r.addEventListener("change", () => {
        shippingMethod = r.value;
        renderSummary();
      }),
    );

    // place order: processing animation → confirmation with receipt
    $("#place-order").addEventListener("click", () => {
      const btn = $("#place-order");
      const label = btn.querySelector("[data-place-label]");
      const spinner = btn.querySelector("[data-place-spinner]");

      btn.disabled = true;
      spinner?.classList.remove("invisible");
      if (label) label.textContent = "Processing…";

      setTimeout(() => {
        // 1) compute everything first (can't fail)
        const orderNo = "DC-" + Math.floor(1000 + Math.random() * 9000);
        const itemCount = items.reduce((n, i) => n + i.qty, 0);
        const ship = shippingCost();
        const last4 = data.cardNumber.replace(/\D/g, "").slice(-4);

        // 2) fill the confirmation (each element guarded + logged)
        const set = (sel, text) => {
          const el = document.querySelector(sel);
          if (!el) {
            console.warn(
              `checkout: missing element ${sel} — check checkout.html`,
            );
            return;
          }
          el.textContent = text;
        };
        set("#order-number", orderNo);
        set("[data-placed-email]", data.email);
        set("#placed-items", `${itemCount} item${itemCount === 1 ? "" : "s"}`);
        set("#placed-shipping", ship === 0 ? "FREE" : formatPrice(ship));
        set("#placed-total", formatPrice(subtotal + ship));
        set(
          "#placed-delivery",
          shippingMethod === "express"
            ? "Express · 1–2 business days"
            : "Standard · 3–5 business days",
        );
        set("#placed-card", "•••• " + last4);

        // 3) hide wizard + summary, show confirmation
        const body = $("#checkout-body"),
          stepperEl = $("#stepper"),
          placed = $("#order-placed");
        if (!body || !stepperEl || !placed) {
          console.error(
            "checkout: confirmation sections missing in checkout.html",
            { body: !!body, stepper: !!stepperEl, placed: !!placed },
          );
        } else {
          body.classList.add("hidden");
          stepperEl.classList.add("hidden");
          placed.classList.remove("hidden");
          window.scrollTo({ top: 0, behavior: "smooth" });
          clearCart();
        }

        // 4) restore button state
        btn.disabled = false;
        spinner?.classList.add("invisible");
        if (label) label.textContent = "Place Order";
      }, 2000); // simulated processing time
    });

    wireFormatting();
    renderStepper();
  } finally {
    setTimeout(hideLoader, 400);
  }
}

init();
