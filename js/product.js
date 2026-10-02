import { db, firebaseReady, auth } from "./firebase-config.js";
import {
    doc,
    getDoc,
    getDocs,
    collection,
    addDoc,
    onSnapshot,
    serverTimestamp,
    query,
    where,
    orderBy,
    limit,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { addToCart, subscribeCart } from "./cart.js";
import { watchAuth } from "./auth.js";
import { t } from "./i18n.js";

const id = new URLSearchParams(location.search).get("id");

const demoFallback = {
    id: id || "demo",
    title: "Air Max Dn",
    brand: "Nike",
    price: 170,
    category: "running",
    sizes: ["40", "41", "42", "43", "44"],
    stock: { almaty: 7, astana: 5 },
    images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85",
    ],
    description: "A kinetic everyday runner with a responsive step.",
};

let product = demoFallback;
let selectedSize = product.sizes[0];

const money = (v) => `${Number(v).toFixed(0)} KZT`;

function stockTotal(p) {
    if (typeof p.stock === "object") {
        return Object.values(p.stock).reduce((a, b) => a + Number(b || 0), 0);
    }
    return Number(p.stock || 0);
}

function showToast(msg) {
    const el = document.querySelector("#toast");
    if (!el) return;
    el.textContent = msg;
    el.className = "toast visible";
    clearTimeout(el._tid);
    el._tid = setTimeout(() => el.classList.remove("visible"), 1800);
}

// ── RENDER ──────────────────────────────────────────────────
function render() {
    const total = stockTotal(product);
    document.title = `${product.title} / SneakerShop`;

    document.querySelector("#product-content").innerHTML = `
      <div class="detail-gallery">
        <img src="${product.images?.[0] || ""}" alt="${product.title}" onerror="this.style.display='none'">
        <div class="gallery-dots">
          ${(product.images || [""]).map((_, i) =>
              `<button class="${i === 0 ? "active" : ""}" aria-label="${i + 1}"></button>`
          ).join("")}
        </div>
      </div>

      <div class="detail-copy">
        <p class="eyebrow">${product.brand} / ${product.category}</p>
        <h1>${product.title}</h1>
        <p class="detail-price">${money(product.price)}</p>
        <p class="detail-description">${product.description || ""}</p>

        <div class="size-header">
          <span>${t("selectSize")}</span>
          <span class="muted">${t("trueToSize")}</span>
        </div>
        <div class="size-grid">
          ${(product.sizes || []).map((s) =>
              `<button class="size-button ${s === selectedSize ? "active" : ""}" data-size="${s}">${s}</button>`
          ).join("")}
        </div>

        <button class="button button-dark add-button" id="add-button" ${total === 0 ? "disabled" : ""}>
          ${total > 0 ? `${t("addToBag")} <span>↗</span>` : t("soldOutBtn")}
        </button>
        <p class="stock-note" id="stock-note">
          ${total > 0 ? `${total} ${t("pairs")}` : t("soldOut")}
        </p>
      </div>

      <!-- ОТЗЫВЫ -->
      <section class="reviews">
        <div class="section-heading">
          <div><p class="eyebrow">COMMUNITY</p><h2>${t("reviews")}</h2></div>
        </div>
        <div id="review-list" class="review-list"><p class="muted">${t("loading")}…</p></div>
        <form id="review-form" class="review-form">
          <input name="rating" type="number" min="1" max="5" placeholder="${t("ratingPh")}" required>
          <input name="text" placeholder="${t("reviewPh")}" required>
          <button class="button button-dark">${t("postNote")} <span>↗</span></button>
        </form>
      </section>

      <!-- ПОХОЖИЕ -->
      <section class="related-section">
        <div class="section-heading">
          <div><p class="eyebrow">ALSO</p><h2>${t("relatedTitle")}</h2></div>
        </div>
        <div class="product-grid" id="related-grid"></div>
      </section>`;

    // Размеры
    document.querySelectorAll(".size-button").forEach((btn) =>
        btn.addEventListener("click", () => {
            selectedSize = btn.dataset.size;
            document.querySelectorAll(".size-button").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
        })
    );

    // В корзину
    document.querySelector("#add-button").addEventListener("click", async () => {
        await addToCart(product, selectedSize);
        showToast(`${t("addToBag")} ✓`);
    });

    // Форма отзыва
    document.querySelector("#review-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!firebaseReady || !auth.currentUser) {
            alert(t("signIn") + " →");
            return;
        }
        const data = Object.fromEntries(new FormData(e.currentTarget));
        await addDoc(collection(db, "reviews"), {
            productId: product.id,
            userId: auth.currentUser.uid,
            displayName: auth.currentUser.displayName || "Участник",
            rating: Number(data.rating),
            text: data.text,
            createdAt: serverTimestamp(),
        });
        e.currentTarget.reset();
    });

    loadReviews();
    loadRelated();
}

// ── REAL-TIME ОТЗЫВЫ ─────────────────────────────────────────
function loadReviews() {
    if (!firebaseReady || !product.id) return;
    onSnapshot(
        query(
            collection(db, "reviews"),
            where("productId", "==", product.id),
            orderBy("createdAt", "desc")
        ),
        (snap) => {
            const list = document.querySelector("#review-list");
            if (!list) return;
            list.innerHTML = snap.empty
                ? `<p class="muted">${t("firstReview")}</p>`
                : snap.docs.map((d) => {
                    const r = d.data();
                    return `<article class="review-row">
                      <div class="review-meta">
                        <strong>${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</strong>
                        <span>${r.displayName}</span>
                      </div>
                      <p>${r.text}</p>
                    </article>`;
                }).join("");
        }
    );
}

// ── ПОХОЖИЕ ТОВАРЫ ───────────────────────────────────────────
async function loadRelated() {
    if (!firebaseReady || !product.category) return;
    const snap = await getDocs(
        query(collection(db, "products"), where("category", "==", product.category), limit(4))
    );
    const grid = document.querySelector("#related-grid");
    if (!grid) return;
    const items = snap.docs.filter((d) => d.id !== product.id).slice(0, 3);
    grid.innerHTML = items.length
        ? items.map((d) => {
            const p = d.data();
            return `<article class="product-card">
              <a href="./product.html?id=${d.id}">
                <div class="product-image">
                  <img loading="lazy" src="${p.images?.[0] || ""}" alt="${p.title}">
                </div>
                <div class="product-info">
                  <div><h3>${p.title}</h3><p>${p.brand}</p></div>
                  <span class="product-price">${money(p.price)}</span>
                </div>
              </a>
            </article>`;
        }).join("")
        : `<p class="muted">${t("noOrders")}</p>`;
}

// ── REAL-TIME ОСТАТКИ ────────────────────────────────────────
function listenStock() {
    if (!firebaseReady || !id) return;
    onSnapshot(doc(db, "products", id), (snap) => {
        if (!snap.exists()) return;
        product = { id: snap.id, ...snap.data() };
        const note = document.querySelector("#stock-note");
        if (note) {
            const total = stockTotal(product);
            note.textContent = total > 0 ? `${total} ${t("pairs")}` : t("soldOut");
        }
    });
}

// ── INIT ─────────────────────────────────────────────────────
async function init() {
    if (firebaseReady && id) {
        const snap = await getDoc(doc(db, "products", id));
        if (snap.exists()) {
            product = { id: snap.id, ...snap.data() };
            selectedSize = product.sizes?.[0] || "";
        }
    }
    render();
    listenStock();
}

subscribeCart();
watchAuth(() => {});
init();
