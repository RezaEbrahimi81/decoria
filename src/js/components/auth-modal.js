// src/js/components/auth-modal.js
// Singleton auth dialog (sign up default / login swap) — permanently mounted.
// Opened from the header user button ([data-auth-open]); Escape, backdrop
// and the ✕ button close it. Demo authentication only — toasts, no backend.

import { showToast } from "./toast.js";

const armchair = `
<svg class="h-7 w-7 text-accent-text" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
     fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/>
  <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"/>
  <path d="M5 18v2"/><path d="M19 18v2"/>
</svg>`;

const markup = `
<div id="auth-modal" aria-hidden="true" data-open="false"
  class="fixed inset-0 z-[920] flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-200 will-change-opacity">
  <div data-am-backdrop class="absolute inset-0 bg-black/50"></div>

  <div data-am-panel class="relative w-full max-w-md rounded-2xl bg-card p-8 ring-1 ring-line shadow-2xl">

    <!-- logo header -->
    <div class="mb-8 flex items-center justify-center gap-2 text-ink">
      ${armchair}
      <span class="font-display text-xl tracking-[0.18em]">DECORIA</span>
    </div>

    <!-- close -->
    <button type="button" data-am-close aria-label="Close"
      class="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-accent-soft hover:text-ink">
      <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>

    <!-- ---------- SIGN UP (default) ---------- -->
    <section data-mode-signup>
      <button type="button" data-demo-auth="Google sign-up"
        class="flex w-full items-center justify-center gap-3 rounded-lg bg-ink py-3 text-sm font-medium text-surface transition hover:bg-accent">
        <svg class="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84C6.71 7.69 9.14 5.38 12 5.38Z"/></svg>
        Sign up with Google
      </button>

      <div class="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
        <span class="h-px flex-1 bg-line"></span> or <span class="h-px flex-1 bg-line"></span>
      </div>

      <form data-form="signup" class="space-y-5" novalidate>
        <div>
          <label for="am-email" class="mb-1 block text-sm font-medium text-ink">Email</label>
          <input id="am-email" name="email" type="email" autocomplete="email" required
            placeholder="Email"
            class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent" />
        </div>

        <div>
          <label for="am-password" class="mb-1 block text-sm font-medium text-ink">Password</label>
          <div class="relative">
            <input id="am-password" name="password" type="password" autocomplete="new-password" required minlength="8"
              placeholder="Password"
              class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 pr-10 text-sm text-ink outline-none placeholder:text-muted focus:border-accent" />
            <button type="button" data-toggle-pass="am-password" aria-label="Show password"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition hover:text-ink">
              <i class="fa-regular fa-eye"></i>
            </button>
          </div>
          <p class="mt-1 text-xs text-muted">At least 8 characters.</p>
        </div>

        <div>
          <label for="am-confirm" class="mb-1 block text-sm font-medium text-ink">Confirm Password</label>
          <input id="am-confirm" name="confirm" type="password" autocomplete="new-password" required
            placeholder="Password"
            class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent" />
          <p data-confirm-msg class="mt-1 hidden text-xs"></p>
        </div>

        <button type="submit"
          class="w-full rounded-lg bg-line py-3 text-sm font-medium text-ink transition hover:bg-accent hover:text-accent-fg">
          Create Account
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-muted">
        Already a user?
        <button type="button" data-goto="login" class="font-medium text-ink underline underline-offset-4 hover:text-accent-text">Login</button>
      </p>
    </section>

    <!-- ---------- LOGIN ---------- -->
    <section data-mode-login class="hidden">
      <h2 class="mb-6 text-center font-display text-2xl text-ink">Login</h2>

      <form data-form="login" class="space-y-5" novalidate>
        <div>
          <label for="am-li-email" class="mb-1 block text-sm font-medium text-ink">Email</label>
          <input id="am-li-email" name="email" type="email" autocomplete="email" required
            placeholder="Email"
            class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent" />
        </div>

        <div>
          <label for="am-li-password" class="mb-1 block text-sm font-medium text-ink">Password</label>
          <input id="am-li-password" name="password" type="password" autocomplete="current-password" required
            placeholder="Password"
            class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-accent" />
        </div>

        <button type="submit"
          class="w-full rounded-lg bg-ink py-3 text-sm font-medium text-surface transition hover:bg-accent">
          Login
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-muted">
        Need an account?
        <button type="button" data-goto="signup" class="font-medium text-ink underline underline-offset-4 hover:text-accent-text">Sign up</button>
      </p>
    </section>
  </div>
</div>`;

