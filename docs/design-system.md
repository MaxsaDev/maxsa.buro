# Design System — Maxsa App

Єдині правила дизайну для всіх сторінок та компонентів додатку.
Цей файл є обов'язковим для дотримання при будь-якій роботі з UI.

---

## 1. Макет сторінки

### Контейнер

- Сторінки **НЕ** використовують `container`, `max-w-*` обгортки
- Layout (`app/(protected)/layout.tsx`) надає: `flex flex-1 flex-col gap-4 p-4 pt-0`
- Контент сторінки розтягується на всю доступну ширину

### Кореневий елемент сторінки

```tsx
<div className="space-y-6">
  {/* Заголовок */}
  <div>
    <h1 className="text-3xl font-bold tracking-tight">Назва сторінки</h1>
    <p className="text-muted-foreground">Опис сторінки</p>
  </div>
  {/* Контент */}
</div>
```

### Відступи між блоками

| Контекст                              | Клас             |
| ------------------------------------- | ---------------- |
| Між секціями сторінки                 | `space-y-6`      |
| Між полями форми                      | `space-y-4`      |
| Між елементами в картці               | `space-y-4`      |
| Між label та input                    | `space-y-2`      |
| Між елементами списку                 | `space-y-2`      |
| Gap у сітці карток                    | `gap-2 sm:gap-3` |
| Між інлайн-полями в рядку (inputs)    | `gap-2`          |
| Між елементами рядка (icon, id, поля) | `gap-2`          |

---

## 2. Кнопки

### Дії в рядку (редагувати, видалити, перемістити)

Кнопки-іконки всередині карток, рядків, списків:

```tsx
<Button variant="ghost" size="icon" className="size-8">
  <Icon className="size-4" />
</Button>
```

### Семантичні кольори кнопок-іконок

| Дія                     | className                                                         |
| ----------------------- | ----------------------------------------------------------------- |
| Видалення               | `text-destructive hover:bg-destructive/10 hover:text-destructive` |
| Підтвердження           | `text-primary hover:bg-primary/10`                                |
| Нейтральна (drag, edit) | без додаткових класів (наслідує ghost)                            |

### Кнопки дій у формах

Основні дії форм (`submit`, підтвердження):

```tsx
<Button size="sm">
  <Icon className="mr-2 size-4" />
  Текст дії
</Button>
```

**ЗАБОРОНЕНО** використовувати `className="w-full"` або `className="flex-1"` для кнопок дій.
Кнопка повинна бути компактною — за розміром тексту.

Виняток: кнопки всередині діалогових вікон (AlertDialog) — там ширина визначається футером діалогу.

### Пара кнопок (дія + скасування)

```tsx
<div className="flex gap-2">
  <Button size="sm">Дія</Button>
  <Button size="sm" variant="outline">
    Скасувати
  </Button>
</div>
```

### Кнопка "Додати" (dashed trigger)

```tsx
<button className="text-muted-foreground hover:bg-muted/50 hover:text-foreground flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm transition-colors">
  <Plus className="size-4" />
  Додати елемент
</button>
```

Форма додавання (розкрита):

```tsx
<div className="border-primary/40 bg-primary/5 max-w-2xl rounded-lg border p-4">
  {/* Форма */}
  <Button size="sm" variant="outline" onClick={cancel}>
    Скасувати
  </Button>
</div>
```

Інлайн-форми додавання обмежуються `max-w-2xl` щоб на великих екранах кнопки дій не відривались далеко від полів вводу.

### Клавіатурні скорочення в формах

Всі інлайн-форми (додавання, редагування) підтримують:

- `Enter` — зберегти / підтвердити
- `Escape` — скасувати / закрити форму

### Inline кнопки збереження/скасування (в рядку)

Для кнопок при інлайн-редагуванні (create-menu-form, add-menu-item-form):

```tsx
<button className="text-primary hover:bg-primary/10 flex size-7 items-center justify-center rounded-md">
  <Check className="size-4" />
</button>
<button className="text-muted-foreground hover:bg-muted flex size-7 items-center justify-center rounded-md">
  <X className="size-4" />
</button>
```

---

## 3. InputGroup

### Кнопки всередині InputGroup

Всі кнопки всередині InputGroupAddon:

```tsx
<InputGroupAddon align="inline-end">
  <InputGroupButton size="icon-xs" variant="ghost" className="...">
    <Icon className="size-4" />
  </InputGroupButton>
</InputGroupAddon>
```

