# Промпт: Редизайн UX сторінки menu-app

## Задача

Потрібно переробити UI/UX сторінки адміна `mx-admin/menu-app` (конструктор меню). Всі зміни стосуються лише фронтенд-компонентів. Бекенд (actions, data, schemas) не змінюється.

**Перед початком**: встанови shadcn Popover компонент:

```bash
npx shadcn@latest add popover -y
```

Виконуй зміни **послідовно по файлах**, після кожного файлу перевіряй що немає помилок TypeScript/ESLint.

---

## Зміна 1: `menu-tabs-wrapper.tsx` — Кастомна навігація замість Radix Tabs

**Було**: Використовується компонент `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` з Radix UI.

**Стало**: Кастомна card-based навігація з іконками. Повністю перепиши файл:

- Замість Radix Tabs — масив конфігурації `tabs` з полями `id`, `label`, `description`, `icon` (lucide іконки: `FolderTree`, `Layers`, `LifeBuoy`)
- `useState<TabId>` для активної вкладки
- Навігація — `<nav role="tablist">` з кнопками-картками:
  - Кожна кнопка: `flex flex-1 items-center gap-3 rounded-lg border p-3 sm:p-4`
  - Активна: `border-primary/30 bg-primary/5 shadow-sm`
  - Неактивна: `border-border hover:border-border/80 hover:bg-muted/30`
  - Іконка в квадраті `size-9 rounded-md` (активна: `bg-primary text-primary-foreground`, неактивна: `bg-muted text-muted-foreground`)
  - Назва + опис (опис видно тільки на `sm:block`)
- Контент — умовний рендеринг через `{activeTab === '...' && ...}` замість прихованих TabsContent
- Заголовок сторінки зверху: "Конструктор меню" + підзаголовок

---

## Зміна 2: `sortable-menu-card.tsx` — Картка меню з колапсом

**Було**: Проста обгортка з drag-and-drop.

**Стало**: Повноцінна картка з хедером, collapse/expand, inline edit назви:

- `rounded-xl border`, при drag — `shadow-lg`, неактивне — `opacity-60`
- Хедер `px-4 py-3`: drag handle → `EditDbMaxsa` для назви → Switch активності → кнопка видалення (AlertDialog) → ChevronDown для collapse
- Контент `border-t px-4 py-4` ховається при `isCollapsed`
- Drag handle: `GripVertical` з `cursor-grab`
- Видалення з `AlertDialog` підтвердженням
- Все з `Tooltip` обгортками

---

## Зміна 3: `icon-picker.tsx` — Popover замість Sheet

**Було**: Sheet/Drawer для вибору іконки.

**Стало**: Легкий Popover з пошуком та сіткою іконок:

- Тригер: `Button variant="outline" size="icon" className="size-8 shrink-0"` з `MenuIcon`
- `PopoverContent align="start" className="w-[280px] p-2"`
- Пошук: `<input>` з іконкою `Search` зліва, `autoFocus`, клас `bg-muted/50 placeholder:text-muted-foreground w-full rounded-md py-1.5 pr-3 pl-8 text-sm outline-none focus:ring-1 focus:ring-ring`
- Сітка: `max-h-[240px] overflow-y-auto`, `grid grid-cols-7 gap-0.5`
- Кожна іконка: `size-9 rounded-md`, виділена: `bg-primary/10 text-primary ring-primary/30 ring-1`
- Фільтрація: виключити `'Dot'` з `menuIconMap`, пошук по `iconName.toLowerCase()`
- При виборі: `onSave(id, iconName)` → `showNotification` → закрити + очистити пошук
- `isLoading` стан для блокування під час збереження

---

## Зміна 4: `icon-picker-new.tsx` — Popover для нових записів

Та сама структура що і `icon-picker.tsx`, але:

- Пропси: `currentIcon: string`, `onSelect: (iconName: string) => void`, `disabled?: boolean`
- Без `isLoading` (синхронний callback)
- `handleSelectIcon`: просто `onSelect(iconName)` + закрити + очистити пошук

---

## Зміна 5: `create-menu-form.tsx` — Інлайн створення меню

**Було**: Sheet/Drawer з формою для створення нового меню.

**Стало**: Інлайн-форма що з'являється при кліку:

- Тригер: `Button size="sm" variant="outline"` з іконкою `Plus` + текст "Нове меню"
- При кліку `isAdding=true` → показати інлайн-форму:
  - `rounded-lg border border-primary/40 bg-primary/5 px-3 py-2.5`
  - `InputGroup` + `InputGroupInput` з `ref` для автофокусу, placeholder "Назва нового меню"
  - Кнопки: `Check` (зберегти, `text-primary hover:bg-primary/10 size-7`) + `X` (скасувати, `text-muted-foreground size-7`)
- Валідація: `menuTitleSchema.safeParse(title)` → помилка через `titleResult.error.issues[0]?.message`
- Keyboard: `Enter` → save, `Escape` → cancel
- Помилка під формою: `<p className="text-destructive px-3 text-xs">`

---

## Зміна 6: `add-menu-item-form.tsx` — Інлайн створення пункту меню

**Було**: Sheet/Drawer з формою (React Hook Form + Zod).

**Стало**: Повна переписка. Інлайн-рядок з іконкою, назвою, URL:

