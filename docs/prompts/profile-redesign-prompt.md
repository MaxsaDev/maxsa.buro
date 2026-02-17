# Промпт: Редизайн UX сторінок Профілю

## Задача

Потрібно переробити UI/UX сторінок профілю користувача `app/(protected)/profile`. Всі зміни стосуються **лише фронтенд-компонентів**. Бекенд (actions, data, schemas) не змінюється.

Виконуй зміни **послідовно по файлах**, після кожного файлу перевіряй що немає помилок TypeScript/ESLint.

---

## Зміна 1: `app/(protected)/profile/page.tsx` — Кастомна навігація замість Radix Tabs

**Було**: Використовується `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` з Radix UI. Три табу: Огляд, Персональні дані, Безпека. Статус безпеки (2FA, Passkey) рендериться всередині першого табу як окрема Card.

**Стало**: Кастомна card-based навігація з іконками. Повністю перепиши файл за паттерном `menu-tabs-wrapper.tsx`:

### Навігація

- Масив конфігурації `tabs` з полями `id`, `label`, `description`, `icon`:
  1. `id: 'overview'`, `label: 'Огляд'`, `description: 'Основна інформація'`, `icon: User`
  2. `id: 'personal'`, `label: 'Персональні дані'`, `description: 'Імʼя та контакти'`, `icon: FileText`
  3. `id: 'security'`, `label: 'Безпека'`, `description: 'Пароль, 2FA, Passkey'`, `icon: Shield`
- `useState<TabId>` для активної вкладки (початкове: `'overview'`)
- `<nav role="tablist">` з кнопками-картками:
  - Контейнер: `flex flex-col gap-2 sm:flex-row sm:gap-3`
  - Кожна кнопка: `flex flex-1 items-center gap-3 rounded-lg border p-3 sm:p-4 transition-all`
  - Активна: `border-primary/30 bg-primary/5 shadow-sm`
  - Неактивна: `border-border hover:border-border/80 hover:bg-muted/30`
  - Іконка в квадраті: `flex size-9 items-center justify-center rounded-md`
    - Активна: `bg-primary text-primary-foreground`
    - Неактивна: `bg-muted text-muted-foreground`
  - Назва: `text-sm font-medium`
  - Опис: `text-muted-foreground hidden text-xs sm:block`
  - ARIA: `role="tab"`, `aria-selected={activeTab === tab.id}`

### Контент

- Умовний рендеринг: `{activeTab === 'overview' && ...}` замість `TabsContent`
- Контейнер кожної секції: `space-y-6`

### Заголовок сторінки

- Зберігай існуючий заголовок: "Профіль користувача" + підзаголовок

### Статус безпеки — винести з page.tsx

- **Видалити** Card зі статусом безпеки (2FA, Passkey) з overview табу в page.tsx
- Замість цього передати пропси `twoFactorEnabled` та `passkeysCount` в `ProfileInfo`
- `ProfileInfo` сама відрендерить статус безпеки (див. Зміна 2)

### Кольорові бордери секцій безпеки

- В security табі, передавати стан в компоненти через пропси:
  - `TwoFactorSetupComponent`: додати проп `className` для кольорового бордера
  - Обгортка PasskeySetup/PasskeyList: додати кольоровий бордер

### Прибрати імпорти Radix Tabs

- Видалити імпорти `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- Залишити всі інші імпорти

---

## Зміна 2: `components/profile/profile-info.tsx` — Покращена картка профілю

**Було**: ProfileSection з аватаром, inline редагуванням псевдоніма, та списком ProfileInfoRow. Статус безпеки рендерився окремо в page.tsx.

**Стало**: Та ж сама ProfileSection, але з доданим блоком статусу безпеки внизу:

### Нові пропси

```typescript
interface ProfileInfoProps {
  user: {
    name: string;
    email: string;
    role?: string;
    emailVerified?: boolean;
    image?: string | null;
  };
  twoFactorEnabled?: boolean;
  passkeysCount?: number;
}
```

### Блок статусу безпеки (після ProfileAlert)

Додати секцію після існуючого `ProfileAlert`:

```tsx
<Separator />;

