// Renders the filter sidebar TWICE (desktop sidebar + mobile panel) from one
// shared state. Each instance gets its OWN radio group names (cat-d/subcat-d
// vs cat-m/subcat-m): radios with the same name form ONE group across the
// whole document, so with shared names the two instances kept unchecking
// each other on every sync (last sync won → desktop always lost).

const sectionTitle = (t) =>
  `<h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-ink">${t}</h3>`;

const row = (label, checked, attrs, extra = "") => `
  <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition hover:bg-accent-soft ${extra}">
    <input type="radio" ${attrs} ${checked ? "checked" : ""}
      class="h-4 w-4 accent-[var(--color-accent-text)]" />
    ${label}
  </label>`;

export function renderFilters(
  mount,
  mountMobile,
  { categories, state, onChange },
) {
  const buildHTML = (uid) => {
    const CAT = `cat-${uid}`;
    const SUB = `subcat-${uid}`;
    return `
    <div class="mb-6">
      ${sectionTitle("Category")}
      ${row("All Products", !state.category, `name="${CAT}" value=""`)}
      ${categories.map((c) => row(c.name, state.category === c.slug, `name="${CAT}" value="${c.slug}"`)).join("")}
    </div>

    ${activeSubcats(categories, state, SUB)}

    <div class="mb-6">
      ${sectionTitle("Price")}
      <div class="flex items-center gap-2">
        <input type="number" data-f="min" placeholder="Min" min="0" value="${state.min ?? ""}"
          class="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink outline-none focus:border-accent" />
        <span class="text-muted">—</span>
        <input type="number" data-f="max" placeholder="Max" min="0" value="${state.max ?? ""}"
          class="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink outline-none focus:border-accent" />
      </div>
      <button type="button" data-f="price-apply"
        class="mt-2 w-full rounded-lg bg-accent-soft py-1.5 text-xs font-medium text-accent-text transition hover:bg-accent hover:text-accent-fg">
        Apply price
      </button>
    </div>

    <div class="space-y-1">
      ${sectionTitle("Availability")}
      <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition hover:bg-accent-soft">
        <input type="checkbox" data-f="onsale" ${state.sale ? "checked" : ""}
          class="h-4 w-4 accent-[var(--color-accent-text)]" /> On sale only
      </label>
      <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition hover:bg-accent-soft">
        <input type="checkbox" data-f="instock" ${state.inStock ? "checked" : ""}
          class="h-4 w-4 accent-[var(--color-accent-text)]" /> In stock only
      </label>
    </div>

    <button type="button" data-f="reset"
      class="mt-6 w-full rounded-lg border border-line py-2 text-sm text-muted transition hover:border-accent hover:text-accent-text">
      Reset all filters
    </button>`;
  };

  // force the CURRENT state onto the freshly built DOM (checked attribute
  // only sets the default — the visible property must be set explicitly)
  const syncChecks = (el, uid) => {
    el.querySelectorAll(`input[name="cat-${uid}"]`).forEach(
      (r) => (r.checked = r.value === (state.category ?? "")),
    );
    el.querySelectorAll(`input[name="subcat-${uid}"]`).forEach(
      (r) => (r.checked = r.value === (state.subcategory ?? "")),
    );
    const sale = el.querySelector('[data-f="onsale"]');
    if (sale) sale.checked = !!state.sale;
    const instock = el.querySelector('[data-f="instock"]');
    if (instock) instock.checked = !!state.inStock;
  };

  // build + sync + wire ONE instance with its own private radio groups
  const mk = (el, uid) => {
    if (!el) return;
    el.innerHTML = buildHTML(uid);
    syncChecks(el, uid);
    wire(el, `cat-${uid}`, `subcat-${uid}`, onChange);
  };

  mk(mount, "d"); // desktop instance → groups: cat-d / subcat-d
  mk(mountMobile, "m"); // mobile instance   → groups: cat-m / subcat-m
}

function activeSubcats(categories, state, SUB) {
  const cat = categories.find((c) => c.slug === state.category);
  if (!cat || !cat.subcategories?.length) return "";
  return `
    <div class="mb-6">
      ${sectionTitle(cat.name + " types")}
      ${cat.subcategories
        .map((s) =>
          row(
            s.name,
            state.subcategory === s.slug,
            `name="${SUB}" value="${s.slug}"`,
          ),
        )
        .join("")}
    </div>`;
}

function wire(el, CAT, SUB, onChange) {
  const notify = (patch) => onChange(patch);

  el.querySelectorAll(`input[name="${CAT}"]`).forEach((r) =>
    r.addEventListener("change", () =>
      notify({ category: r.value || null, subcategory: null, page: 1 }),
    ),
  );

  el.querySelectorAll(`input[name="${SUB}"]`).forEach((r) =>
    r.addEventListener("change", () =>
      notify({ subcategory: r.value, page: 1 }),
    ),
  );

  el.querySelector('[data-f="price-apply"]')?.addEventListener("click", () => {
    const min = el.querySelector('[data-f="min"]')?.value || null;
    const max = el.querySelector('[data-f="max"]')?.value || null;
    notify({ min, max, page: 1 });
  });

  el.querySelector('[data-f="onsale"]')?.addEventListener("change", (e) =>
    notify({ sale: e.target.checked || null, page: 1 }),
  );

  el.querySelector('[data-f="instock"]')?.addEventListener("change", (e) =>
    notify({ inStock: e.target.checked || null, page: 1 }),
  );

  el.querySelector('[data-f="reset"]')?.addEventListener("click", () =>
    notify({
      category: null,
      subcategory: null,
      min: null,
      max: null,
      sale: null,
      inStock: null,
      page: 1,
    }),
  );
}
