# Конфігурація ESLint та Prettier для Next.js 16

> **Версія документації**: 1.0.0
> **Дата створення**: 26 жовтня 2025
> **Проект**: maxsa.dev
> **Next.js**: 16.0.0 | **React**: 19.2.0 | **TypeScript**: 5.x

---

## 📋 Зміст

1. [Огляд](#огляд)
2. [Технологічний стек](#технологічний-стек)
3. [Встановлені пакети](#встановлені-пакети)
4. [Конфігураційні файли](#конфігураційні-файли)
5. [Покрокова інструкція](#покрокова-інструкція)
6. [Особливості Next.js 16](#особливості-nextjs-16)
7. [NPM скрипти](#npm-скрипти)
8. [Перевірка роботи](#перевірка-роботи)
9. [Вирішення проблем](#вирішення-проблем)
10. [VSCode налаштування](#vscode-налаштування)

---

## 🎯 Огляд

### Мета конфігурації

Створення сучасної, оптимізованої системи лінтингу та форматування коду для проекту на Next.js 16 з React 19, яка забезпечує:

- ✅ Автоматичне форматування коду згідно з встановленими правилами
- ✅ Перевірку якості коду та виявлення потенційних помилок
- ✅ Підтримку TypeScript з суворою типізацією
- ✅ Перевірку accessibility (доступності)
- ✅ Автоматичну сортування Tailwind CSS класів
- ✅ Інтеграцію з VSCode для роботи при збереженні файлів

### Ключові рішення

1. **ESLint 9** з новим Flat Config API (`defineConfig`)
2. **Prettier 3.6** з плагіном для Tailwind CSS 4
3. **Відмова від eslint-plugin-tailwindcss** через несумісність з Tailwind 4
4. **Налаштування для React 19** (без обов'язкового імпорту React)
5. **Строга типізація TypeScript** без `any`

---

## 🛠 Технологічний стек

### Основні фреймворки

| Технологія   | Версія | Призначення                  |
| ------------ | ------ | ---------------------------- |
| Next.js      | 16.0.0 | Фреймворк для React додатків |
| React        | 19.2.0 | Бібліотека для UI            |
| TypeScript   | ^5     | Типізація JavaScript         |
| Tailwind CSS | ^4     | CSS фреймворк                |

### Інструменти якості коду

| Інструмент | Версія | Призначення           |
| ---------- | ------ | --------------------- |
| ESLint     | ^9     | Статичний аналіз коду |
| Prettier   | ^3.6.2 | Форматування коду     |

---

## 📦 Встановлені пакети

### DevDependencies

```json
{
  "@typescript-eslint/eslint-plugin": "^8.46.2",
  "@typescript-eslint/parser": "^8.46.2",
  "eslint": "^9",
  "eslint-config-next": "16.0.0",
  "eslint-plugin-jsx-a11y": "^6.10.2",
  "eslint-plugin-react": "^7.37.5",
  "eslint-plugin-react-hooks": "^7.0.1",
  "prettier": "^3.6.2",
  "prettier-plugin-tailwindcss": "^0.7.1"
}
```

### Опис пакетів

#### ESLint плагіни

- **@typescript-eslint/eslint-plugin** + **@typescript-eslint/parser**
  - Підтримка TypeScript в ESLint
  - Перевірка типів, неіспользуваних змінних, правил іменування
- **eslint-config-next**
  - Офіційна конфігурація ESLint від Next.js
  - Включає оптимізовані правила для Next.js, React, accessibility
- **eslint-plugin-react**
  - Правила для React компонентів
  - Перевірка JSX синтаксису
- **eslint-plugin-react-hooks**
  - Перевірка правил хуків (Rules of Hooks)
  - Контроль залежностей в useEffect, useMemo, useCallback
- **eslint-plugin-jsx-a11y**
  - Перевірка accessibility (доступності)
  - Контроль ARIA атрибутів, alt текстів, ролей

#### Prettier плагіни

- **prettier**
  - Основний форматтер коду
- **prettier-plugin-tailwindcss**
  - Автоматична сортування Tailwind CSS класів
  - Сумісний з Tailwind CSS 4

---

## 📁 Конфігураційні файли

### 1. `.prettierrc`

**Призначення**: Налаштування форматування коду

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSameLine": false,
  "jsxSingleQuote": false,
  "proseWrap": "preserve",
  "quoteProps": "as-needed",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**Пояснення налаштувань**:

- `semi: true` - використовувати крапку з комою
- `trailingComma: "es5"` - trailing comma де дозволено в ES5 (об'єкти, масиви)
- `singleQuote: true` - одинарні лапки замість подвійних
- `tabWidth: 2` - відступ 2 пробіли
- `printWidth: 100` - максимальна довжина рядка 100 символів
- `arrowParens: "always"` - завжди використовувати дужки в arrow functions
- `endOfLine: "lf"` - Unix-style переводи рядків
- `plugins: ["prettier-plugin-tailwindcss"]` - **критично важливо** для сортування Tailwind класів

#### 🎯 Чому саме `semi: true` та `arrowParens: "always"`?

**Обґрунтування вибору `semi: true`:**

1. **Сумісність з екосистемою**
   - Більшість документації, гайдів, прикладів коду та статей використовують крапки з комою
   - Менше конфліктів при копіюванні коду з офіційної документації Next.js, React, TypeScript
   - Стандартне форматування для більшості корпоративних проектів

2. **Уникнення ASI проблем**
   - Без крапок з комою Prettier іноді додає "лідируючу" крапку з комою: `;[1,2,3].forEach(...)`
   - Це синтаксично коректно, але виглядає незвично і може заплутати розробників
   - З `semi: true` код завжди виглядає передбачувано

3. **TypeScript best practices**
   - Офіційний TypeScript handbook використовує крапки з комою
   - Microsoft та більшість великих проектів дотримуються цього стилю

4. **Менше ментального навантаження**
   - Не потрібно думати, коли потрібна крапка з комою, а коли ні
   - Єдиний стиль для всього проекту

**Обґрунтування вибору `arrowParens: "always"`:**

1. **Передбачувана поведінка з TypeScript**
   - При додаванні типів до параметрів дужки обов'язкові: `(x: number) => x * 2`
   - З `always` немає різниці між `(x) => x` та `(x: number) => x`
   - Менше git diff при додаванні типізації

2. **Сумісність з дженериками**
   - Дженерики в arrow functions вимагають дужок: `<T,>(x: T) => x`
   - Уніфікований стиль спрощує читання коду

3. **Візуальна консистентність**
   - Всі arrow functions виглядають однаково, незалежно від кількості параметрів
   - Легше розпізнати функцію при скануванні коду

4. **Менше змін в історії git**
   - При додаванні другого параметра не змінюється форматування першого рядка
   - Чистіший git blame та історія змін

**Приклади:**

```typescript
// ❌ З arrowParens: "avoid" - непередбачувано
const simple = (x) => x * 2; // без дужок
const typed = (x: number) => x * 2; // з дужками (обов'язково)
const multi = (x, y) => x + y; // з дужками (обов'язково)

// ✅ З arrowParens: "always" - завжди однаково
const simple = (x) => x * 2; // з дужками
const typed = (x: number) => x * 2; // з дужками
const multi = (x, y) => x + y; // з дужками
```

**Альтернатива:**

Якщо ваша команда віддає перевагу мінімалістичному стилю:

- `semi: false` - стиль без крапок з комою (як в ESLint/Prettier defaults)
- `arrowParens: "avoid"` - без дужок для одного параметра

Головне - **консистентність** в рамках проекту та команди.

---

### 2. `.prettierignore`

**Призначення**: Виключення файлів з форматування

```
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Next.js
.next
out
dist
build

# Production
.vercel

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Local env files
.env
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Package manager
package-lock.json
yarn.lock
pnpm-lock.yaml

# IDE and temp files
/temp
.idea
.vscode
.cursor
.cursorrules
```

**Важливо**: Виключаємо папки IDE та тимчасові файли для швидкості роботи.

---

### 3. `eslint.config.mjs`

**Призначення**: Конфігурація ESLint для Next.js 16 з React 19

```javascript
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Глобальні ігнори за замовчуванням
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'node_modules/**']),
  // Додаткові правила (next/core-web-vitals вже включає React, React Hooks та jsx-a11y)
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React 19 не потребує імпорту React
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // TypeScript правила
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // React hooks правила (посилені)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Accessibility правила (посилені)
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
    },
  },
]);

export default eslintConfig;
```

**Ключові особливості**:

1. **Новий Flat Config API**
   - Використовується `defineConfig` з `eslint/config`
   - Це нова архітектура ESLint 9, яка замінює `.eslintrc`

2. **Відключені застарілі правила**
   - `react/react-in-jsx-scope: 'off'` - React 19 не потребує `import React`
   - `react/jsx-uses-react: 'off'` - також не потрібно

3. **TypeScript правила**
   - Дозволяємо `_` префікс для неіспользуваних змінних
   - `any` виводиться як warning, а не error

4. **Чому не використовуємо окремі плагіни**
   - `eslint-config-next/core-web-vitals` вже включає:
     - `eslint-plugin-react`
     - `eslint-plugin-react-hooks`
     - `eslint-plugin-jsx-a11y`
   - Повторне підключення викликає конфлікт "Cannot redefine plugin"

---

### 4. `tailwind.config.ts`

**Призначення**: Конфігурація Tailwind CSS 4

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

**Важливо**:

- `content` містить всі можливі шляхи (App Router, Pages Router, окремі компоненти)
- Без цього файлу Tailwind CSS не працюватиме коректно

---

### 5. `.editorconfig`

**Призначення**: Універсальні налаштування редактора (для всіх IDE)

```ini
# EditorConfig is awesome: https://EditorConfig.org

root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

**Переваги**:

- Працює в усіх сучасних редакторах (VSCode, WebStorm, Vim, Sublime)
- Забезпечує єдиний стиль відступів

---

### 6. `.vscode/settings.json`

**Призначення**: Налаштування для Visual Studio Code

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

**Пояснення**:

- `formatOnSave: true` - автоформатування при збереженні
- `source.fixAll.eslint: "explicit"` - автовиправлення ESLint помилок
- `tailwindCSS.experimental.classRegex` - IntelliSense для Tailwind в функціях `cva()` та `cn()`

---

## 🚀 Покрокова інструкція

### Крок 1: Встановлення залежностей

```bash
npm install --save-dev \
  prettier \
  prettier-plugin-tailwindcss \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-jsx-a11y \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser
```

**Примітка**: Якщо у вас Tailwind CSS 3, можна додатково встановити `eslint-plugin-tailwindcss`. Для Tailwind 4 цей плагін **несумісний**.

---

### Крок 2: Створення конфігураційних файлів

Створіть наступні файли в кореневій директорії проекту:

1. `.prettierrc` (див. вище)
2. `.prettierignore` (див. вище)
3. `eslint.config.mjs` (замінити існуючий)
4. `tailwind.config.ts` (якщо ще не існує)
5. `.editorconfig` (опціонально)
6. `.vscode/settings.json` (опціонально, але рекомендовано)

---

### Крок 3: Оновлення package.json

Додайте скрипти в `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "lint:fix": "eslint --fix",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,scss,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,css,scss,md}\"",
    "type-check": "tsc --noEmit"
  }
}
```

---

### Крок 4: Перший запуск

```bash
# Форматування всіх файлів
npm run format

# Перевірка ESLint
npm run lint

# Перевірка TypeScript
npm run type-check

# Спроба зібрати проект
npm run build
```

---

### Крок 5: Налаштування VSCode

Встановіть розширення:

1. **ESLint** (`dbaeumer.vscode-eslint`)
2. **Prettier - Code formatter** (`esbenp.prettier-vscode`)
3. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)

Після встановлення перезапустіть VSCode.

---

## ⚙️ Особливості Next.js 16

### 1. Новий Flat Config API для ESLint

Next.js 16 використовує ESLint 9 з новою системою конфігурації:

**Застаріло** (ESLint 8):

```javascript
// .eslintrc.js
module.exports = {
  extends: ['next/core-web-vitals'],
  rules: { ... }
}
```

**Актуально** (ESLint 9):

```javascript
// eslint.config.mjs
import { defineConfig } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals,
  { rules: { ... } }
])
```

---

### 2. React 19 без імпорту React

В React 19 більше не потрібно імпортувати React в компонентах:

**Застаріло**:

```tsx
import React from 'react';

export default function Component() {
  return <div>Hello</div>;
}
```

**Актуально**:

```tsx
// Просто використовуємо JSX без імпорту
export default function Component() {
  return <div>Hello</div>;
}
```

**Правило ESLint**: `'react/react-in-jsx-scope': 'off'`

---

### 3. Tailwind CSS 4 без eslint-plugin-tailwindcss

**Проблема**: `eslint-plugin-tailwindcss` підтримує лише Tailwind CSS до версії 3.x.

**Рішення**: Використовуємо `prettier-plugin-tailwindcss` для сортування класів.

```json
// .prettierrc
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

Це забезпечує автоматичну сортування Tailwind класів при форматуванні:

```tsx
// До форматування
<div className="mt-4 p-2 text-red-500 flex">

// Після форматування (Prettier відсортував)
<div className="flex mt-4 p-2 text-red-500">
```

---

### 4. TypeScript 5 з суворою перевіркою

В `tsconfig.json` встановлено `"strict": true`, що включає:

- `strictNullChecks`
- `strictFunctionTypes`
- `strictBindCallApply`
- `noImplicitAny`
- та інші строгі перевірки

**Правило ESLint**: `'@typescript-eslint/no-explicit-any': 'warn'`

---

## 📝 NPM скрипти

### Основні команди

| Команда         | Опис                      |
| --------------- | ------------------------- |
| `npm run dev`   | Запуск dev сервера        |
| `npm run build` | Збірка production версії  |
| `npm run start` | Запуск production сервера |

### Лінтинг та форматування

| Команда                | Опис                                    |
| ---------------------- | --------------------------------------- |
| `npm run lint`         | Перевірка ESLint (без виправлень)       |
| `npm run lint:fix`     | Автоматичне виправлення ESLint помилок  |
| `npm run format`       | Форматування всіх файлів через Prettier |
| `npm run format:check` | Перевірка форматування (без змін)       |
| `npm run type-check`   | Перевірка TypeScript типів              |

### Рекомендований workflow

```bash
# Перед комітом
npm run format          # Відформатувати код
npm run lint:fix        # Виправити ESLint помилки
npm run type-check      # Перевірити типи
npm run build           # Спробувати зібрати

# Або все одразу (додайте в package.json)
npm run validate
```

Додайте в `package.json`:

```json
{
  "scripts": {
    "validate": "npm run format && npm run lint && npm run type-check && npm run build"
  }
}
```

---

## ✅ Перевірка роботи

### 1. Перевірка Prettier

```bash
npm run format:check
```

**Очікуваний результат**:

```
Checking formatting...
All matched files use Prettier code style!
```

---

### 2. Перевірка ESLint

```bash
npm run lint
```

**Очікуваний результат**: Немає виводу (означає 0 помилок)

---

### 3. Перевірка TypeScript

```bash
npm run type-check
```

**Очікуваний результат**: Немає виводу (означає 0 помилок типів)

---

### 4. Перевірка збірки

```bash
npm run build
```

**Очікуваний результат**:

```
▲ Next.js 16.0.0 (Turbopack)

Creating an optimized production build ...
✓ Compiled successfully in XXXXms
```

---

### 5. Перевірка автоформатування в VSCode

1. Відкрийте будь-який `.tsx` файл
2. Додайте невідформатований код:

```tsx
const x = { a: 1, b: 2 };
```

3. Збережіть файл (`Cmd+S` / `Ctrl+S`)
4. Код має автоматично відформатуватися:

```tsx
const x = { a: 1, b: 2 };
```

---

### 6. Перевірка сортування Tailwind класів

Створіть компонент:

```tsx
export default function Test() {
  return <div className="mt-4 flex p-2 text-red-500">Test</div>;
}
```

Збережіть файл. Prettier має автоматично відсортувати класи:

```tsx
export default function Test() {
  return <div className="mt-4 flex p-2 text-red-500">Test</div>;
}
```

---

## 🔧 Вирішення проблем

### Проблема 1: ESLint помилка "Cannot redefine plugin"

**Текст помилки**:

```
ConfigError: Key "plugins": Cannot redefine plugin "jsx-a11y".
```

**Причина**: Плагін вже включений в `eslint-config-next/core-web-vitals`.

**Рішення**: Не імпортувати та не додавати плагін вручну. Використовувати лише правила:

```javascript
// ❌ Неправильно
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

const eslintConfig = defineConfig([
  {
    plugins: { 'jsx-a11y': jsxA11yPlugin }, // Помилка!
  },
]);

// ✅ Правильно
const eslintConfig = defineConfig([
  ...nextVitals, // Вже містить jsx-a11y
  {
    rules: {
      'jsx-a11y/alt-text': 'warn', // Просто перевизначаємо правила
    },
  },
]);
```

---

### Проблема 2: Prettier не сортує Tailwind класи

**Причина**: Не підключений плагін або неправильна конфігурація.

**Рішення**:

1. Перевірте наявність плагіну:

```bash
npm list prettier-plugin-tailwindcss
```

2. Перевірте `.prettierrc`:

```json
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

3. Перезапустіть VSCode.

---

### Проблема 3: "React must be in scope when using JSX"

**Причина**: Застаріле правило для React 17-.

**Рішення**: Додайте в `eslint.config.mjs`:

```javascript
{
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off'
  }
}
```

---

### Проблема 4: Prettier та ESLint конфліктують

**Симптоми**: Prettier форматує код одним способом, ESLint вимагає інший.

**Рішення**: Не використовувати `eslint-plugin-prettier`. Next.js конфігурація вже налаштована для співпраці Prettier та ESLint.

**Не потрібно**:

```javascript
// ❌ Не додавати
extends: ['plugin:prettier/recommended']
```

---

### Проблема 5: VSCode не форматує автоматично

**Рішення**:

1. Перевірте `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

2. Перевірте, що встановлено розширення Prettier
3. В командній палітрі (`Cmd+Shift+P`) виберіть "Format Document With..." → "Prettier"
4. Перезапустіть VSCode

---

### Проблема 6: Build падає з помилкою шрифтів

**Текст помилки**:

```
Failed to fetch `Geist` from Google Fonts.
```

**Причина**: Немає доступу до інтернету або блокується запит.

**Рішення**:

1. Перевірте інтернет-з'єднання
2. Якщо використовуєте корпоративний проксі, налаштуйте npm:

```bash
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

3. Або тимчасово закоментуйте імпорт шрифтів в `app/layout.tsx`

---

## 💡 VSCode налаштування

### Рекомендовані розширення

Створіть `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "styled-components.vscode-styled-components",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

---

### Горячі клавіші

Додайте в `.vscode/keybindings.json`:

```json
[
  {
    "key": "cmd+shift+f",
    "command": "editor.action.formatDocument"
  },
  {
    "key": "cmd+shift+l",
    "command": "eslint.executeAutofix"
  }
]
```

---

## 📊 Контрольний чеклист

Після налаштування перевірте:

- [ ] `npm run format` виконується без помилок
- [ ] `npm run lint` виконується без помилок
- [ ] `npm run type-check` виконується без помилок
- [ ] `npm run build` успішно збирає проект
- [ ] VSCode автоматично форматує код при збереженні
- [ ] ESLint підсвічує помилки в редакторі
- [ ] Tailwind класи автоматично сортуються
- [ ] TypeScript autocomplete працює коректно
- [ ] Немає конфліктів між Prettier та ESLint

---

## 🎓 Додаткові ресурси

### Офіційна документація

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [TypeScript 5](https://www.typescriptlang.org/docs/)

### Корисні статті

- [Migrating to ESLint 9](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [React 19 Release Notes](https://react.dev/blog/2024/04/25/react-19)
- [Tailwind CSS v4 Alpha](https://tailwindcss.com/blog/tailwindcss-v4-alpha)

---

## 📝 Версії та зміни

### v1.0.0 (26 жовтня 2025)

- ✅ Початкова конфігурація для Next.js 16
- ✅ ESLint 9 з Flat Config API
- ✅ Prettier 3.6 з Tailwind плагіном
- ✅ Підтримка React 19
- ✅ TypeScript 5 з строгою типізацією
- ✅ Tailwind CSS 4
- ✅ Налаштування VSCode

---

## 👥 Автори та підтримка

**Проект**: maxsa.dev
**Дата створення**: 26 жовтня 2025
**Мова документації**: Українська

Для питань та пропозицій створюйте issue в репозиторії проекту.

---

## 📄 Ліцензія

Ця конфігурація є частиною проекту maxsa.dev і може бути використана в інших проектах з атрибуцією.

---

**Кінець документації**
