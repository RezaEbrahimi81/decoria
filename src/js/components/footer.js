// src/js/components/footer.js
import { apiGet } from "../api/client.js";

const armchair = `
<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
     fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/>
  <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"/>
  <path d="M5 18v2"/><path d="M19 18v2"/>
</svg>`;

const colTitle = (t) =>
  `<h3 class="text-sm font-semibold uppercase tracking-wider text-ink">${t}</h3>`;

const link = (href, label) =>
  `<li><a href="${href}" class="text-sm text-muted transition hover:text-accent-text">${label}</a></li>`;

const footerHTML = `
<footer class="mt-20 border-t border-line bg-card">

  <!-- value props strip -->
  <div class="border-b border-line">
    <div class="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-3">
      <div class="flex items-center gap-3 text-sm text-muted">
        <i class="fa-solid fa-truck-fast text-lg text-accent-text
        "></i> Free shipping on orders over €500
      </div>
      <div class="flex items-center gap-3 text-sm text-muted">
        <i class="fa-solid fa-rotate-left text-lg text-accent-text"></i> 30-day easy returns
      </div>
      <div class="flex items-center gap-3 text-sm text-muted">
        <i class="fa-solid fa-shield-halved text-lg text-accent-text"></i> 2-year warranty on all pieces
      </div>
    </div>
  </div>

  <div class="mx-auto max-w-7xl px-4 py-12">
    <div class="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">

      <!-- brand + social -->
      <div>
        <div class="flex items-center gap-2 text-ink">
          <span class="text-accent-text">${armchair}</span>
          <span class="font-display text-2xl tracking-[0.18em]">DECORIA</span>
        </div>
        <p class="mt-3 max-w-xs text-sm leading-6 text-muted">
          Furniture, lighting and decor — carefully selected pieces for modern homes and offices.
        </p>
        ${colTitle("Follow Us")}
        <div class="mt-3 flex gap-3">
          <a href="#" aria-label="Facebook" class="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:border-accent-text hover:text-accent-text"><i class="fa-brands fa-facebook-f text-sm"></i></a>
          <a href="#" aria-label="X" class="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:border-accent-text hover:text-accent-text"><i class="fa-brands fa-x-twitter text-sm"></i></a>
          <a href="#" aria-label="Instagram" class="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:border-accent-text hover:text-accent-text"><i class="fa-brands fa-instagram text-sm"></i></a>
        </div>
      </div>

      <!-- shop (data-driven) -->
      <div>
        ${colTitle("Shop")}
        <ul class="mt-4 space-y-2">
          ${link("/pages/shop.html", "All Products")}
          <div data-footer-categories></div>
        </ul>
      </div>

      <!-- company -->
      <div>
        ${colTitle("Company")}
        <ul class="mt-4 space-y-2">
          ${link("#", "About Us")}
          ${link("#", "Contact")}
          ${link("#", "FAQ")}
        </ul>
      </div>

      <!-- newsletter -->
      <div>
        ${colTitle("Newsletter")}
        <p class="mt-4 text-sm text-muted">Get updates on new arrivals and seasonal edits.</p>
        <form id="newsletter-form" class="mt-3 flex" novalidate>
          <input type="email" required placeholder="Email address"
            class="w-full rounded-l-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-accent" />
          <button type="submit" class="rounded-r-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-strong">
            Join
          </button>
        </form>
        <p data-newsletter-msg class="mt-2 hidden text-sm text-accent-text">✓ Thanks for subscribing!</p>
      </div>
    </div>

    <!-- bottom bar -->
    <div class="mt-10 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 text-xs text-muted md:flex-row">
      <p>© 2025 Decoria. All rights reserved.</p>
      <div class="flex items-center gap-3 text-2xl" aria-label="Accepted payments">
        <i class="fa-brands fa-cc-visa"></i><i class="fa-brands fa-cc-mastercard"></i>
        <i class="fa-brands fa-cc-paypal"></i><i class="fa-brands fa-cc-amex"></i>
        <i class="fa-brands fa-cc-apple-pay"></i>
      </div>
      <p>Images are used for educational purposes only.</p>
    </div>
  </div>
</footer>
`;

export function initFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;

  mount.outerHTML = footerHTML;

  /* data-driven category links (same source as the header) */
  apiGet("/categories")
    .then((cats) => {
      const slot = document.querySelector("[data-footer-categories]");
      slot.innerHTML = cats
        .map((c) => link(`/pages/shop.html?category=${c.slug}`, c.name))
        .join("");
    })
    .catch(() => {});

  /* newsletter: inline success message instead of alert() */
  const form = document.getElementById("newsletter-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.querySelector("input").checkValidity()) {
      form.querySelector("input").reportValidity();
      return;
    }
    form.reset();
    document.querySelector("[data-newsletter-msg]")?.classList.remove("hidden");
  });
}