{
  /* Статус безпеки */
}
<div className="space-y-2">
  <h4 className="text-sm font-medium">Статус безпеки</h4>
  <div className="grid gap-2 sm:grid-cols-3">
    {/* Міні-картка: Email */}
    <div
      className={cn(
        'rounded-lg border border-l-4 p-3',
        user.emailVerified ? 'border-l-success' : 'border-l-warning'
      )}
    >
      <div className="flex items-center gap-2">
        <Mail className="text-muted-foreground size-4" />
        <span className="text-xs font-medium">Email</span>
      </div>
      <p
        className={cn(
          'mt-1 text-xs font-medium',
          user.emailVerified ? 'text-success' : 'text-warning'
        )}
      >
        {user.emailVerified ? '✓ Підтверджено' : 'Не підтверджено'}
      </p>
    </div>

    {/* Міні-картка: 2FA */}
    <div
      className={cn(
        'rounded-lg border border-l-4 p-3',
        twoFactorEnabled ? 'border-l-success' : 'border-l-warning'
      )}
    >
      <div className="flex items-center gap-2">
        <Shield className="text-muted-foreground size-4" />
        <span className="text-xs font-medium">2FA</span>
      </div>
      <p
        className={cn(
          'mt-1 text-xs font-medium',
          twoFactorEnabled ? 'text-success' : 'text-warning'
        )}
      >
        {twoFactorEnabled ? '✓ Увімкнено' : 'Вимкнено'}
      </p>
    </div>

    {/* Міні-картка: Passkey */}
    <div
      className={cn(
        'rounded-lg border border-l-4 p-3',
        (passkeysCount ?? 0) > 0 ? 'border-l-success' : 'border-l-warning'
      )}
    >
      <div className="flex items-center gap-2">
        <Fingerprint className="text-muted-foreground size-4" />
        <span className="text-xs font-medium">Passkey</span>
      </div>
      <p
        className={cn(
          'mt-1 text-xs font-medium',
          (passkeysCount ?? 0) > 0 ? 'text-success' : 'text-warning'
        )}
      >
        {(passkeysCount ?? 0) > 0 ? `${passkeysCount} активних` : 'Немає'}
      </p>
    </div>
  </div>
</div>;
```

### Додаткові імпорти

- `import { Fingerprint, Mail, Shield } from 'lucide-react'`
- `import { cn } from '@/lib/utils'` (якщо ще не імпортовано)

### ProfileInfoRow — менший gap

- Змінити `gap-4` на `gap-2` в `ProfileInfoRow` компоненті (`components/profile/shared/profile-info-row.tsx`)

---

## Зміна 3: `components/profile/shared/profile-info-row.tsx` — Зменшений gap

**Було**: `grid grid-cols-3 gap-4`

**Стало**: `grid grid-cols-3 gap-2`

---

## Зміна 4: `components/profile/personal-data-section.tsx` — Інлайн додавання контакту

**Було**: Використовується `Collapsible` з `CollapsibleTrigger` (Button "Додати контакт") та `CollapsibleContent` для форми додавання контакту.

**Стало**: Інлайн dashed-border кнопка (паттерн з menu redesign):

### Замінити Collapsible на інлайн-паттерн

- Видалити `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger` імпорти
- Видалити `ChevronDown` імпорт
- Видалити стан `isAddContactOpen`

### Тригер (коли `!isAddingContact`)

```tsx
<button
  type="button"
  onClick={() => setIsAddingContact(true)}
  className="text-muted-foreground hover:bg-muted/50 hover:text-foreground flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm transition-colors"
>
  <Plus className="size-4" />
  Додати контакт
</button>
```

### Інлайн форма (коли `isAddingContact`)

```tsx
<div className="border-primary/40 bg-primary/5 rounded-lg border p-4">
  <AddContactForm
    contactTypes={contactTypes}
    onContactAdded={async () => {
      await loadData();
      setIsAddingContact(false);
    }}
  />
  <div className="mt-3 flex justify-end">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsAddingContact(false)}
      className="text-muted-foreground"
    >
      Скасувати
    </Button>
  </div>
