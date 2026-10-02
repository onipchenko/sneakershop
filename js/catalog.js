import { db, firebaseReady } from "./firebase-config.js";
import {
  collection,
  endBefore,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { t, setupLanguageSwitcher } from "./i18n.js";

const demoProducts = [
  {
    id: "air-max-dn",
    title: "Air Max Dn",
    brand: "Nike",
    price: 170,
    category: "running",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
    ],
    sizes: ["40", "41", "42", "43", "44"],
    stock: { almaty: 7, astana: 5 },
    description: "A kinetic everyday runner with a responsive step.",
  },
  {
    id: "990v6-made",
    title: "990v6 Made in USA",
    brand: "New Balance",
    price: 220,
    category: "lifestyle",
    images: [
      "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=900&q=85",
    ],
    sizes: ["39", "40", "41", "42", "43"],
    stock: { almaty: 3, astana: 5 },
    description: "The newest chapter of an American classic.",
  },
  {
    id: "samba-og",
    title: "Samba OG",
    brand: "adidas",
    price: 120,
    category: "lifestyle",
    images: [
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=85",
    ],
    sizes: ["39", "40", "41", "42", "43", "44"],
    stock: { almaty: 11, astana: 10 },
    description: "A low profile icon, still moving forward.",
  },
  {
    id: "ja-3",
    title: "Ja 3",
    brand: "Nike",
    price: 135,
    category: "basketball",
    images: [
      "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=900&q=85",
    ],
    sizes: ["40", "41", "42", "43"],
    stock: { almaty: 2, astana: 3 },
    description: "Court-ready energy with a sharp new profile.",
  },
  {
    id: "2002r",
    title: "2002R Protection",
    brand: "New Balance",
    price: 155,
    category: "running",
    images: [
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=85",
    ],
    sizes: ["40", "41", "42", "43", "44"],
    stock: { almaty: 8, astana: 7 },
    description: "Technical comfort with a weather-ready finish.",
  },
  {
    id: "gel-kayano",
    title: "Gel-Kayano 14",
    brand: "ASICS",
    price: 150,
    category: "running",
    images: [
      "https://images.unsplash.com/photo-1554135267-5c5a7c1f5e3c?auto=format&fit=crop&w=900&q=85",
    ],
    sizes: ["39", "40", "41", "42", "43"],
    stock: { almaty: 6, astana: 4 },
    description: "A silver-era runner for modern city miles.",
  },
];
let products = [];
let lastDoc = null;
let activeFilter = "all";
let activeCity = "all";
let search = "";
let sort = "newest";
const grid = document.querySelector("#product-grid");
const money = (value) => `${Number(value).toFixed(0)} KZT`;
function placeholder(title = "NORTHSTAR") {
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 880"><rect width="800" height="880" fill="#dedbd5"/><path d="M180 600h440v40H180zM250 560h300v32H250z" fill="#161616"/><text x="400" y="760" fill="#74716c" text-anchor="middle" font-family="monospace" font-size="26">${title}</text></svg>`)}`;
}
function filtered() {
  return products
    .filter(
      (product) =>
        (activeFilter === "all" || product.category === activeFilter) &&
        (activeCity === "all" ||
          Number(product.stock?.[activeCity] || 0) > 0) &&
        `${product.title} ${product.brand}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "price-asc"
        ? a.price - b.price
        : sort === "price-desc"
          ? b.price - a.price
          : 0,
    );
}
function stockTotal(product) {
  return typeof product.stock === "object"
    ? Number(product.stock.almaty || 0) + Number(product.stock.astana || 0)
    : Number(product.stock || 0);
}
function render() {
  const visible = filtered();
  grid.innerHTML = visible.length
    ? visible
        .map(
          (product) =>
            `<article class="product-card"><a href="./pages/product.html?id=${product.id}"><div class="product-image"><img loading="lazy" src="${product.images?.[0] || placeholder(product.brand)}" alt="${product.brand} ${product.title}" onerror="this.src='${placeholder(product.brand)}'"><span class="product-badge"></span></div><div class="product-info"><div><h3>${product.title}</h3><p>${product.brand} / ${product.category}</p></div><span class="product-price">${money(product.price)}</span></div></a></article>`,
        )
        .join("")
    : `<div class="empty-state">No pairs found in this edit.</div>`;
}
function skeletons() {
  grid.innerHTML = Array.from(
    { length: 4 },
    () =>
      `<div class="skeleton-card"><div class="product-image skeleton"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line short"></div></div>`,
  ).join("");
}
async function loadProducts(loadMore = false) {
  if (!loadMore) {
    skeletons();
    lastDoc = null;
  }
  if (!firebaseReady) {
    products = loadMore ? [...products, ...demoProducts] : demoProducts;
    render();
    return;
  }
  const constraints = [
    collection(db, "products"),
    orderBy("createdAt", "desc"),
    limit(12),
  ];
  if (loadMore && lastDoc) constraints.push(startAfter(lastDoc));
  const snapshot = await getDocs(query(...constraints));
  lastDoc = snapshot.docs.at(-1);
  products = loadMore
    ? [
        ...products,
        ...snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
      ]
    : snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  render();
}
function listenStock() {
  if (!firebaseReady) return;
  return onSnapshot(
    query(collection(db, "products"), limit(12)),
    (snapshot) => {
      const live = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      products = products.map(
        (product) => live.find((item) => item.id === product.id) || product,
      );
      render();
    },
  );
}
function setupHeroSlider() {
  if (!window.Splide) return;
  const sliderElement = document.querySelector("#hero-slider");
  if (!sliderElement) return;
  const slides = sliderElement.querySelectorAll(".hero-slide");
  const current = document.querySelector("#hero-current");
  const slider = new Splide(sliderElement, {
    type: "loop",
    perPage: 1,
    perMove: 1,
    arrows: true,
    pagination: true,
    drag: true,
    snap: true,
    speed: 650,
    easing: "cubic-bezier(.22,.61,.36,1)",
    autoplay: true,
    interval: 5200,
    pauseOnHover: true,
    pauseOnFocus: true,
    resetProgress: false,
    keyboard: "global",
    accessibility: true,
  });
  const updateCurrent = () => {
    current.textContent = String((slider.index % slides.length) + 1).padStart(
      2,
      "0",
    );
  };
  slider.on("mounted move", updateCurrent);
  slider.mount();
}
document.querySelectorAll(".filter-button").forEach((button) =>
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-button")
      .forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    render();
  }),
);
function closeSelectFields(except) {
  document.querySelectorAll(".select-field").forEach((field) => {
    if (field === except) return;
    field.classList.remove("open");
    field
      .querySelector(".select-trigger")
      ?.setAttribute("aria-expanded", "false");
  });
}
function syncSelectField(field) {
  const native = field.querySelector("select");
  const valueEl = field.querySelector(".select-value");
  if (!native || !valueEl) return;
  const selected = native.options[native.selectedIndex];
  valueEl.textContent = selected?.textContent.trim() || "";
  field.querySelectorAll("[role='option']").forEach((option) => {
    option.setAttribute(
      "aria-selected",
      option.dataset.value === native.value ? "true" : "false",
    );
  });
}
function setupSelectFields() {
  document.querySelectorAll(".select-field").forEach((field) => {
    const native = field.querySelector("select");
    const trigger = field.querySelector(".select-trigger");
    const menu = field.querySelector(".select-menu");
    if (!native || !trigger || !menu) return;
    syncSelectField(field);
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = !field.classList.contains("open");
      closeSelectFields();
      field.classList.toggle("open", willOpen);
      trigger.setAttribute("aria-expanded", String(willOpen));
    });
    menu.querySelectorAll("[role='option']").forEach((option) => {
      option.addEventListener("click", (event) => {
        event.stopPropagation();
        native.value = option.dataset.value;
        native.dispatchEvent(new Event("change", { bubbles: true }));
        syncSelectField(field);
        closeSelectFields();
      });
    });
  });
  document.addEventListener("click", () => closeSelectFields());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSelectFields();
  });
  document.addEventListener("languagechange", () => {
    document.querySelectorAll(".select-field").forEach(syncSelectField);
  });
}
document.querySelector("#sort-select").addEventListener("change", (event) => {
  sort = event.target.value;
  render();
});
document.querySelector("#city-select").addEventListener("change", (event) => {
  activeCity = event.target.value;
  render();
});
setupSelectFields();
document
  .querySelector("#load-more")
  .addEventListener("click", () => loadProducts(true));
document.querySelector("#search-toggle").addEventListener("click", () => {
  const panel = document.querySelector("#search-panel");
  panel.hidden = !panel.hidden;
  if (!panel.hidden) document.querySelector("#search-input").focus();
});
document.querySelector("#search-input").addEventListener("input", (event) => {
  search = event.target.value;
  render();
});
document
  .querySelector("#menu-toggle")
  .addEventListener("click", () =>
    document.querySelector(".main-nav").classList.toggle("open"),
  );
setupLanguageSwitcher();
document.addEventListener("languagechange", render);
loadProducts();
listenStock();
setupHeroSlider();
