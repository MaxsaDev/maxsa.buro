# Вирішення проблем - ESLint + Prettier

> **🔧 Довідник по вирішенню поширених проблем**

---

## 📑 Зміст

1. [ESLint помилки](#eslint-помилки)
2. [Prettier проблеми](#prettier-проблеми)
3. [VSCode налаштування](#vscode-налаштування)
4. [Build помилки](#build-помилки)
5. [Конфлікти конфігурацій](#конфлікти-конфігурацій)

---

## ESLint помилки

### ❌ "Cannot redefine plugin"

**Помилка:**

```
ConfigError: Key "plugins": Cannot redefine plugin "jsx-a11y".
```

**Причина:**
Спроба підключити плагін, який вже включений в `eslint-config-next/core-web-vitals`.

**Рішення:**

```javascript
// ❌ НЕ РОБИТИ
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
const eslintConfig = defineConfig([
  {
    plugins: { 'jsx-a11y': jsxA11yPlugin }, // Помилка!
  },
]);

// ✅ ПРАВИЛЬНО
const eslintConfig = defineConfig([
  ...nextVitals, // Вже містить jsx-a11y
  {
    rules: {
      'jsx-a11y/alt-text': 'warn', // Просто налаштовуємо правила
    },
  },
]);
```

---

### ❌ "React must be in scope when using JSX"

**Помилка:**

```
Error: 'React' must be in scope when using JSX  react/react-in-jsx-scope
```

**Причина:**
Застаріле правило для React 17 і старіших версій.

**Рішення:**

Додайте в `eslint.config.mjs`:

```javascript
{
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off'
  }
}
```

---

### ❌ "Parsing error: Cannot find module '@typescript-eslint/parser'"

**Помилка:**

```
Parsing error: Cannot find module '@typescript-eslint/parser'
```

**Причина:**
Не встановлений TypeScript parser для ESLint.

**Рішення:**

```bash
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

---

### ❌ "Definition for rule '@typescript-eslint/no-unused-vars' was not found"

**Помилка:**

```
Definition for rule '@typescript-eslint/no-unused-vars' was not found
```

**Причина:**
Не встановлений TypeScript плагін для ESLint.

**Рішення:**

```bash
npm install --save-dev @typescript-eslint/eslint-plugin
```

---

### ❌ ESLint не знаходить файли

**Проблема:**
`npm run lint` не перевіряє файли або видає "No files matching..."

**Рішення:**

1. Перевірте `globalIgnores` в `eslint.config.mjs`:

```javascript
globalIgnores(['.next/**', 'out/**', 'build/**', 'node_modules/**']);
```

2. Видаліть застарілі `.eslintignore` файли (не використовуються в ESLint 9 Flat Config)

3. Запустіть з явним шляхом:

```bash
npx eslint "app/**/*.{js,jsx,ts,tsx}"
```

---

## Prettier проблеми

### ❌ Prettier не форматує при збереженні

**Проблема:**
VSCode не форматує файли автоматично.

**Рішення:**

1. Перевірте `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

2. Перевірте, що встановлено розширення Prettier:

```bash
code --list-extensions | grep prettier
```

Має бути: `esbenp.prettier-vscode`

3. В VSCode: `Cmd+Shift+P` → "Format Document With..." → "Configure Default Formatter..." → "Prettier"

4. Перезапустіть VSCode.

---

### ❌ Prettier не сортує Tailwind класи

**Проблема:**
Tailwind класи не сортуються автоматично.

**Рішення:**

1. Перевірте встановлення плагіну:

```bash
npm list prettier-plugin-tailwindcss
```

2. Перевірте `.prettierrc`:

```json
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

3. **Важливо**: Рядок `"plugins"` має бути в кореневому об'єкті, не в масиві!

4. Перезапустіть VSCode.

5. Тест:

```tsx
// До форматування
<div className="text-center p-4 mt-2 bg-red-500">

// Після збереження має бути
<div className="mt-2 bg-red-500 p-4 text-center">
```

---

### ❌ Prettier конфліктує з ESLint

**Проблема:**
Prettier форматує код одним способом, ESLint вимагає інший.

**Симптоми:**

- Після збереження код змінюється туди-сюди
- ESLint підсвічує код, який щойно відформатував Prettier

**Рішення:**

**НЕ використовуйте** `eslint-plugin-prettier` або `eslint-config-prettier` з Next.js 16!

Next.js вже має правильну інтеграцію. Просто переконайтеся, що:

1. Використовуєте `eslint-config-next`:

```javascript
import nextVitals from 'eslint-config-next/core-web-vitals';
```

2. Не додаєте Prettier правила в ESLint:

```javascript
// ❌ НЕ РОБИТИ
extends: ['plugin:prettier/recommended']
```

---

### ❌ ".prettierrc": Unexpected token

**Помилка:**

```
SyntaxError: .prettierrc: Unexpected token
```

**Причина:**
Неправильний JSON синтаксис (коментарі, trailing comma).

**Рішення:**

```json
// ❌ НЕПРАВИЛЬНО
{
  "semi": true,  // коментар
  "singleQuote": true,  // trailing comma
}

// ✅ ПРАВИЛЬНО
{
  "semi": true,
  "singleQuote": true
}
```

Для коментарів використовуйте `.prettierrc.js`:

```javascript
module.exports = {
  semi: true, // Можна коментувати
  singleQuote: true,
};
```

---

## VSCode налаштування

### ❌ "Cannot find module 'eslint/use-at-your-own-risk'"

**Помилка:**

```
Cannot find module 'eslint/use-at-your-own-risk'
```

**Причина:**
Застаріла версія ESLint розширення в VSCode.

**Рішення:**

1. Оновіть розширення ESLint:
   - VSCode → Extensions → ESLint → Update

2. Або встановіть останню версію:

```bash
code --install-extension dbaeumer.vscode-eslint
```

3. Перезапустіть VSCode.

---

### ❌ VSCode не підхоплює налаштування з .vscode/settings.json

**Проблема:**
Глобальні налаштування VSCode перекривають проектні.

**Рішення:**

1. Відкрийте налаштування: `Cmd+,`

2. Переключіться на "Workspace" (не "User")

3. Або додайте в глобальні налаштування:

```json
{
  "editor.formatOnSaveMode": "file"
}
```

---

### ❌ Tailwind IntelliSense не працює

**Проблема:**
Немає автодоповнення для Tailwind класів.

**Рішення:**

1. Встановіть розширення:

```bash
code --install-extension bradlc.vscode-tailwindcss
```

2. Перевірте наявність `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: {} },
  plugins: [],
};

export default config;
```

3. Перезапустіть VSCode.

---

## Build помилки

### ❌ Failed to fetch fonts from Google Fonts

**Помилка:**

```
next/font: error:
Failed to fetch `Geist` from Google Fonts.
```

**Причина:**
Немає інтернет-з'єднання під час build.

**Рішення:**

1. Перевірте інтернет-з'єднання

2. Для корпоративних проксі:

```bash
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

3. Або закоментуйте шрифти в `app/layout.tsx`:

```typescript
// import { Geist, Geist_Mono } from 'next/font/google'

// const geist = Geist({ ... })
```

---

### ❌ Type error: Cannot find module 'tailwindcss'

**Помилка:**

```
Type error: Cannot find module 'tailwindcss' or its corresponding type declarations.
```

**Причина:**
Відсутній `tailwind.config.ts` або неправильний import.

**Рішення:**

Створіть `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: {} },
  plugins: [],
};

export default config;
```

---

### ❌ Module not found: Can't resolve '@tailwindcss/postcss'

**Помилка:**

```
Module not found: Can't resolve '@tailwindcss/postcss'
```

**Причина:**
Не встановлений Tailwind PostCSS плагін.

**Рішення:**

```bash
npm install --save-dev @tailwindcss/postcss tailwindcss
```

Перевірте `postcss.config.mjs`:

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

---

## Конфлікти конфігурацій

### ❌ ESLint та Prettier використовують різні налаштування

**Проблема:**
ESLint вимагає крапку з комою, Prettier її видаляє.

**Рішення:**

Синхронізуйте налаштування:

`.prettierrc`:

```json
{
  "semi": true // або false
}
```

Не додавайте правило `semi` в ESLint - нехай Prettier керує форматуванням.

---

### ❌ EditorConfig конфліктує з Prettier

**Проблема:**
`.editorconfig` встановлює відступи 4, Prettier - 2.

**Рішення:**

Синхронізуйте файли:

`.editorconfig`:

```ini
[*]
indent_size = 2
```

`.prettierrc`:

```json
{
  "tabWidth": 2
}
```

**Пріоритет**: Prettier > EditorConfig (якщо увімкнено formatOnSave з Prettier)

---

### ❌ Множинні конфігураційні файли

**Проблема:**
В проекті є і `.eslintrc.js` і `eslint.config.mjs`.

**Рішення:**

ESLint 9 використовує **тільки** `eslint.config.mjs` (Flat Config).

Видаліть старі файли:

```bash
rm .eslintrc.js .eslintrc.json .eslintrc.yml
```

---

## Команди діагностики

### Перевірка встановлених пакетів

```bash
npm list prettier prettier-plugin-tailwindcss eslint @typescript-eslint/parser
```

### Перевірка конфігурації ESLint

```bash
npx eslint --print-config app/page.tsx
```

### Перевірка конфігурації Prettier

```bash
npx prettier --find-config-path app/page.tsx
npx prettier --config .prettierrc --check app/page.tsx
```

### Видалення кешу

```bash
# ESLint кеш
rm -rf .eslintcache

# Next.js кеш
rm -rf .next

# Node modules (крайній випадок)
rm -rf node_modules package-lock.json
npm install
```

### Перевірка TypeScript

```bash
npx tsc --noEmit --listFiles | grep node_modules/@types
```

---

## Контрольний чеклист

При виникненні проблем перевірте:

- [ ] Версія Node.js >= 18.17
- [ ] Версія Next.js = 16.0.0
- [ ] ESLint версії 9.x встановлений
- [ ] Prettier версії 3.x встановлений
- [ ] Немає старих `.eslintrc.*` файлів
- [ ] `.prettierrc` містить валідний JSON
- [ ] `eslint.config.mjs` використовує `defineConfig`
- [ ] VSCode розширення ESLint і Prettier оновлені
- [ ] VSCode перезапущено після змін
- [ ] Очищено кеш (`.next`, `node_modules/.cache`)

---

## Отримання допомоги

### Логи для дебагу

```bash
# ESLint debug
DEBUG=eslint:* npm run lint

# Prettier debug
prettier --loglevel debug --write app/page.tsx
```

### Корисні команди

```bash
# Версії пакетів
npm list --depth=0

# Конфлікти залежностей
npm ls eslint
npm ls prettier

# Перевірка package.json
npm doctor
```

---

## Додаткові ресурси

- [ESLint Troubleshooting](https://eslint.org/docs/latest/use/troubleshooting)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [Next.js ESLint Configuration](https://nextjs.org/docs/app/building-your-application/configuring/eslint)
- [VSCode ESLint Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

---

**Якщо проблема не вирішена, створіть issue з повним описом помилки та конфігураційними файлами.**