let openedFrom = null;

// ---------- mode switching (signup ↔ login) ----------
function setMode(mode) {
  const root = document.getElementById("auth-modal");
  const isLogin = mode === "login";
  root.querySelector("[data-mode-signup]").classList.toggle("hidden", isLogin);
  root.querySelector("[data-mode-login]").classList.toggle("hidden", !isLogin);
}

// ---------- open / close ----------
function open(mode = "signup") {
  const root = document.getElementById("auth-modal");
  setMode(mode);

  root.setAttribute("data-open", "true");
  root.removeAttribute("aria-hidden");
  root.classList.remove("opacity-0", "pointer-events-none");

  // focus the first field of the active form
  setTimeout(() => {
    const sel = mode === "login" ? "#am-li-email" : "#am-email";
    root.querySelector(sel)?.focus();
  }, 60);
}

export function closeAuthModal() {
  const root = document.getElementById("auth-modal");
  if (root.getAttribute("data-open") !== "true") return;
  root.setAttribute("data-open", "false");
  root.setAttribute("aria-hidden", "true");
  root.classList.add("opacity-0", "pointer-events-none");
  openedFrom?.focus({ preventScroll: true });
  openedFrom = null;
}

export function openAuthModal(mode = "signup") {
  openedFrom = document.activeElement;
  open(mode);
}

export function initAuthModal() {
  if (document.getElementById("auth-modal")) return;
  document.body.insertAdjacentHTML("beforeend", markup);
  const root = document.getElementById("auth-modal");

  // close paths: backdrop, ✕, Escape
  root
    .querySelector("[data-am-backdrop]")
    .addEventListener("click", closeAuthModal);
  root
    .querySelector("[data-am-close]")
    .addEventListener("click", closeAuthModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAuthModal();
  });

  // mode switching
  root
    .querySelectorAll("[data-goto]")
    .forEach((b) => b.addEventListener("click", () => setMode(b.dataset.goto)));

  // Google demo
  root
    .querySelectorAll("[data-demo-auth]")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        showToast("Demo store — Google sign-in is not wired to a backend."),
      ),
    );

  // password visibility
  root.querySelectorAll("[data-toggle-pass]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.togglePass);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.querySelector("i").className = show
        ? "fa-regular fa-eye-slash"
        : "fa-regular fa-eye";
    }),
  );

  // confirm-password live validation
  const password = root.querySelector("#am-password");
  const confirm = root.querySelector("#am-confirm");
  const confirmMsg = root.querySelector("[data-confirm-msg]");
  confirm?.addEventListener("input", () => {
    if (!confirm.value) {
      confirmMsg.classList.add("hidden");
      return;
    }
    confirmMsg.classList.remove("hidden");
    if (confirm.value === password.value) {
      confirmMsg.textContent = "✓ Passwords match";
      confirmMsg.classList.replace("text-red-600", "text-accent-text");
    } else {
      confirmMsg.textContent = "Passwords do not match";
      confirmMsg.classList.add("text-red-600");
    }
  });

  // demo submits
  root
    .querySelector('[data-form="signup"]')
    ?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!e.target.reportValidity()) return;
      if (password.value !== confirm.value) {
        showToast("Passwords do not match");
        confirm.focus();
        return;
      }
      showToast("Demo store — sign-up is not wired to a backend.");
    });

  root.querySelector('[data-form="login"]')?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!e.target.reportValidity()) return;
    showToast("Demo store — login is not wired to a backend.");
  });

  // open from the header user button (delegated → works on every page)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-auth-open]");
    if (!btn) return;
    openAuthModal();
  });
}
