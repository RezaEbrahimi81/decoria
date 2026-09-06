// src/js/services/transition.js
// Soft page-to-page transition WITHOUT any overlay:
// exit → quick fade-out, enter → quick fade-in.
// (The content loader is a separate concern — see pages.)

const FADE_MS = 200;

export function initTransition() {
  // enter: fade in the fresh page (fallback browsers only; VT handles itself)
  if (!document.startViewTransition) {
    document.documentElement.classList.add("pt-enter");
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.documentElement.classList.remove("pt-enter"),
      ),
    );
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;

    const href = a.getAttribute("href") ?? "";
    const isInternal =
      a.origin === location.origin &&
      href &&
      !href.startsWith("#") &&
      !a.hasAttribute("download") &&
      a.target !== "_blank";
    if (!isInternal) return;
    if (a.pathname === location.pathname && a.search === location.search)
      return;

    e.preventDefault();

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        location.href = a.href;
      });
    } else {
      document.documentElement.classList.add("pt-exit");
      setTimeout(() => {
        location.href = a.href;
      }, FADE_MS);
    }
  });
}
