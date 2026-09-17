# Mock data / Firebase setup

1. Create a Firebase Web app, enable **Authentication → Email/Password** and create a Firestore database.
2. Copy the Web app values into `js/firebase-config.js`. Deploy `firestore.rules` from the Firebase console Rules tab.
3. Add documents to `products` with these fields: `title`, `brand`, `price` (number), `category`, `sizes` (array), `images` (array), `description: { ru, kk, en }`, `stock: { almaty, astana }`, `createdAt` (timestamp).

Example documents:

```json
{
  "title": "Air Max Dn",
  "brand": "Nike",
  "price": 170,
  "category": "running",
  "sizes": ["40", "41", "42", "43", "44"],
  "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85"],
  "description": { "ru": "Динамичная модель для ежедневного движения.", "kk": "Күнделікті қозғалысқа арналған модель.", "en": "A kinetic everyday runner." },
  "stock": { "almaty": 7, "astana": 5 },
  "createdAt": "Firestore server timestamp"
}
```

More image URLs for testing:

- `https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1200&q=85`
- `https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=85`
- `https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=1200&q=85`

To create an administrator, register normally, then change that user's `role` to `admin` in `users/{uid}`. The app works in preview mode without Firebase config using six local demo products and localStorage cart.

## Additional seed models

Use the same schema for these models: **Air Jordan 1 Retro High OG** (Jordan, 210, stock `{almaty: 4, astana: 6}`), **Yeezy 350 V2 Bone** (Yeezy, 245, `{almaty: 2, astana: 3}`), **550 White Green** (New Balance, 140, `{almaty: 5, astana: 4}`), **Dunk Low Panda** (Nike, 135, `{almaty: 8, astana: 2}`), **Campus 00s** (adidas, 125, `{almaty: 4, astana: 7}`), **Air Force 1 '07** (Nike, 130, `{almaty: 9, astana: 8}`), **Gel-Kayano 14** (ASICS, 150, `{almaty: 6, astana: 4}`). For each, provide `description.ru`, `description.kk`, `description.en` and one image URL from the list above.