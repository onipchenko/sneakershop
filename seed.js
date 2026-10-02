/**
 * SEED SCRIPT — заполняет Firestore тестовыми данными
 * 
 * КАК ЗАПУСТИТЬ:
 * 1. npm install firebase-admin   (в папке 3course)
 * 2. Скачай Service Account ключ:
 *    Firebase Console → Project Settings → Service accounts → Generate new private key
 *    Сохрани как serviceAccountKey.json в папку 3course/
 * 3. node seed.js
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const products = [
    {
        title: "Air Max Dn",
        brand: "Nike",
        price: 170,
        category: "running",
        sizes: ["40", "41", "42", "43", "44"],
        stock: { almaty: 7, astana: 5 },
        images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85"],
        description: "A kinetic everyday runner with a responsive step.",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
        title: "990v6 Made in USA",
        brand: "New Balance",
        price: 220,
        category: "lifestyle",
        sizes: ["39", "40", "41", "42", "43"],
        stock: { almaty: 3, astana: 5 },
        images: ["https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=900&q=85"],
        description: "The newest chapter of an American classic.",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
        title: "Samba OG",
        brand: "adidas",
        price: 120,
        category: "lifestyle",
        sizes: ["39", "40", "41", "42", "43", "44"],
        stock: { almaty: 11, astana: 10 },
        images: ["https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=85"],
        description: "A low profile icon, still moving forward.",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
        title: "Ja 3",
        brand: "Nike",
        price: 135,
        category: "basketball",
        sizes: ["40", "41", "42", "43"],
        stock: { almaty: 2, astana: 3 },
        images: ["https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=900&q=85"],
        description: "Court-ready energy with a sharp new profile.",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
        title: "2002R Protection",
        brand: "New Balance",
        price: 155,
        category: "running",
        sizes: ["40", "41", "42", "43", "44"],
        stock: { almaty: 8, astana: 7 },
        images: ["https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=85"],
        description: "Technical comfort with a weather-ready finish.",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
        title: "Gel-Kayano 14",
        brand: "ASICS",
        price: 150,
        category: "running",
        sizes: ["39", "40", "41", "42", "43"],
        stock: { almaty: 6, astana: 4 },
        images: ["https://images.unsplash.com/photo-1554135267-5c5a7c1f5e3c?auto=format&fit=crop&w=900&q=85"],
        description: "A silver-era runner for modern city miles.",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
        title: "Chuck 70 Hi",
        brand: "Converse",
        price: 95,
        category: "lifestyle",
        sizes: ["39", "40", "41", "42", "43", "44", "45"],
        stock: { almaty: 15, astana: 12 },
        images: ["https://images.unsplash.com/photo-1463100099107-aa0980c362e6?auto=format&fit=crop&w=900&q=85"],
        description: "The high-top icon, elevated for everyday style.",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
        title: "Forum Low",
        brand: "adidas",
        price: 100,
        category: "basketball",
        sizes: ["40", "41", "42", "43", "44"],
        stock: { almaty: 9, astana: 8 },
        images: ["https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=85"],
        description: "Court origins, street attitude.",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
];

async function seed() {
    console.log("🌱 Seeding products...");
    const batch = db.batch();
    products.forEach((p) => {
        const ref = db.collection("products").doc();
        batch.set(ref, p);
    });
    await batch.commit();
    console.log(`✅ ${products.length} products added to Firestore.`);
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
