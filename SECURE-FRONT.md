# SECURE-FRONT — безопасность, аутентификация и авторизация на фронтенде

Документ описывает меры кибербезопасности и механизмы аутентификации/авторизации, реализованные во фронтенд-приложении `apps/web` (React 19 + Vite, архитектура FSD).

> Важно: все проверки на фронтенде — это UX и первый рубеж защиты. Источник истины — бэкенд (`apps/server`): именно он проверяет JWT, роли, капчу и rate-limit.

---

## Содержание

1. [Хранение токенов и сессии](#1-хранение-токенов-и-сессии)
2. [HTTP-клиент: axios-интерцепторы и auto-refresh](#2-http-клиент-axios-интерцепторы-и-auto-refresh)
3. [Восстановление сессии при загрузке приложения](#3-восстановление-сессии-при-загрузке-приложения)
4. [Google reCAPTCHA v3](#4-google-recaptcha-v3)
5. [Вход, регистрация, восстановление пароля](#5-вход-регистрация-восстановление-пароля)
6. [Двухфакторная аутентификация (2FA, TOTP)](#6-двухфакторная-аутентификация-2fa-totp)
7. [OAuth через Google](#7-oauth-через-google)
8. [Выход из аккаунта и очистка клиентских данных](#8-выход-из-аккаунта-и-очистка-клиентских-данных)
9. [Управление аккаунтом (смена пароля, удаление)](#9-управление-аккаунтом-смена-пароля-удаление)
10. [Авторизация: защищённые маршруты и роли (RBAC)](#10-авторизация-защищённые-маршруты-и-роли-rbac)
11. [Валидация данных (Zod)](#11-валидация-данных-zod)
12. [Защита от XSS и небезопасных ссылок](#12-защита-от-xss-и-небезопасных-ссылок)
13. [Загрузка файлов](#13-загрузка-файлов)
14. [Статический анализ безопасности (ESLint)](#14-статический-анализ-безопасности-eslint)
15. [SEO-закрытие служебных страниц](#15-seo-закрытие-служебных-страниц)
16. [Обработка ошибок и мониторинг (Sentry)](#16-обработка-ошибок-и-мониторинг-sentry)
17. [Переменные окружения и секреты](#17-переменные-окружения-и-секреты)
18. [Тесты безопасности и auth-флоу](#18-тесты-безопасности-и-auth-флоу)
19. [Известные ограничения и рекомендации](#19-известные-ограничения-и-рекомендации)

---

## 1. Хранение токенов и сессии

Файл: `apps/web/src/features/auth/model/useAuthStore.ts` (Zustand + `persist` + `devtools`).

| Данные | Где хранится | Почему |
|---|---|---|
| **Access token** (JWT, короткоживущий) | Только в памяти (Zustand-стор) | Не попадает в `localStorage` → его нельзя украсть XSS-скриптом из хранилища, он исчезает при закрытии вкладки |
| **Refresh token** | `httpOnly`-кука, выставляемая бэкендом (`secure` в production, `sameSite: "lax"`, `path: "/api/identity/auth"`) | JavaScript не имеет к ней доступа; кука отправляется только на auth-эндпоинты |
| **Флаг `isAuth`** | `localStorage` (ключ `auth-storage`) | Не секрет — лишь подсказка «пользователь был залогинен», чтобы при перезагрузке страницы попытаться тихо восстановить сессию |
| `tempUserId`, `isCheckingAuth` | Только в памяти | Временные данные (2FA, загрузка), исключены из persist |

- Через `partialize` в `persist` сохраняется **только** `isAuth`; строка `accessToken` намеренно закомментирована.
- `setAuth(token)` выставляет токен, `isAuth = !!token` и сбрасывает `tempUserId`.
- `clearAuth()` сбрасывает всё в дефолт.
- Опция «Запомнить меня» (`rememberMe`) передаётся на сервер: при `true` refresh-кука живёт 7 дней, при `false` — становится сессионной (удаляется при закрытии браузера).

## 2. HTTP-клиент: axios-интерцепторы и auto-refresh

Файл: `apps/web/src/shared/api/api.ts`.

### 2.1. Экземпляр `$api`
- `axios.create({ baseURL: \`${VITE_API_URL}/api/\`, withCredentials: true })` — кука с refresh-токеном автоматически отправляется на бэкенд.
- Все запросы приложения идут через единый `$api` (`API_URL` используется только для статики, документов и OAuth-редиректа).

### 2.2. Request-интерцептор
- Перед каждым запросом берёт `accessToken` из `useAuthStore.getState()` и подставляет заголовок `Authorization: Bearer <token>`.

### 2.3. Response-интерцептор: автоматическое обновление токена (`axios-auth-refresh`)
- Библиотека `axios-auth-refresh` (`createAuthRefreshInterceptor($api, refreshAuthLogic, { statusCodes: [401] })`) перехватывает ответы **401**.
- **Очередь запросов**: если несколько запросов одновременно получили 401, библиотека ставит их в очередь и выполняет **один** refresh-запрос, после чего повторяет все упавшие запросы с новым токеном (защита от «шторма» refresh-запросов и гонок).
- Refresh выполняется **чистым `axios`**, а не `$api`, чтобы не прикреплять просроченный access-токен и не уйти в рекурсию интерцепторов.
- Новый токен сохраняется в стор (`setAuth`) и подставляется в заголовок исходного упавшего запроса.

### 2.4. Защиты внутри `refreshAuthLogic`
1. **Защита от бесконечного цикла**: если 401 вернул сам `/identity/auth/refresh` — повторного обновления нет.
2. **Нет токена — нечего обновлять**: 401 от `/identity/profile/me` при пустом токене (первая загрузка гостем) не запускает refresh.
3. **Публичные формы**: 401 на `/identity/auth/login`, `/reset-password`, `/forgot-password` означает неверные данные, а не протухший токен — refresh не запускается.
4. **Обработка провала refresh**:
   - сервер ответил ошибкой (400/401/403/500) → сессия недействительна: `clearAuth()` + удаление `Authorization` из `$api.defaults.headers.common`, чтобы прервать зависшие запросы очереди;
   - ответа нет (сервер оффлайн / нет сети) → пользователь **не** разлогинивается, показывается toast «Сервер бэкенда недоступен».

## 3. Восстановление сессии при загрузке приложения

Файл: `apps/web/src/app/App.tsx`.

- Если по `localStorage` `isAuth === true`, но в памяти нет `accessToken` (страница перезагружена), приложение делает «тихий» `POST /identity/auth/refresh` (с кукой).
  - успех → `setAuth(newAccessToken)`;
  - ошибка (кука просрочена/отозвана) → `clearAuth()`.
- Пока идёт проверка, показывается `PageLoader` (`isCheckingAuth`) — защищённые страницы не рендерятся и не мигают до выяснения статуса.
- Запросы, требующие авторизации (`useProfile`, `useCart`, `useFavorites`), включаются только при `enabled: isAuth && !!accessToken`, поэтому от гостя они не уходят. Для профиля `retry: false`, чтобы не долбить сервер при отсутствии куки.

## 4. Google reCAPTCHA v3

Пакет: `react-google-recaptcha-v3`.

- **Провайдер**: `GoogleReCaptchaProvider` оборачивает всё приложение в `App.tsx`; публичный ключ — `VITE_GOOGLE_RECAPTCHA_SITE_KEY` (секретный ключ хранится только на бэкенде).
- **Невидимая капча**: v3 не требует от пользователя кликов — Google оценивает поведение и выдаёт токен со score.
- **Хук `useAuthSubmit`** (`apps/web/src/features/auth/lib/useAuthSubmit.ts`) — единая обёртка для всех auth-форм:
  1. если скрипт капчи ещё не загрузился (`!executeRecaptcha`) — отправка **блокируется** с toast «Защита ReCaptcha еще не готова»;
  2. генерирует токен `executeRecaptcha(action)` с именем действия;
  3. добавляет `captchaToken` в тело запроса;
  4. обрабатывает успех (toast, `onSuccess`, редирект) и ошибку (toast с сообщением сервера + проброс ошибки в `formState`).
- **Где используется** (действия для аналитики Google):

| Форма | action | Эндпоинт |
|---|---|---|
| Вход (`LoginForm`) | `login` | `POST /identity/auth/login` |
| Регистрация (`RegisterForm`) | `register` | `POST /identity/auth/register` |
| Забыли пароль (`ForgotPasswordPage`) | `forgot_password` | `POST /identity/auth/forgot-password` |
| Сброс пароля (`ResetPasswordPage`) | `reset_password` | `POST /identity/auth/reset-password?token=…` |
| Обращение в поддержку (`SupportForm`) | `support_form` | `POST /support/create` (токен кладётся в `FormData`) |

- **Серверная часть** (для полноты картины): `recaptchaService.verify` на бэкенде проверяет токен в Google **до** обращения к БД; запрос отклоняется (403), если `success === false` или `score < 0.5`.
- В формах в `defaultValues` стоит `captchaToken: "1"` — это заглушка, чтобы Zod-схема (`captchaToken: z.string().min(1)`) пропустила форму на клиенте; реальный токен подменяется в `useAuthSubmit` / `SupportForm` прямо перед отправкой.

## 5. Вход, регистрация, восстановление пароля

- **Регистрация** (`RegisterForm`): строгая политика пароля (см. §11), подтверждение пароля, запрет пароля, содержащего имя, обязательное согласие с условиями и политикой конфиденциальности (`acceptTerms`). После регистрации требуется **активация через email** — по ссылке бэкенд редиректит на `/auth?activated=true`, фронт показывает уведомление.
- **Вход** (`LoginForm`): email + пароль + reCAPTCHA + «Запомнить меня». Сообщения об ошибке длины пароля одинаковые («Некорректный email или пароль») — не раскрывают, что именно неверно.
- **Забыли пароль** (`ForgotPasswordPage`): нейтральный ответ «Если аккаунт существует, письмо со ссылкой отправлено!» — защита от перебора (enumeration) существующих email.
- **Сброс пароля** (`ResetPasswordPage`): одноразовый токен берётся из `?token=` в URL; без токена форма не показывается.
- `PasswordField` — поле пароля с переключателем видимости (`type="password"` ↔ `"text"`).

## 6. Двухфакторная аутентификация (2FA, TOTP)

Файлы: `features/auth/ui/TwoFactorAuthCard`, `TwoFactorModal`, `TwoFactorVerifyForm`, `features/auth/lib/useProfileActions.ts`.

- **Включение** (в профиле, блок для администраторов):
  1. `POST /identity/auth/2fa/setup` → сервер возвращает QR-код (`qrCodeUrl`);
  2. пользователь сканирует его в Google Authenticator / Aegis;
  3. вводит 6-значный код (в поле принимаются только цифры, `maxLength=6`) → `POST /identity/auth/2fa/enable`;
  4. профиль инвалидируется, флаг `is2FAEnabled` блокирует повторное включение.
- **Вход с 2FA**:
  1. `POST /identity/auth/login` возвращает `requires2FA: true` и `userId` **вместо** access-токена;
  2. `userId` сохраняется во временное поле `tempUserId` (не персистится);
  3. показывается `TwoFactorVerifyForm` (валидация `Verify2FASchema` — только цифры);
  4. `POST /identity/auth/2fa/verify` → только после успешной проверки кода выдаётся access-токен (`setAuth`), `tempUserId` очищается.

## 7. OAuth через Google

Файлы: `features/auth/ui/GoogleAuthButton`, `features/auth/ui/AuthCard/AuthCard.tsx`.

- Кнопка «Войти с Google» делает полный переход `window.location.href = ${API_URL}/api/identity/auth/google` — весь OAuth-флоу (client secret, обмен `code`) выполняется на бэкенде.
- Бэкенд выставляет refresh-куку и редиректит на `/auth?token=<accessToken>`.
- `AuthCard` забирает токен из URL, сохраняет в стор, перезапрашивает профиль и делает `navigate("/profile", { replace: true })` — `replace` убирает URL с токеном из истории навигации SPA.
- `useRef` (`processingToken`) гарантирует однократную обработку токена.

## 8. Выход из аккаунта и очистка клиентских данных

Файл: `features/auth/model/useProfile.ts`.

- `logout()` → `POST /identity/auth/logout` (сервер удаляет refresh-токен из БД).
- `logoutAll()` → `POST /identity/auth/logout-all` — выход **со всех устройств** (инвалидация всех сессий пользователя).
- В `finally` (даже если сервер недоступен) выполняется `localLogoutCleanup()`:
  - `clearAuth()` — очистка токена и флага;
  - `queryClient.clear()` — полная очистка кэша React Query (данные одного пользователя не «утекают» к следующему на этом же устройстве);
  - `clearTrading()` / `resetOrders()` — очистка корзины и заказов;
  - удаление `Authorization` из дефолтных заголовков axios.

## 9. Управление аккаунтом (смена пароля, удаление)

- **Смена пароля**: требуется текущий пароль (`oldPassword`) + новый по той же политике сложности; после успеха поля формы очищаются.
- **Удаление аккаунта** (`DeleteAccountModal`): требует повторного ввода пароля (`DELETE /identity/auth/delete-account`), после чего вызывается полный `logout()` с очисткой всех клиентских данных.
- **Аватар**: загрузка через `FormData` на `/identity/profile/avatar`, `accept="image/*"`.

## 10. Авторизация: защищённые маршруты и роли (RBAC)

Файлы: `app/providers/router/ui/*`, `app/providers/router/config/router.tsx`.

### 10.1. Route guards
| Guard | Логика | Маршруты |
|---|---|---|
| `GuestRoute` | Авторизованного пользователя уводит на `/profile` | `/auth`, `/forgot-password`, `/reset-password` |
| `ProtectedRoute` | Неавторизованного уводит на `/auth` (`replace`) | `/profile` |
| `AdminRoute` | Пускает только `isAuth` + роль из `ADMIN`, `SUPERADMIN`, `MANAGER`, `CONTENT_EDITOR`; иначе — на `/` | `/admin/*` |

- Админ-панель (`AdminRoute`, `AdminLayout` и все админ-страницы) подгружается **лениво** (`lazy`), поэтому код админки не скачивается обычными пользователями вместе с основным бандлом.
- Для гостей страницы «Мои заказы» и кнопки «В корзину» / «В избранное» проверяют `isAuth` и показывают сообщение/уведомление вместо запроса.

### 10.2. Ролевая модель (UI-уровень)
Роли: `USER`, `CONTENT_EDITOR`, `MANAGER`, `ADMIN`, `SUPERADMIN`.

- **Меню админки** (`widgets/AdminLayout/models/items.ts`) фильтруется по `roles` для каждого пункта:
  - Бренды, Склады, Заказы, Тикеты, Скидки, Отчёты — `MANAGER`, `ADMIN`, `SUPERADMIN`;
  - Техническое обслуживание — `ADMIN`, `SUPERADMIN`;
  - Новости — `CONTENT_EDITOR`, `ADMIN`, `SUPERADMIN`;
  - Пользователи — только `SUPERADMIN`;
  - Мотоциклы — всем ролям админки.
- **Ограничения действий внутри страниц**:
  - Заказы: смена статуса заблокирована для `CONTENT_EDITOR`, `USER`, `MANAGER`;
  - Мотоциклы: создание/редактирование/удаление/переход к складу — только `MANAGER`, `ADMIN`, `SUPERADMIN`;
  - Скидки: генерация промокодов и скидок — только `ADMIN`, `SUPERADMIN`;
  - Пользователи: администратор не может изменить **свою** роль и удалить **сам себя** (`isSelf`).
- Ссылка на админку в шапке и мобильном меню показывается только при `isAuth && isAdmin`.

## 11. Валидация данных (Zod)

Пакет `@repo/validation` (`packages/validation`) — **общие схемы для фронта и бэка**, подключаются в формы через `react-hook-form` + `@hookform/resolvers/zod`.

- **Политика пароля**: 8–32 символа, минимум одна заглавная, одна строчная буква, одна цифра и спецсимвол; пароль не должен содержать имя пользователя; подтверждение должно совпадать.
- Имя: 3–20 символов, допустимые символы по regex; email — по regex.
- 2FA-код: только цифры.
- Дата рождения не может быть в будущем.
- Токен сброса пароля на бэкенде ограничен 1–64 символами.
- Ошибки валидации показываются через `handleFormError` / toast с фиксированным `id` — защита от спама уведомлениями.
- Отправка невалидной формы на сервер невозможна — запрос не уходит.

## 12. Защита от XSS и небезопасных ссылок

- В проекте **не используется** `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` — весь пользовательский контент (тикеты, отзывы, новости) рендерится через JSX с автоматическим экранированием React.
- Правила `eslint-plugin-no-unsanitized` запрещают небезопасную запись в DOM на этапе линтинга.
- Внешние ссылки с `target="_blank"` (вложения тикетов, соцсети, PDF-мануал) снабжены `rel="noopener noreferrer"` / `rel="noreferrer"` — защита от reverse tabnabbing.
- Access-токен не хранится в `localStorage`, поэтому даже при XSS его нельзя вытащить из хранилища; refresh-токен — в `httpOnly`-куке.

## 13. Загрузка файлов

- Аватар и фото отзывов: `accept="image/*"`.
- Вложения поддержки (`FileUpload`): белый список расширений `accept=".jpg,.png,.pdf,.doc,.docx,.txt"`; превью строится только для `image/*`.
- Временные `blob:`-URL освобождаются (`URL.revokeObjectURL`) при размонтировании.
- Окончательная проверка типа/размера выполняется на бэкенде (multer).

## 14. Статический анализ безопасности (ESLint)

Файл: `apps/web/eslint.config.js`.

- `eslint-plugin-sonarjs` (`recommended`) — поиск логических уязвимостей и code smells (сложность, дубли, небезопасные паттерны); `sonarjs/pseudo-random` переведён в `warn`.
- `eslint-plugin-no-unsanitized` (`recommended-legacy`) — запрет `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` и т.п. без санитизации.
- `typescript-eslint` (`recommended`) — `no-explicit-any` в режиме `warn`.
- Строгая типизация TypeScript + `npm run type-check`.

## 15. SEO-закрытие служебных страниц

С помощью `react-helmet-async` на страницах `/auth`, `/forgot-password`, `/reset-password` и во всей админ-панели (`AdminLayout`) выставлен `<meta name="robots" content="noindex, nofollow" />` — служебные страницы не индексируются поисковиками.

## 16. Обработка ошибок и мониторинг (Sentry)

- `@sentry/react` инициализируется в `main.tsx`; в режиме разработки отключён (`enabled: !import.meta.env.DEV`), `tracesSampleRate` 0.2 в production.
- Глобальный `ErrorBoundary` (`react-error-boundary`) логирует ошибки в Sentry и при сбросе очищает кэш React Query перед редиректом на главную.
- Сетевые/бизнес-ошибки (загрузка аватара, 2FA, тикеты) отправляются через `Sentry.captureException`.
- Пользователю показываются только обобщённые сообщения сервера (`response.data.message`) или нейтральный текст — стектрейсы в UI не выводятся.

## 17. Переменные окружения и секреты

- На фронте используются только **публичные** переменные `VITE_*`: `VITE_API_URL`, `VITE_SITE_URL`, `VITE_GOOGLE_RECAPTCHA_SITE_KEY` (публичный ключ), `VITE_SENTRY_DSN`, `VITE_YANDEX_METRICA_ID`.
- Секретный ключ reCAPTCHA, ключи JWT, OAuth client secret хранятся **только** на бэкенде.
- `.env` и `.env.*` в `.gitignore`; в репозитории лежит только `apps/web/.env.example` с заглушками.

## 18. Тесты безопасности и auth-флоу

**Unit / Integration (Vitest + RTL):**
- `app/providers/router/__tests__/ProtectedRoute.test.tsx` — пропуск авторизованного пользователя и редирект гостя на `/auth`.
- `features/auth/lib/__tests__/useAuthSubmit.test.ts` — успех (toast + редирект) и ошибка сервера.
- `features/auth/lib/__tests__/useProfileActions.test.ts` — действия профиля (обновление, аватар, пароль, 2FA).
- `features/auth/ui/AuthCard/__tests__/AuthCard.test.tsx` — редирект на бэкенд Google OAuth.
- `shared/ui/PasswordField/__tests__` — переключение видимости пароля.

**E2E (Cypress):**
- `cypress/e2e/auth.cy.ts` — вход, неверные данные, редактирование профиля, аватар, смена пароля, logout, logout-all, восстановление пароля, вход с 2FA.
- `cypress/e2e/registration.cy.ts` — регистрация, блокировка входа без подтверждения email, дубликат аккаунта.
- `cypress/e2e/activation.cy.ts` — уведомление после активации.

---

## 19. Известные ограничения и рекомендации

Ниже — замечания, найденные при анализе кода; они не являются уязвимостями «из коробки» (бэкенд всё равно проверяет права), но их стоит учесть.

1. **Маршруты без `ProtectedRoute`**: `/checkout`, `/orders/my`, `/profile/favorites`, `/support/tickets` не обёрнуты в guard (часть страниц проверяет `isAuth` внутри). Рекомендуется обернуть их в `ProtectedRoute` для единообразия.
2. **Права на уровне маршрутов админки**: `AdminRoute` проверяет только «любая админская роль», а ограничения по конкретным ролям (например, `/admin/users` только для `SUPERADMIN`) реализованы фильтрацией меню. Прямой переход по URL откроет страницу (данные всё равно не отдаст бэкенд). Можно добавить проп `allowedRoles` в guard.
3. **Access-токен в URL после Google OAuth** (`/auth?token=…`): токен может попасть в историю браузера, логи прокси и `Referer`. Альтернатива — после OAuth выставлять только refresh-куку, а фронт получает access-токен через `POST /identity/auth/refresh`.
4. **Ручное переключение капчи для тестов**: в `useAuthSubmit` есть комментарии «Вернуть в проде / отключить в тесте». Лучше управлять этим через переменную окружения (`VITE_DISABLE_RECAPTCHA`) только для тестового окружения, чтобы исключить случайный деплой без капчи.
5. **HTTP-заголовки безопасности**: в `deploy/nginx/nginx.conf` нет `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`. Рекомендуется добавить (с учётом доменов Google reCAPTCHA, Яндекс Метрики, Sentry). Также стоит вынести inline-скрипт Метрики из `index.html`, чтобы CSP не требовал `'unsafe-inline'`.
6. **Sentry**: стоит добавить `beforeSend` для вырезания чувствительных данных (токены в URL, email, тело форм).
7. **`rollup-plugin-visualizer` с `open: true`** в `vite.config.ts` запускается при каждой production-сборке — лучше включать только по флагу (`ANALYZE=true`), чтобы отчёт со структурой бандла не попадал в артефакты сборки.
8. **Ссылки на `/terms` и `/privacy`** в `RegisterForm` с `target="_blank"` без `rel="noopener noreferrer"` — риск минимален (тот же origin), но для единообразия стоит добавить.