### Семантичні кольори InputGroupButton

| Тип дії             | className                                                         |
| ------------------- | ----------------------------------------------------------------- |
| Підтвердити (Check) | `text-success hover:bg-success/10 hover:text-success`             |
| Скасувати (X)       | `text-destructive hover:bg-destructive/10 hover:text-destructive` |
| Toggle (Eye/EyeOff) | `text-muted-foreground hover:text-foreground`                     |

### Індикатор валідації

Зелена галочка (не кнопка, просто іконка):

```tsx
<InputGroupAddon align="inline-end">
  <CheckCircle2 className="text-success size-5" />
</InputGroupAddon>
```

---

## 4. Картки (Card)

### Кольорові бордери для статусу

| Стан                      | className                                                      |
| ------------------------- | -------------------------------------------------------------- |
| Успіх / активний          | `border-success/30`                                            |
| Попередження / неактивний | `border-warning/30`                                            |
| Картка з бордером зліва   | додатково `border-l-4 border-l-success` або `border-l-warning` |

### Заголовок картки з іконкою

```tsx
<CardHeader>
  <CardTitle className="flex items-center gap-2">
    <Icon className="size-5" />
    Назва
  </CardTitle>
  <CardDescription>Опис</CardDescription>
</CardHeader>
```

### Попереджувальна картка

```tsx
<Card className="border-warning/30 bg-warning/10">
  <CardHeader>
    <div className="flex items-center gap-2">
      <AlertCircle className="text-warning h-5 w-5" />
      <CardTitle className="text-warning">Заголовок</CardTitle>
    </div>
  </CardHeader>
</Card>
```

---

## 5. Навігація вкладок (Card-based Tabs)

**НЕ використовувати** Radix `Tabs/TabsList/TabsTrigger` для навігації по сторінці.
Використовувати card-based навігацію:

```tsx
type TabId = 'tab1' | 'tab2' | 'tab3';

const tabs: Array<{ id: TabId; label: string; description: string; icon: typeof Icon }> = [...];

<nav role="tablist" className="flex flex-col gap-2 sm:flex-row sm:gap-3">
  {tabs.map((tab) => {
    const isActive = activeTab === tab.id;
    const Icon = tab.icon;
    return (
      <button
        key={tab.id}
        role="tab"
        aria-selected={isActive}
        onClick={() => setActiveTab(tab.id)}
        className={`flex flex-1 items-center gap-3 rounded-lg border p-3 text-left transition-all sm:p-4 ${
          isActive
            ? 'border-primary/30 bg-primary/5 shadow-sm'
            : 'border-border hover:border-border/80 hover:bg-muted/30'
        }`}
      >
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
          isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium">{tab.label}</div>
          <div className="text-muted-foreground hidden text-xs sm:block">{tab.description}</div>
        </div>
      </button>
    );
  })}
</nav>
```

Контент вкладок — умовний рендеринг:

```tsx
{
  activeTab === 'tab1' && <Component1 />;
}
{
  activeTab === 'tab2' && <Component2 />;
}
```

**Виняток**: Radix Tabs дозволено для вкладок усередині карток (не навігація сторінки).

---

## 6. Сповіщення (ProfileAlert)

```tsx
<ProfileAlert variant="success">Текст</ProfileAlert>
<ProfileAlert variant="error">Текст</ProfileAlert>
<ProfileAlert variant="warning" title="Заголовок">Текст</ProfileAlert>
<ProfileAlert variant="info">Текст</ProfileAlert>
<ProfileAlert variant="note">Текст</ProfileAlert>
```

---

## 7. Іконки

### Розміри

| Контекст           | Клас                                     |
| ------------------ | ---------------------------------------- |
| Всередині кнопки   | `size-4`                                 |
| В заголовку картки | `size-5`                                 |
| В іконці табу      | `size-4` (всередині `size-9` контейнера) |
| В Empty стані      | `size-10`                                |

### Іконка + текст в кнопці

```tsx
<Icon className="mr-2 size-4" />
```

---

## 8. Розміри елементів

### Кнопки-іконки

| Контекст                       | Розмір контейнера                     |
| ------------------------------ | ------------------------------------- |
| В рядку списку (Item)          | `size-8` (Button size="icon")         |
| Inline редагування             | `size-7` (custom button)              |
| В InputGroup                   | `size="icon-xs"` (InputGroupButton)   |
| Поруч з текстом (напр. pencil) | `size-7` (Button) + іконка `size-3.5` |

### Контейнер іконки в табах

