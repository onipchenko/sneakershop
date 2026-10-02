import { db, firebaseReady } from "./firebase-config.js";
import { watchAuth, login, register, logout, getCurrentUserProfile, updateUserProfile, resetPassword } from "./auth.js";
import {
    collection,
    onSnapshot,
    query,
    where,
    orderBy,
    deleteDoc,
    doc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { subscribeCart } from "./cart.js";
import { t, setupLanguageSwitcher, currentLanguage } from "./i18n.js";
setupLanguageSwitcher();

const account = document.querySelector("#account");

// ── helpers ─────────────────────────────────────────────────
function showToast(msg, ok = true) {
    const el = document.querySelector("#toast");
    if (!el) return;
    el.textContent = msg;
    el.className = "toast visible" + (ok ? "" : " error");
    clearTimeout(el._tid);
    el._tid = setTimeout(() => el.classList.remove("visible"), 2800);
}

function money(v) { return `${Number(v).toFixed(0)} KZT`; }

function statusBadge(s) {
    const icons = { pending: "🟡", confirmed: "🟢", shipped: "📦", delivered: "✅", cancelled: "🔴" };
    const labels = {
        ru: { pending: "Ожидает", confirmed: "Подтверждён", shipped: "Отправлен", delivered: "Доставлен", cancelled: "Отменён" },
        en: { pending: "Pending", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" },
        kk: { pending: "Күтіліп жатыр", confirmed: "Расталды", shipped: "Жіберілді", delivered: "Жеткізілді", cancelled: "Бас тартылды" },
    };
    const lang = currentLanguage in labels ? currentLanguage : "ru";
    return `${icons[s] || "⚪"} ${labels[lang][s] || s}`;
}

function fmtDate(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

// ── AUTH SCREEN ──────────────────────────────────────────────
function showAuth() {
    account.innerHTML = `
    <div class="account-panel">
      <p class="eyebrow">SNEAKERSHOP</p>
      <h1>${t("welcomeBack")}<br><em>.</em></h1>

      <form id="auth-form" autocomplete="on">
        <input name="email" type="email" placeholder="${t("emailPh")}" required autocomplete="email">
        <input name="password" type="password" placeholder="${t("passwordPh")}" minlength="6" required autocomplete="current-password">
        <input name="displayName" placeholder="${t("namePh")}" autocomplete="name">
        <button class="button button-dark" id="auth-submit">${t("signInCreate")} <span>↗</span></button>
      </form>

      <button class="text-button" id="forgot-btn">${t("forgotPass")}</button>

      <div id="reset-panel" hidden>
        <form id="reset-form">
          <input name="resetEmail" type="email" placeholder="${t("resetEmailPh")}" required>
          <button class="button button-dark">${t("resetSend")} <span>↗</span></button>
        </form>
      </div>

      <p class="muted" style="margin-top:16px">${t("newAccount")}</p>
    </div>`;

    document.querySelector("#auth-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        const btn = document.querySelector("#auth-submit");
        btn.disabled = true;
        try {
            await login(data.email, data.password);
        } catch {
            try {
                await register(data.email, data.password, data.displayName || "Участник");
            } catch (err) {
                showToast(err.message, false);
            }
        } finally {
            btn.disabled = false;
        }
    });

    document.querySelector("#forgot-btn").addEventListener("click", () => {
        document.querySelector("#reset-panel").hidden = false;
    });

    document.querySelector("#reset-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = new FormData(e.currentTarget).get("resetEmail");
        try {
            await resetPassword(email);
            showToast(t("resetSend") + " ✓");
            document.querySelector("#reset-panel").hidden = true;
        } catch (err) {
            showToast(err.message, false);
        }
    });
}

// ── ACCOUNT SCREEN ───────────────────────────────────────────
function showAccount(user, profile) {
    const roleLabel = profile.role === "admin" ? "ADMIN" : "USER";
    account.innerHTML = `
    <div class="account-top">
      <div>
        <p class="eyebrow">SNEAKERSHOP / ${roleLabel}</p>
        <h1>${profile.displayName || "Member"}<br><em>.</em></h1>
      </div>
      <button class="button button-dark" id="logout-btn">${t("signOut")} <span>↗</span></button>
    </div>

    <nav class="account-tabs" role="tablist">
      <button class="tab-btn active" data-tab="orders">${t("tabOrders")}</button>
      <button class="tab-btn" data-tab="reviews">${t("tabReviews")}</button>
      <button class="tab-btn" data-tab="settings">${t("tabSettings")}</button>
    </nav>

    <!-- ЗАКАЗЫ -->
    <div id="tab-orders" class="tab-panel account-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("orderHistory")}</p>
          <h2>${t("yourPairs")}</h2>
        </div>
      </div>
      <div id="orders-list"><p class="muted">${t("loading")}…</p></div>
    </div>

    <!-- МОИ ОТЗЫВЫ -->
    <div id="tab-reviews" class="tab-panel account-panel" hidden>
      <div class="section-heading">
        <div>
          <p class="eyebrow">COMMUNITY</p>
          <h2>${t("myReviews")}</h2>
        </div>
      </div>
      <div id="reviews-list"><p class="muted">${t("loading")}…</p></div>
    </div>

    <!-- НАСТРОЙКИ -->
    <div id="tab-settings" class="tab-panel account-panel" hidden>
      <div class="section-heading">
        <div>
          <p class="eyebrow">${t("profile")}</p>
          <h2>${t("editDetails")}</h2>
        </div>
      </div>
      <form id="profile-form">
        <input name="displayName" placeholder="${t("namePh")}" value="${profile.displayName || ""}">
        <label class="city-choice" style="margin:0">
          <span>${t("preferCity")}</span>
          <select name="preferredCity">
            <option value="almaty" ${profile.preferredCity === "almaty" ? "selected" : ""}>${t("almaty")}</option>
            <option value="astana" ${profile.preferredCity === "astana" ? "selected" : ""}>${t("astana")}</option>
          </select>
        </label>
        <button class="button button-dark">${t("saveChanges")} <span>↗</span></button>
      </form>
    </div>`;

    // Табы
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
            document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = true));
            btn.classList.add("active");
            document.querySelector(`#tab-${btn.dataset.tab}`).hidden = false;
        });
    });

    document.querySelector("#logout-btn").addEventListener("click", logout);

    // Форма профиля
    document.querySelector("#profile-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        try {
            await updateUserProfile(user, data);
            showToast(t("saveChanges") + " ✓");
        } catch (err) {
            showToast(err.message, false);
        }
    });

    if (!firebaseReady) return;

    // Real-time заказы
    onSnapshot(
        query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc")),
        (snap) => {
            const el = document.querySelector("#orders-list");
            if (!el) return;
            if (snap.empty) { el.innerHTML = `<p class="muted">${t("noOrders")}</p>`; return; }

            el.innerHTML = snap.docs.map((d) => {
                const o = d.data();
                const chips = (o.items || [])
                    .map((it) => `<span class="order-item-chip">${it.title} ×${it.quantity} (${it.size})</span>`)
                    .join("");
                return `<div class="order-row">
                  <div class="order-meta">
                    <span class="order-id">#${d.id.slice(0, 8)}</span>
                    <span class="order-date">${fmtDate(o.createdAt)}</span>
                    <span class="order-status">${statusBadge(o.status)}</span>
                    <strong>${money(o.totalAmount)}</strong>
                  </div>
                  <div class="order-items">${chips}</div>
                </div>`;
            }).join("");
        }
    );

    // Real-time отзывы
    onSnapshot(
        query(collection(db, "reviews"), where("userId", "==", user.uid), orderBy("createdAt", "desc")),
        (snap) => {
            const el = document.querySelector("#reviews-list");
            if (!el) return;
            if (snap.empty) { el.innerHTML = `<p class="muted">${t("noReviews")}</p>`; return; }

            el.innerHTML = snap.docs.map((d) => {
                const r = d.data();
                return `<article class="review-row">
                  <div class="review-meta">
                    <strong>${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</strong>
                    <span>${r.productId?.slice(0, 14)}…</span>
                    <span>${fmtDate(r.createdAt)}</span>
                  </div>
                  <p>${r.text}</p>
                  <button class="text-button danger" data-del-review="${d.id}">${t("deleteReview")}</button>
                </article>`;
            }).join("");

            el.querySelectorAll("[data-del-review]").forEach((btn) => {
                btn.addEventListener("click", async () => {
                    if (!confirm("Удалить отзыв?")) return;
                    await deleteDoc(doc(db, "reviews", btn.dataset.delReview));
                });
            });
        }
    );
}

// ── INIT ─────────────────────────────────────────────────────
subscribeCart();
watchAuth(async (user) => {
    if (user) {
        const profile = await getCurrentUserProfile(user);
        showAccount(user, profile);
    } else {
        showAuth();
    }
});