</div>
```

### Новий стан

- Замінити `const [isAddContactOpen, setIsAddContactOpen] = useState(false)` на `const [isAddingContact, setIsAddingContact] = useState(false)`

---

## Зміна 5: `components/profile/two-factor-setup.tsx` — Кольоровий бордер

**Було**: Всі Card мають стандартний бордер.

**Стало**: Додати кольоровий бордер на зовнішню Card залежно від стану:

### Коли 2FA увімкнено (isEnabled === true)

- Змінити `<Card>` на `<Card className="border-success/30">` в блоці рендера для `isEnabled`

### Коли 2FA вимкнено (isEnabled === false)

- Змінити `<Card>` на `<Card className="border-warning/30">` в блоці рендера для `!isEnabled`

---

## Зміна 6: `components/passkey/passkey-setup.tsx` — Кольоровий бордер

**Було**: Стандартний бордер Card.

**Стало**: Додати проп та кольоровий бордер:

### Новий проп

```typescript
interface PasskeySetupProps {
  onSuccess?: () => void;
  hasPasskeys?: boolean;
}
```

### Кольоровий бордер

- Для Card з "WebAuthn не підтримується": залишити без змін (warning вже є всередині)
- Для основної Card: `<Card className={hasPasskeys ? 'border-success/30' : 'border-warning/30'}`

---

## Зміна 7: `components/passkey/passkey-list.tsx` — Кольоровий бордер

**Було**: Стандартний бордер Card.

**Стало**: Додати `className="border-success/30"` на Card коли є passkeys (основний рендер з списком).

---

## Зміна 8: `app/(protected)/profile/page.tsx` — Фінальна зборка security табу

В security табі, обгорнути PasskeySetup + PasskeyList в єдиний контейнер:

```tsx
{
  /* Passkey секція */
}
<div className="space-y-6">
  <PasskeySetup onSuccess={handlePasskeyChange} hasPasskeys={passkeys.length > 0} />
  {passkeys.length > 0 && (
    <>
      <Separator />
      <PasskeyList onPasskeyDeleted={handlePasskeyChange} />
    </>
  )}
</div>;
```

Також передати пропси в ProfileInfo:

```tsx
{
  activeTab === 'overview' && (
    <ProfileInfo user={user} twoFactorEnabled={twoFactorEnabled} passkeysCount={passkeys.length} />
  );
}
```

---

## Зміна 9: `app/(protected)/profile/notifications/page.tsx` — Консистентний контейнер

**Було**: `<div className="container max-w-6xl py-4">`

**Стало**: `<div className="container max-w-4xl py-4">`

---

## Зміна 10: `app/(protected)/profile/payment-data/page.tsx` — Консистентний контейнер

**Було**: `<div className="container max-w-6xl py-4">`

**Стало**: `<div className="container max-w-4xl py-4">`

---

## Загальні правила

1. **UI мова**: українська (коментарі в коді теж українською)
2. **Не використовувати** `useMemo`/`useCallback`/`React.memo` — React Compiler
3. **Імпорти**: `@/` alias, групування: external → project → types
4. **Стилі**: Tailwind CSS 4.x, семантичні кольорові токени (`text-success`, `border-warning/30`, тощо)
5. **Компоненти**: Shadcn UI (`Button`, `Card`, `AlertDialog`, `Separator`, `InputGroup`, `Item`)
6. **Бекенд**: actions, data, schemas — НЕ ЗМІНЮЮТЬСЯ
7. **Функціональність**: вся існуюча логіка зберігається без змін — це тільки UI/UX оновлення

---

## Перевірка

Після всіх змін виконай:

```bash
npm run type-check
npm run lint
```

Помилки пов'язані з `next-themes` (якщо є) — не стосуються цих змін, ігноруй їх.