`size-9` з `rounded-md`

---

## 9. Кольорова система

### Семантичні бордери

| Колір                | Використання                   |
| -------------------- | ------------------------------ |
| `border-primary/30`  | Активний таб, фокус            |
| `border-success/30`  | Увімкнено, активний, безпечно  |
| `border-warning/30`  | Вимкнено, потребує уваги       |
| `border-destructive` | Помилка (через `aria-invalid`) |
| `border-primary/40`  | Форма додавання (розкрита)     |
| `border-dashed`      | Тригер "Додати"                |

### Семантичні фони

| Колір               | Використання                  |
| ------------------- | ----------------------------- |
| `bg-primary/5`      | Активний таб, форма додавання |
| `bg-primary/10`     | Hover на primary кнопках      |
| `bg-success/10`     | Hover на success кнопках      |
| `bg-destructive/10` | Hover на destructive кнопках  |
| `bg-warning/10`     | Попереджувальна картка        |
| `bg-muted/30`       | Hover на неактивних елементах |
| `bg-muted/50`       | Hover на dashed trigger       |

---

## 10. Компонент EditDbMaxsa

Для інлайн-редагування даних з БД:

```tsx
<EditDbMaxsa
  id={recordId}
  value={currentValue}
  schema={zodSchema}
  onSave={serverAction}
  placeholder="..."
/>
```

- Максимальна ширина: `max-w-lg` (за замовчуванням)
- Dirty state: `!border-warning`
- Кнопки: `size="icon-xs" variant="ghost"` з семантичними кольорами
- Клавіатурні скорочення (працюють тільки коли значення змінено — dirty state):
  - `Enter` — зберегти зміни
  - `Escape` — скасувати зміни (повернути початкове значення)

---

## 11. Інлайн-рядок редагування (editable row)

Єдиний паттерн для рядків з інлайн-редагуванням полів (меню, повноваження тощо):

```tsx
<div className="border-border flex items-center gap-2 rounded-md border px-3 py-2">
  {/* Опціональні елементи: drag handle, icon picker, ID */}
  <GripVertical className="text-muted-foreground size-3.5" />
  <span className="text-muted-foreground shrink-0 font-mono text-xs">{id}</span>

  {/* Група полів — завжди flex-row gap-2 */}
  <div className="flex min-w-0 flex-1 flex-row gap-2">
    <EditDbMaxsa ... className="flex-1" />
    <EditDbMaxsa ... className="flex-1" />
  </div>

  {/* Дії: switch, delete */}
  <div className="flex shrink-0 items-center gap-1.5">
    <Switch ... />
    <Button variant="ghost" size="icon" className="size-8" />
  </div>
</div>
```

Правила:

- Група полів (title + description, title + url): **`flex flex-row gap-2`**, кожне поле **`className="flex-1"`**
- Рядок категорії (з фоном): `bg-muted/50 rounded-lg px-3 py-2.5`
- Рядок елемента: `rounded-md px-3 py-2`
- Приховання поля на мобільних: `className="hidden flex-1 md:flex"` на другому полі

### Вкладені елементи (nested items)

Вкладені пункти всередині категорії візуально з'єднуються з батьківським рядком через пунктирну лінію зліва:

```tsx
{/* Вкладені пункти */}
{items.length > 0 && (
  <div className="ml-6 space-y-2 border-l-2 border-dashed pl-4">
    {/* SortableWrapper + items */}
  </div>
)}

{/* Форма додавання нового пункту */}
<div className="ml-6 border-l-2 border-dashed pl-4">
  <AddItemForm ... />
</div>
```

- **`ml-6 pl-4 border-l-2 border-dashed`** — єдиний паттерн для відступу та декоративної лінії
- Лінія проходить через весь блок вкладених елементів **і** через форму додавання
- Цей паттерн обов'язковий скрізь, де є вкладеність (меню, повноваження тощо)

---

## Заборони

1. **НЕ** використовувати `container`, `max-w-4xl`, `max-w-6xl`, `max-w-7xl` на рівні сторінки
2. **НЕ** використовувати `w-full` / `flex-1` для кнопок дій у формах
3. **НЕ** використовувати `variant="secondary"` для кнопок в InputGroup
4. **НЕ** використовувати Radix Tabs для навігації верхнього рівня сторінки
5. **НЕ** використовувати `useMemo`/`useCallback`/`React.memo` (React Compiler)
6. **НЕ** використовувати кнопки без семантичного кольору для деструктивних дій
