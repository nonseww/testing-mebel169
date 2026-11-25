# Описание страниц и локаторов (Page Object)

Все локаторы лежат только в слое `ui/`. Тесты (`autotest/`) обращаются к элементам по именам полей,
например `app.login.submitButton`, и не знают о CSS-селекторах.

**Как выбирались локаторы:**
1. `id` и `data-*` атрибуты (`#login`, `[data-login-submit]`). Они стабильнее всего.
2. Роль и доступное имя (`getByRole('dialog')`, `getByRole('link', { name })`). Используются для модальных окон и ссылок.
3. Классы БЭМ (`.cart-page__basket-items`). Используются, если на сайте нет id или data-атрибута.
4. Видимый текст (`getByText('Корзина пустая')`). Используется только для состояний без других признаков.

Локатор вложенного элемента строится от корня компонента: например, все элементы формы входа ищутся
внутри `form[data-login-form]`. Так в другой части страницы не найдётся одноимённый элемент.

**Тип элемента** задаётся обёрткой из `ui/elements`:
- `BaseElement` — любой элемент;
- `Input` — поле ввода; если поле `sensitive`, его значение не пишется в лог;
- `Choice` — радиокнопка или чекбокс: клик идёт по `label[for=id]`, состояние проверяется по `input#id`.

---

## LoginPage: вход в личный кабинет
`ui/pages/LoginPage.ts`. Адрес: `https://lk.169.ru/auth/login/?redirect_url=…`. Страница считается загруженной, когда появилась кнопка «Войти».

| Элемент | Поле | Тип | Локатор |
|---|---|---|---|
| Форма входа | `form` | — | `form[data-login-form]` |
| Email или телефон | `loginInput` | Input | `form[data-login-form] input#login` |
| Пароль | `passwordInput` | Input, sensitive | `form[data-login-form] input#password` |
| Кнопка «Войти» | `submitButton` | BaseElement | `form[data-login-form] [data-login-submit]` |
| Показать пароль | `passwordToggle` | BaseElement | `form[data-login-form] [data-password-toggle]` |
| Ошибка поля логина | `loginError` | BaseElement | `form[data-login-form] #login-error` |
| Ошибка поля пароля | `passwordError` | BaseElement | `form[data-login-form] #password-error` |

Признак ошибочного поля: класс `is-invalid` на `input`.

## AccountPage: личный кабинет
`ui/pages/AccountPage.ts`. Адрес: `https://lk.169.ru/`. Используется как индикатор сессии: без входа эта страница перенаправляет на `/auth/login`.

| Элемент | Локатор |
|---|---|
| Страница ЛК | `body` |

## Header: шапка магазина (компонент)
`ui/components/Header.ts`. Есть на всех страницах магазина. Корень: `#header-main`.

| Элемент | Поле | Тип | Локатор |
|---|---|---|---|
| Строка поиска | `searchInput` | Input | `#header-main input#search-box` |
| Кнопка поиска | `searchSubmit` | BaseElement | `#header-main .search-box__submit` |
| Имя пользователя / «Войти» | `userMenuName` | BaseElement | `#header-main [data-user-menu-name]` |
| Ссылка на корзину | `cartLink` | BaseElement | `#header-main a.user-bar__link--cart` |
| Счётчик корзины | `cartCounter` | BaseElement | `#header-main a.user-bar__link--cart .js-cart-status` (число в `data-amount`) |

## HomePage: главная
`ui/pages/HomePage.ts`. Адрес: `/`. Страница считается загруженной, когда видна строка поиска в шапке.

## SearchResultsPage: выдача поиска
`ui/pages/SearchResultsPage.ts`. Адрес: `/search/?term=…`.

| Элемент | Локатор |
|---|---|
| Плитки товаров | `.product-preview` |
| Плитка конкретного товара | `.product-preview` с потомком `a.product-preview__link[href="<путь товара>"]` |

### ProductTile: плитка товара (компонент)
`ui/components/ProductTile.ts`. Корень: `.product-preview`.

| Элемент | Поле | Локатор |
|---|---|---|
| Название (ссылка) | `titleLink` | `a.product-preview__link` (открывается в новой вкладке, `target=_blank`) |
| Цена | `price` | `.js-preview-price` (число в `data-price`) |
| ID товара | — | `[data-product-id]` → атрибут `data-product-id` |

## ProductPage: карточка товара
`ui/pages/ProductPage.ts`. Адрес: путь товара, например `/divany-i-kresla/divan-pryamoj-tulon-seryj-variant-1/`. Страница считается загруженной, когда видна кнопка «В корзину».

| Элемент | Поле | Локатор |
|---|---|---|
| Название | `name` | `.product-page__header h1.main-title` |
| Код товара | `code` | `.product-reviews__vendor-code` (значение в `data-copy-text`) |
| Цена | `price` | `#product-price` |
| Старая цена | `oldPrice` | `#product-price-old` |
| Выбранный вариант | `variant` | `.js-product-set-active-title` (первый) |
| Блок покупки | `buyBlock` | `.product-page__buy-block--main` |
| Кнопка «В корзину» | `addToCartButton` | `.product-page__buy-block--main .product-page__add-to-cart` |

Блок покупки указан явно, потому что на странице три кнопки с классом `.product-page__add-to-cart`, и без него локатор неоднозначен.

### AddedToCartModal: окно «Товар добавлен в корзину» (компонент)
`ui/components/AddedToCartModal.ts`. Корень: `#cart-modal.hystmodal--active`.

