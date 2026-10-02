import { db } from "./firebase-config.js";
import { requireAdmin } from "./auth.js";
import { t, setupLanguageSwitcher } from "./i18n.js";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
    getCountFromServer,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ── helpers ───────────────────────────────────────────────────
function toast(msg, ok = true) {
    const el = document.querySelector("#toast");
    if (!el) return;
    el.textContent = msg;
    el.className = "toast visible" + (ok ? "" : " error");
    clearTimeout(el._tid);
    el._tid = setTimeout(() => el.classList.remove("visible"), 2800);
}
function money(v) { return `${Number(v).toFixed(0)} KZT`; }
function fmtDate(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

// ── TABS ──────────────────────────────────────────────────────
function setupTabs() {
    document.querySelectorAll(".admin-tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".admin-tab-btn").forEach((b) => b.classList.remove("active"));
            document.querySelectorAll(".admin-tab-panel").forEach((p) => (p.hidden = true));
            btn.classList.add("active");
            document.querySelector(`#tab-${btn.dataset.tab}`).hidden = false;
        });
    });
}

// ── PRODUCTS ──────────────────────────────────────────────────
let editingProductId = null;

function setupProducts() {
    const form = document.querySelector("#product-form");
    const list = document.querySelector("#admin-products");
    const cancelBtn = document.querySelector("#cancel-edit");

    onSnapshot(query(collection(db, "products"), orderBy("createdAt", "desc")), (snap) => {
        list.innerHTML = snap.empty
            ? `<tr><td colspan="6" class="muted">No products yet.</td></tr>`
            : snap.docs.map((d) => {
                const p = d.data();
                const total = (typeof p.stock === "object")
                    ? Object.values(p.stock).reduce((a, b) => a + Number(b), 0)
                    : Number(p.stock || 0);
                return `<tr>
                  <td>${p.title}</td>
                  <td>${p.brand}</td>
                  <td>${p.category}</td>
                  <td>${money(p.price)}</td>
                  <td>${total}</td>
                  <td>
                    <button class="table-action" data-edit="${d.id}">Edit</button>
                    <button class="table-action danger" data-delete="${d.id}">Del</button>
                  </td>
                </tr>`;
            }).join("");

        list.querySelectorAll("[data-delete]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm("Delete product?")) return;
                await deleteDoc(doc(db, "products", btn.dataset.delete));
                toast("Deleted.");
            });
        });

        list.querySelectorAll("[data-edit]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const snap2 = await getDocs(query(collection(db, "products")));
                const found = snap2.docs.find((d) => d.id === btn.dataset.edit);
                if (!found) return;
                const p = found.data();
                editingProductId = found.id;
                form.title.value = p.title || "";
                form.brand.value = p.brand || "";
                form.price.value = p.price || "";
                form.stockAlmaty.value = p.stock?.almaty || 0;
                form.stockAstana.value = p.stock?.astana || 0;
                form.category.value = p.category || "running";
                form.sizes.value = (p.sizes || []).join(", ");
                form.image.value = p.images?.[0] || "";
                form.description.value = p.description || "";
                document.querySelector("#form-title").textContent = "Edit product";
                cancelBtn.hidden = false;
                form.scrollIntoView({ behavior: "smooth" });
            });
        });
    });

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            editingProductId = null;
            form.reset();
            document.querySelector("#form-title").textContent = "Add product";
            cancelBtn.hidden = true;
        });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        const payload = {
            title: data.title,
            brand: data.brand,
            price: Number(data.price),
            stock: { almaty: Number(data.stockAlmaty || 0), astana: Number(data.stockAstana || 0) },
            category: data.category,
            sizes: data.sizes.split(",").map((s) => s.trim()).filter(Boolean),
            images: data.image ? [data.image] : [],
            description: data.description,
        };
        try {
            if (editingProductId) {
                await updateDoc(doc(db, "products", editingProductId), payload);
                toast("Product updated!");
                editingProductId = null;
                document.querySelector("#form-title").textContent = "Add product";
                cancelBtn.hidden = true;
            } else {
                payload.createdAt = serverTimestamp();
                await addDoc(collection(db, "products"), payload);
                toast("Product published!");
            }
            form.reset();
        } catch (err) {
            toast(err.message, false);
        }
    });
}

