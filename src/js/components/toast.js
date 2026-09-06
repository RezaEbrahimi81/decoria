// src/js/components/toast.js
let timer;

export function showToast(message) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className =
      "fixed bottom-6 left-1/2 z-[1000] -translate-x-1/2 rounded-lg bg-ink px-5 py-3 text-sm font-medium text-surface shadow-xl transition-all duration-300";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.remove("opacity-0", "pointer-events-none", "translate-y-2");
  clearTimeout(timer);
  timer = setTimeout(
    () => el.classList.add("opacity-0", "pointer-events-none", "translate-y-2"),
    2200,
  );
}
