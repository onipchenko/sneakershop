const translations = {
    kk: {
        shipping: "Қазақстан бойынша жеткізу тегін", live: "Қоймадағы нақты қалдық", shop: "Дүкен", account: "Аккаунт", studio: "Студия", search: "Атауы немесе бренді бойынша іздеу", all: "Барлығы", running: "Жүгіру", lifestyle: "Күнделікті", basketball: "Баскетбол", newest: "Жаңалары", priceAsc: "Бағасы: арзанырақ", priceDesc: "Бағасы: қымбатырақ", arrivals: "Жаңа топтама", explore: "Топтаманы көру", loading: "Тауарлар жүктелуде...", loadMore: "Тағы көрсету", pairs: "жұп / тікелей қалдық", inStock: "БАР", soldOut: "САТЫЛДЫ"
    },
    ru: {
        shipping: "Бесплатная доставка по Казахстану", live: "Актуальные остатки в магазинах", shop: "Магазин", account: "Аккаунт", studio: "Студия", search: "Поиск по названию или бренду", all: "Все", running: "Беговые", lifestyle: "Lifestyle", basketball: "Баскетбол", newest: "Новинки", priceAsc: "Цена: сначала дешевле", priceDesc: "Цена: сначала дороже", arrivals: "Новая коллекция", explore: "Смотреть коллекцию", loading: "Загружаем товары...", loadMore: "Показать ещё", pairs: "пар / остаток онлайн", inStock: "В НАЛИЧИИ", soldOut: "РАСПРОДАНО"
    },
    en: {
        shipping: "Free delivery across Kazakhstan", live: "Live store inventory", shop: "Shop", account: "Account", studio: "Studio", search: "Search by name or brand", all: "All", running: "Running", lifestyle: "Lifestyle", basketball: "Basketball", newest: "Newest", priceAsc: "Price: low to high", priceDesc: "Price: high to low", arrivals: "Latest arrivals", explore: "Explore the drop", loading: "Loading products...", loadMore: "Load more", pairs: "pairs / live stock", inStock: "IN STOCK", soldOut: "SOLD OUT"
    }
};

export let currentLanguage = localStorage.getItem("sneakershop-language") || "ru";
export const t = key => translations[currentLanguage][key] || translations.ru[key] || key;

export function setLanguage(language) {
    if (!translations[language]) return;
    currentLanguage = language;
    localStorage.setItem("sneakershop-language", language);
    document.documentElement.lang = language;
    document.querySelectorAll("[data-i18n]").forEach(element => { element.textContent = t(element.dataset.i18n); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(element => { element.placeholder = t(element.dataset.i18nPlaceholder); });
    document.querySelectorAll("[data-lang]").forEach(element => element.classList.toggle("active", element.dataset.lang === language));
    document.dispatchEvent(new CustomEvent("languagechange", { detail: language }));
}

export function setupLanguageSwitcher() {
    document.querySelectorAll("[data-lang]").forEach(element => element.addEventListener("click", () => setLanguage(element.dataset.lang)));
    setLanguage(currentLanguage);
}