// ── ORDERS ────────────────────────────────────────────────────
function setupOrders() {
    const list = document.querySelector("#admin-orders");
    if (!list) return;

    onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
        list.innerHTML = snap.empty
            ? `<tr><td colspan="6" class="muted">No orders yet.</td></tr>`
            : snap.docs.map((d) => {
                const o = d.data();
                return `<tr>
                  <td>#${d.id.slice(0, 8)}</td>
                  <td>${fmtDate(o.createdAt)}</td>
                  <td>${o.city || "—"}</td>
                  <td>${money(o.totalAmount)}</td>
                  <td>
                    <select class="order-status-select" data-order-id="${d.id}">
                      ${["pending","confirmed","shipped","delivered","cancelled"].map(
                          (s) => `<option ${o.status === s ? "selected" : ""} value="${s}">${s}</option>`
                      ).join("")}
                    </select>
                  </td>
                  <td>${(o.items || []).map((it) => `${it.title}×${it.quantity}`).join(", ")}</td>
                </tr>`;
            }).join("");

        list.querySelectorAll(".order-status-select").forEach((sel) => {
            sel.addEventListener("change", async () => {
                await updateDoc(doc(db, "orders", sel.dataset.orderId), { status: sel.value });
                toast("Status updated.");
            });
        });
    });
}

// ── USERS ─────────────────────────────────────────────────────
function setupUsers() {
    const list = document.querySelector("#admin-users");
    if (!list) return;

    onSnapshot(collection(db, "users"), (snap) => {
        list.innerHTML = snap.empty
            ? `<tr><td colspan="4" class="muted">No users yet.</td></tr>`
            : snap.docs.map((d) => {
                const u = d.data();
                return `<tr>
                  <td>${u.displayName || "—"}</td>
                  <td>${u.email}</td>
                  <td>
                    <select class="user-role-select" data-uid="${d.id}">
                      <option ${u.role === "user" ? "selected" : ""} value="user">user</option>
                      <option ${u.role === "admin" ? "selected" : ""} value="admin">admin</option>
                    </select>
                  </td>
                  <td>${fmtDate(u.createdAt)}</td>
                </tr>`;
            }).join("");

        list.querySelectorAll(".user-role-select").forEach((sel) => {
            sel.addEventListener("change", async () => {
                await updateDoc(doc(db, "users", sel.dataset.uid), { role: sel.value });
                toast(`Role → ${sel.value}`);
            });
        });
    });
}

// ── REVIEWS MODERATION ────────────────────────────────────────
function setupReviews() {
    const list = document.querySelector("#admin-reviews");
    if (!list) return;

    onSnapshot(query(collection(db, "reviews"), orderBy("createdAt", "desc")), (snap) => {
        list.innerHTML = snap.empty
            ? `<p class="muted">No reviews yet.</p>`
            : snap.docs.map((d) => {
                const r = d.data();
                return `<article class="review-row">
                  <div class="review-meta">
                    <strong>${"★".repeat(r.rating)}</strong>
                    <span class="muted">${r.displayName} / ${r.productId?.slice(0, 10)}…</span>
                    <span class="muted">${fmtDate(r.createdAt)}</span>
                  </div>
                  <p>${r.text}</p>
                  <button class="text-button danger" data-del="${d.id}">Delete</button>
                </article>`;
            }).join("");

        list.querySelectorAll("[data-del]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                if (!confirm("Delete review?")) return;
                await deleteDoc(doc(db, "reviews", btn.dataset.del));
                toast("Review deleted.");
            });
        });
    });
}

// ── STATS ─────────────────────────────────────────────────────
async function loadStats() {
    const stats = document.querySelector("#admin-stats");
    if (!stats) return;
    try {
        const [products, orders, users, reviews] = await Promise.all([
            getCountFromServer(collection(db, "products")),
            getCountFromServer(collection(db, "orders")),
            getCountFromServer(collection(db, "users")),
            getCountFromServer(collection(db, "reviews")),
        ]);
        // Revenue
        const ordSnap = await getDocs(collection(db, "orders"));
        const revenue = ordSnap.docs.reduce((s, d) => s + Number(d.data().totalAmount || 0), 0);

        stats.innerHTML = `
          <div class="stat-card"><span class="stat-num">${products.data().count}</span><span class="stat-label">Products</span></div>
          <div class="stat-card"><span class="stat-num">${orders.data().count}</span><span class="stat-label">Orders</span></div>
          <div class="stat-card"><span class="stat-num">${money(revenue)}</span><span class="stat-label">Revenue</span></div>
          <div class="stat-card"><span class="stat-num">${users.data().count}</span><span class="stat-label">Users</span></div>
          <div class="stat-card"><span class="stat-num">${reviews.data().count}</span><span class="stat-label">Reviews</span></div>`;
    } catch {
        stats.innerHTML = `<p class="muted">Stats unavailable.</p>`;
    }
}

// ── MAIN ─────────────────────────────────────────────────────
setupLanguageSwitcher();
requireAdmin(() => {
    setupTabs();
    setupProducts();
    setupOrders();
    setupUsers();
    setupReviews();
    loadStats();
});