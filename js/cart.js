import { auth, db, firebaseReady } from "./firebase-config.js";
import {
    doc,
    onSnapshot,
    setDoc,
    deleteDoc,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { watchAuth } from "./auth.js";

const localKey = "sneakershop-cart";
const readLocal = () => JSON.parse(localStorage.getItem(localKey) || "[]");
const saveLocal = (items) => {
    localStorage.setItem(localKey, JSON.stringify(items));
    updateBadge(items);
};

let currentItems = readLocal();
let unsubscribeSnapshot = null;

function updateBadge(items = currentItems) {
    document.querySelectorAll("#cart-count").forEach((el) => {
        el.textContent = items.reduce((sum, item) => sum + item.quantity, 0);
    });
}

export function getCart() { return currentItems; }
export function cartTotal() {
    return currentItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
export function getSelectedCity() {
    return localStorage.getItem("sneakershop-city") || "almaty";
}
export function setSelectedCity(city) {
    localStorage.setItem("sneakershop-city", city);
}

async function persist() {
    saveLocal(currentItems);
    if (firebaseReady && auth?.currentUser) {
        await setDoc(doc(db, "cart", auth.currentUser.uid), {
            userId: auth.currentUser.uid,
            items: currentItems,
            updatedAt: serverTimestamp(),
        });
    }
}

export async function addToCart(product, size) {
    const existing = currentItems.find(
        (item) => item.id === product.id && item.size === size
    );
    if (existing) {
        existing.quantity += 1;
    } else {
        currentItems.push({
            id: product.id,
            title: product.title,
            brand: product.brand,
            price: product.price,
            image: product.images?.[0] || "",
            size,
            quantity: 1,
        });
    }
    await persist();
}

export async function removeFromCart(id, size) {
    currentItems = currentItems.filter(
        (item) => !(item.id === id && item.size === size)
    );
    await persist();
}

export async function changeQuantity(id, size, quantity) {
    const item = currentItems.find(
        (entry) => entry.id === id && entry.size === size
    );
    if (item) item.quantity = Math.max(1, quantity);
    await persist();
}

export async function clearCart() {
    currentItems = [];
    await persist();
}

export function subscribeCart(callback = () => {}) {
    updateBadge();
    watchAuth((user) => {
        if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
            unsubscribeSnapshot = null;
        }
        if (!firebaseReady || !user) {
            callback(currentItems);
            return;
        }
        unsubscribeSnapshot = onSnapshot(
            doc(db, "cart", user.uid),
            (snap) => {
                currentItems = snap.exists() ? snap.data().items || [] : readLocal();
                saveLocal(currentItems);
                callback(currentItems);
            }
        );
    });
}