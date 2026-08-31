const footerHTML = `
<footer class="mt-16 border-t border-neutral-200 bg-white">
  <div class="mx-auto max-w-7xl px-4 py-12">
    <div class="grid grid-cols-1 gap-10 md:grid-cols-4">

      <div>
        <p class="font-display text-2xl tracking-widest text-primary">DECORIA</p>
        <p class="mt-3 text-sm leading-6 text-neutral-600">
          Furniture, lighting and decor — carefully selected for modern homes and offices.
        </p>
      </div>

      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wider text-primary">Shop</h3>
        <ul class="mt-4 space-y-2 text-sm text-neutral-600">
          <li><a href="/pages/shop.html" class="transition hover:text-accent">All Products</a></li>
          <li><a href="/pages/shop.html?category=furniture" class="transition hover:text-accent">Furniture</a></li>
          <li><a href="/pages/shop.html?category=lighting" class="transition hover:text-accent">Lighting</a></li>
          <li><a href="/pages/shop.html?category=decor" class="transition hover:text-accent">Decor</a></li>
        </ul>
      </div>

      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wider text-primary">Company</h3>
        <ul class="mt-4 space-y-2 text-sm text-neutral-600">
          <li><a href="#" class="transition hover:text-accent">About Us</a></li>
          <li><a href="#" class="transition hover:text-accent">Contact</a></li>
          <li><a href="#" class="transition hover:text-accent">FAQ</a></li>
        </ul>
      </div>

      <div>
        <h3 class="text-sm font-semibold uppercase tracking-wider text-primary">Newsletter</h3>
        <p class="mt-4 text-sm text-neutral-600">Get updates on new arrivals.</p>
        <form id="newsletter-form" class="mt-3 flex" novalidate>
          <input type="email" required placeholder="Email address"
            class="w-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-accent" />
          <button type="submit" class="bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
            Join
          </button>
        </form>
      </div>
    </div>

    <div class="mt-10 flex flex-col items-center justify-between gap-2 border-t border-neutral-200 pt-6 text-xs text-neutral-500 md:flex-row">
      <p>© 2025 Decoria. All rights reserved.</p>
      <p>Images are used for educational purposes only.</p>
    </div>
  </div>
</footer>
`;

export function initFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;

  mount.outerHTML = footerHTML;

  const form = document.getElementById("newsletter-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = form.querySelector("input").value;
    alert(`Thanks for subscribing, ${email}!`);
    form.reset();
  });
}
