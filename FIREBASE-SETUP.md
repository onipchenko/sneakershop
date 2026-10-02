# SneakerShop — Firebase Setup Guide

## 🔥 Как подключить Firebase (обязательно перед сдачей)

### Шаг 1 — Создай Firebase проект
1. Перейди на [console.firebase.google.com](https://console.firebase.google.com)
2. Нажми **"Add project"** → введи имя (например `sneakershop`)
3. Google Analytics — можно отключить (не нужен)

### Шаг 2 — Получи конфиг для веб-приложения
1. В левом меню → шестерёнка ⚙️ → **Project settings**
2. Листай вниз до раздела **"Your apps"**
3. Нажми иконку **`</>`** (Web)
4. Введи nickname (например `sneakershop-web`), нажми **Register app**
5. Скопируй объект `firebaseConfig` — он выглядит примерно так:

```js
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "sneakershop-XXXXX.firebaseapp.com",
  projectId: "sneakershop-XXXXX",
  storageBucket: "sneakershop-XXXXX.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Открой файл `js/firebase-config.js` и вставь свои значения вместо `"YOUR_..."`.

### Шаг 3 — Включи Authentication
1. Левое меню → **Authentication** → **Get started**
2. Вкладка **Sign-in method** → **Email/Password** → включи → **Save**

### Шаг 4 — Создай Firestore базу данных
1. Левое меню → **Firestore Database** → **Create database**
2. Выбери **Start in test mode** (потом заменим правилами)
3. Выбери регион (europe-west3 или ближайший)
4. **Done**

### Шаг 5 — Загрузи правила безопасности
В терминале (в папке проекта):
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

### Шаг 6 — Создай первого admin-пользователя
1. Зарегистрируйся через сайт (страница Account)
2. В Firebase Console → Firestore → коллекция `users`
3. Найди свой документ (uid = твой uid из Authentication)
4. Измени поле `role` с `"user"` на `"admin"`

### Шаг 7 — Заполни базу тестовыми данными
```bash
# В папке 3course:
npm install firebase-admin
# Скачай Service Account ключ:
# Firebase Console → Project Settings → Service accounts → Generate new private key
# Сохрани как serviceAccountKey.json
node seed.js
```

### Шаг 8 — Деплой на Firebase Hosting
```bash
firebase deploy --only hosting
```
После деплоя получишь URL вида `https://sneakershop-XXXXX.web.app`

---

## 📦 Структура коллекций Firestore

```
users/{uid}
  - uid: string
  - email: string
  - displayName: string
  - role: "user" | "admin"
  - preferredCity: "almaty" | "astana"
  - createdAt: timestamp

products/{productId}
  - title: string
  - brand: string
  - price: number
  - category: "running" | "lifestyle" | "basketball"
  - sizes: string[]
  - stock: { almaty: number, astana: number }
  - images: string[]
  - description: string
  - createdAt: timestamp

cart/{uid}
  - userId: string
  - items: CartItem[]
  - updatedAt: timestamp

orders/{orderId}
  - userId: string
  - items: CartItem[]
  - totalAmount: number
  - city: string
  - status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  - createdAt: timestamp

reviews/{reviewId}
  - productId: string
  - userId: string
  - displayName: string
  - rating: number (1-5)
  - text: string
  - createdAt: timestamp
```

---

## 🚀 Функционал проекта

| Страница | Функции |
|----------|---------|
| `index.html` | Каталог с пагинацией, фильтр по категории, сортировка по цене/новизне, фильтр по городу, поиск, real-time обновление остатков |
| `pages/product.html` | Детальная страница товара, выбор размера, добавление в корзину, отзывы (real-time), похожие товары |
| `pages/cart.html` | Корзина, изменение кол-ва, удаление, оформление заказа → сохраняется в Firestore |
| `pages/profile.html` | Вход/регистрация, сброс пароля, история заказов (real-time), свои отзывы с удалением, редактирование профиля |
| `pages/admin.html` | CRUD товаров (добавить/редактировать/удалить), все заказы + смена статуса, список пользователей + роли, модерация отзывов, статистика |

---

## ✅ Критерии по ТЗ

- [x] Аутентификация — регистрация/вход/выход/сброс пароля
- [x] Каталог с пагинацией (кнопка "Показать ещё")
- [x] Система заказов (корзина → заказ → история)
- [x] Личный кабинет с историей заказов
- [x] Схема БД — см. выше
- [x] Правила безопасности (firestore.rules)
- [x] Режим реального времени (onSnapshot в каталоге, заказах, отзывах, складских остатках)
- [x] Полноценная Админ-панель (CRUD + заказы + пользователи + модерация + статистика)
- [x] Оптимизация запросов (составные индексы в firestore.indexes.json)
- [x] Роли: user / admin
