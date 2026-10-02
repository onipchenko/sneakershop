import { db, firebaseReady, auth } from "./firebase-config.js";
import {
    addDoc,
    collection,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
    getCart,
    cartTotal,
    subscribeCart,
    removeFromCart,
    changeQuantity,
    clearCart,
    getSelectedCity,
    setSelectedCity,
} from "./cart.js";
import { t, setupLanguageSwitcher } from "./i18n.js";
setupLanguageSwitcher();


const listEl  = document.querySelector("#cart-items");
const totalEl = document.querySelector("#cart-total");
const totalCopyEl = document.querySelector("#cart-total-copy");

const money = (v) => `${Number(v).toFixed(0)} KZT`;

function showToast(msg, ok = true) {
    const el = document.querySelector("#toast");
    if (!el) return;
    el.textContent = msg;
    el.className = "toast visible" + (ok ? "" : " error");
    clearTimeout(el._tid);
    el._tid = setTimeout(() => el.classList.remove("visible"), 2800);
}

function render(items) {
    if (totalEl) totalEl.textContent = money(cartTotal());
    if (totalCopyEl) totalCopyEl.textContent = money(cartTotal());

    if (!items.length) {
        listEl.innerHTML = `<div class="empty-state">${t("bagEmpty")}</div>`;
        return;
    }

    listEl.innerHTML = items.map((item) => `
      <div class="cart-row">
        <img src="${item.image}" alt="${item.title}" onerror="this.style.background='var(--surface)'">
        <div class="cart-row-info">
          <h3>${item.title}</h3>
          <p>${item.brand} · EU ${item.size}</p>
          <button class="text-button danger" data-remove="${item.id}|${item.size}">✕ ${t("deleteReview").toLowerCase()}</button>
        </div>
        <div class="quantity">
          <button data-minus="${item.id}|${item.size}">−</button>
          <span>${item.quantity}</span>
          <button data-plus="${item.id}|${item.size}">+</button>
        </div>
        <strong>${money(item.price * item.quantity)}</strong>
      </div>`
    ).join("");

    // Remove
    listEl.querySelectorAll("[data-remove]").forEach((btn) =>
        btn.addEventListener("click", () => {
            const [id, size] = btn.dataset.remove.split("|");
            removeFromCart(id, size);
        })
    );

    // Qty
    listEl.querySelectorAll("[data-minus], [data-plus]").forEach((btn) =>
        btn.addEventListener("click", () => {
            const key = btn.dataset.minus || btn.dataset.plus;
            const [id, size] = key.split("|");
            const item = getCart().find((e) => e.id === id && e.size === size);
            if (!item) return;
            changeQuantity(id, size, item.quantity + (btn.dataset.plus !== undefined ? 1 : -1));
        })
    );
}

// Город
const citySelect = document.querySelector("#checkout-city");
if (citySelect) {
    citySelect.value = getSelectedCity();
    citySelect.addEventListener("change", (e) => setSelectedCity(e.target.value));
}

// Оформить заказ
document.querySelector("#checkout")?.addEventListener("click", async () => {
    const items = getCart();
    if (!items.length) return showToast(t("bagEmpty"), false);
    if (!auth?.currentUser) return showToast(t("signIn") + " →", false);
    if (firebaseReady) {
        try {
            await addDoc(collection(db, "orders"), {
                userId: auth.currentUser.uid,
                items,
                totalAmount: cartTotal(),
                city: getSelectedCity(),
                status: "pending",
                createdAt: serverTimestamp(),
            });
            await clearCart();
            showToast(t("checkout") + " ✓");
        } catch (err) {
            showToast(err.message, false);
        }
    }
});

subscribeCart(render);