- Тригер: `<button>` з dashed border: `rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50` + іконка `Plus`
- При кліку → інлайн-форма:
  - `rounded-lg border border-primary/40 bg-primary/5 px-3 py-2.5`
  - `IconPickerNew` (пікер іконок) → два `InputGroupInput` (назва + URL) → Check/X кнопки
- **URL маска**: початкове значення `'/'`, при зміні — якщо не починається з `http://`/`https://`/`/` → додати `/` на початок (функція `handleUrlChange`)
- Валідація: ручна через `menuTitleSchema`, `menuUrlSchema`, `menuIconSchema` `.safeParse()` → помилки через `.error.issues[0]?.message`
- Keyboard: `Enter` → save, `Escape` → cancel
- **Не використовується React Hook Form** — тільки `useState` + ручна Zod валідація

---

## Зміна 7: `edit-db-maxsa.tsx` — URL маска для існуючих записів

В функції `handleChange` додати авто-слеш для URL полів:

```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  let newValue = e.target.value;
  // Для URL полів гарантуємо слеш на початку (якщо не повний URL)
  if (
    type === 'url' &&
    newValue !== '' &&
    !newValue.startsWith('http://') &&
    !newValue.startsWith('https://') &&
    !newValue.startsWith('/')
  ) {
    newValue = '/' + newValue;
  }
  setCurrentValue(newValue);
  if (validationError) {
    setValidationError(null);
  }
};
```

---

## Зміна 8: `menu-user-sections.tsx` — Секції (першій таб)

Головний компонент. Зміни в структурі:

### `SortableMenuItem` (пункт меню):

- Drag handle `GripVertical` зліва
- `IconPicker` для іконки
- Два `EditDbMaxsa` (назва + URL), responsive через `isMobile`
- Дії: Star button для "за замовчуванням" (`text-amber-500` активна, `text-muted-foreground/40` неактивна, `fill-current` для заповненої зірки) → Switch активності → Trash2 видалення з AlertDialog
- Все обгорнуто в `Tooltip`

### `CategorySection` (категорія):

- Рядок категорії: `bg-muted/30 rounded-lg border` — IconPicker + два EditDbMaxsa + Switch + Trash2
- Вкладені пункти: `ml-6 border-l-2 border-dashed pl-4` → `SortableMenuWrapper` з `SortableMenuItem`
- Форма додавання пункту: `AddMenuItemForm` в тій же вкладеній зоні `ml-6 border-l-2 border-dashed pl-4`

### `MenuUserSections` (головний):

- `DndContext` + `SortableContext` для drag-and-drop меню
- Кнопка "Нове меню" (`CreateMenuForm`) вирівняна вправо: `flex justify-end`
- Кожне меню в `SortableMenuCard`
- **Порожній стан категорій** (коли немає категорій в меню):
  - `flex flex-col items-center gap-3 rounded-xl border border-dashed py-8`
  - Текст + `AddMenuItemForm` по центру
- **Коли категорії є**: список категорій + `AddMenuItemForm` внизу (`mt-4 flex justify-start`)

---

## Зміна 9: `menu-user-items.tsx` — Пункти (другий таб)

Аналогічна структура до `menu-user-sections.tsx`, але без категорій:

### `SortableMenuItem`:

- Та сама структура: drag handle → IconPicker → EditDbMaxsa (назва + URL) → Star → Switch → Trash2

### `MenuUserItems`:

- DndContext для меню
- CreateMenuForm вправо
- Кожне меню в `SortableMenuCard`:
  - Якщо є пункти: `SortableMenuWrapper` → `SortableMenuItem` + `AddMenuItemForm` внизу
  - **Порожній стан**: `flex flex-col items-center gap-3 rounded-xl border border-dashed py-8` — текст + `AddMenuItemForm` по центру

---

## Зміна 10: `menu-app-support.tsx` — Підтримка (третій таб)

### Зміни:

- Заголовок: "Пункти підтримки" + лічильник з українською плюралізацією (`1 пункт / 2-4 пункти / 5+ пунктів`)
- Кнопка "Додати пункт" (`AddMenuItemForm`) в заголовку **тільки коли є елементи** (`items.length > 0`)
- Список: `rounded-lg border px-3 py-2.5 hover:bg-muted/30` рядки — IconPicker + EditDbMaxsa (назва + URL) + Switch + Trash2 з AlertDialog
- **Порожній стан**: `flex flex-col items-center gap-3 rounded-xl border border-dashed py-8` — текст + `AddMenuItemForm` по центру

---

## Загальні правила

1. **UI мова**: українська (коментарі в коді теж українською)
2. **Не використовувати** `useMemo`/`useCallback`/`React.memo` — React Compiler
3. **Імпорти**: `@/` alias, групування: external → project → types
4. **Валідація**: `schema.safeParse()` → `.error.issues[0]?.message` (НЕ `.flatten()`)
5. **Стилі**: Tailwind CSS 4.x
6. **Компоненти**: Shadcn UI (`Button`, `Switch`, `AlertDialog`, `Tooltip`, `Popover`, `InputGroup`)

---

## Перевірка

Після всіх змін виконай:

```bash
npm run type-check
npm run lint
```

Помилки пов'язані з `next-themes` (якщо є) — не стосуються цих змін, ігноруй їх.
