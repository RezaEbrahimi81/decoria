// src/js/components/loader.js
// Real-content loader: shown only while actual data/images load.

// Abajour (floor lamp) mark — matches the brand's line-icon family
const lamp = `
<svg class="h-16 w-16 text-accent-text" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
     fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 3h6l3 7H6l3-7Z"/>
  <path d="M12 10v8"/>
  <path d="M8 21h8"/>
  <path d="M12 18c0 1.7.7 3 2 3"/>
</svg>`;

const markup = `
<div id="page-loader"
  class="fixed inset-0 z-[999] hidden items-center justify-center bg-surface/95 backdrop-blur-sm transition-opacity duration-200">
  <div class="flex flex-col items-center gap-5">
    <!-- spinner ring: conic gradient sweep, rotates around the lamp -->
    <div class="relative flex h-28 w-28 items-center justify-center">
      <div class="loader-ring absolute inset-0 rounded-full"></div>
      ${lamp}
    </div>
    <p class="font-display text-sm tracking-[0.3em] text-muted">DECORIA</p>
  </div>
</div>`;

export function initLoader() {
  if (document.getElementById("page-loader")) return;
  document.body.insertAdjacentHTML("beforeend", markup);
  document.getElementById("page-loader").classList.add("flex");
}

export function showLoader() {
  const el = document.getElementById("page-loader");
  el?.classList.remove("hidden", "opacity-0");
  el?.classList.add("flex", "opacity-100");
}

export function hideLoader() {
  const el = document.getElementById("page-loader");
  if (!el) return;
  el.classList.add("opacity-0");
  setTimeout(() => el.classList.add("hidden"), 250);
}