| Элемент | Поле | Локатор |
|---|---|---|
| Заголовок | `heading` | `.form__title` |
| Название товара | `productTitle` | `.cart-added-modal__product-row__product-title` |
| Цена | `price` | `.cart-added-modal__product-row__actual-price__price` |
| «Перейти в корзину» | `goToCart` | `getByRole('link', { name: 'Перейти в корзину' })` |
| «Продолжить покупки» | `continueShopping` | `.cart-close-modal` |

## CartPage: корзина
`ui/pages/CartPage.ts`. Адрес: `/cart/` (Vue-приложение). Страница считается загруженной, когда виден заголовок. Затем тест ждёт, пока отрисуется список товаров или пустое состояние.

| Элемент | Поле | Локатор |
|---|---|---|
| Заголовок | `pageTitle` | `h1.main-title` |
| Строки товаров | `items` | `.cart-page__basket-items[data-id]` |
| Строка конкретного товара | `itemById(id)` | `.cart-page__basket-items[data-id="<id>"]` |
| Пустая корзина | `emptyState` | `getByText('Корзина пустая')` |
| «Перейти к оформлению» | `checkoutButton` | `.cart-page__order-buttons .cart-page__button--order` |

### CartItem: строка корзины (компонент)
`ui/components/CartItem.ts`. Корень: `.cart-page__basket-items[data-id]`.

| Элемент | Поле | Тип | Локатор |
|---|---|---|---|
| Название | `title` | BaseElement | `.cart-page__basket-item--title` |
| Код товара | `code` | BaseElement | `.cart-page__basket-item--product-code span` (последний) |
| Стоимость строки (цена × количество) | `linePrice` | BaseElement | `.cart-page__basket-item--actual-price` |
| Количество | `quantity` | Input | `.add-product__input` |
| «−» | `decrease` | BaseElement | `.add-product__ctrl` (первый) |
| «+» | `increase` | BaseElement | `.add-product__ctrl` (последний) |
| Удалить | `remove` | BaseElement | `.cart-page__basket-item--button-delete` |

### OrderSummaryBlock: итоги заказа (компонент)
`ui/components/OrderSummaryBlock.ts`. Используется в корзине и на странице оформления. Корень: `.cart-page__order-info`.

| Элемент | Поле | Локатор |
|---|---|---|
| «Товары (N)» | `itemsCount` | `.cart-page__products-amount-text` (первый) |
| Сумма товаров | `itemsSum` | `.cart-page__result` |
| Скидка | `discount` | `.cart-page__result--discount` |
| Итого | `total` | `.cart-page__result--final` |

### ConfirmDialog: подтверждение удаления (компонент)
`ui/components/ConfirmDialog.ts`.

| Элемент | Локатор |
|---|---|
| Окно | `getByRole('dialog').filter({ hasText: 'Вы точно хотите удалить' })` |
| Кнопка «Удалить» | `getByRole('button', { name: 'Удалить', exact: true })` внутри окна |

## CheckoutPage: оформление заказа
`ui/pages/CheckoutPage.ts`. Адрес: `/cart/checkout/`. Страница считается загруженной, когда видно поле «Имя».

| Элемент | Поле / метод | Тип | Локатор |
|---|---|---|---|
| Заголовок | `heading` | BaseElement | `h1.order-page__main-title` |
| Физическое лицо | `person('individual')` | Choice | `input#person-change-1` / `label[for="person-change-1"]` |
| Юридическое лицо | `person('legal')` | Choice | `input#person-change-2` / `label[for="person-change-2"]` |
| Имя | `nameInput` | Input | `#checkout-name` |
| Телефон | `phoneInput` | Input | `#checkout-phone` (маска `+7(XXX) XXX-XX-XX`, ввод посимвольно) |
| Email | `emailInput` | Input | `#checkout-email` |
| Доставка | `delivery('delivery')` | Choice | `#shipping-1` |
| Самовывоз | `delivery('pickup')` | Choice | `#shipping-2` |
| Окно выбора пункта | `pickupDialog` | — | `getByRole('dialog').filter({ hasText: 'Самовывоз' })` |
| Пункт в окне | — | — | `.map-page__button--address` с текстом пункта |
| Адрес самовывоза | `pickupAddress` | BaseElement | `.order-page__delivery-block .order-page__blue-text.active` |
| Оплата: СБП / картой / наличными / рассрочка | `payment(...)` | Choice | `#order-payment-5` / `-3` / `-1` / `-4` |
| Сборка товара | `assemblyFor(id)` | Choice | `#mounting_<id товара>` |
| Текст согласия на обработку ПД | `consentText` | BaseElement | `.cart-page__order-buttons .accept-text` |
| «Подтвердить заказ» | `confirmButton` | BaseElement | `.cart-page__order-buttons .cart-page__button--order` |

## OrderSuccessPage: заказ оформлен
`ui/pages/OrderSuccessPage.ts`. Адрес: `/cart/success/`. **Не проверена на реальной разметке:** заказ не создаётся (`ORDER_SUBMIT=false`).

| Элемент | Локатор |
|---|---|
| Заголовок | `getByRole('heading', { name: /спасибо\|заказ.*(оформлен\|принят\|создан)/i })` |
| Номер заказа | текст `main`, из которого номер берётся регулярным выражением после слов «заказ» или «номер» |
