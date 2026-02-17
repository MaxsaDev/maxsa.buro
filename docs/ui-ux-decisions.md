# UI/UX Design Decisions

**Дата создания:** 2025-11-09
**Проект:** maxsa.dev
**Stack:** Next.js 16, React 19, Shadcn UI, TailwindCSS 4.x

---

## 📋 Содержание

1. [Философия UX](#философия-ux)
2. [Формы: Validation Strategy](#формы-validation-strategy)
3. [Error Display](#error-display)
4. [Success Indicators](#success-indicators)
5. [Password Input](#password-input)
6. [Autofocus & AutoComplete](#autofocus--autocomplete)
7. [Registration Flow](#registration-flow)
8. [Name Change Logic](#name-change-logic)
9. [Responsive Design](#responsive-design)
10. [Accessibility](#accessibility)

---

## Философия UX

### Главные принципы

**1. Минимизировать friction** 🚀

- Чем меньше полей - тем выше conversion
- Убираем всё необязательное из критических путей
- Регистрация = email + пароль (всё!)

**2. Позитивное подкрепление** ✅

- Показываем успех, а не только ошибки
- Зеленые галочки для валидных полей
- Чувство прогресса

**3. Не раздражать пользователя** 😌

- Никаких "прыжков" верстки
- Валидация только при submit
- Сохраняем введенные данные

**4. Быть честным и прозрачным** 💎

- Объясняем, почему нужна информация
- Предупреждаем о необратимых действиях
- Ясные сообщения об ошибках

---

## Формы: Validation Strategy

### Эволюция подхода

**❌ Было (плохо):**

```typescript
mode: 'onBlur'; // Валидация при потере фокуса
```

**Проблемы:**

- Форма "прыгает" при появлении ошибок
- Раздражает пользователя во время ввода
- Курсор "убегает" из-за layout shift

**✅ Стало (хорошо):**

```typescript
mode: 'onSubmit'; // Валидация только при submit
```

**Преимущества:**

- Форма стабильная, не прыгает
- Пользователь спокойно заполняет
- Все ошибки показываются разом

### Реализация (React Hook Form)

```typescript
const {
  register,
  handleSubmit,
  formState: { errors, touchedFields },
} = useForm<FormValues>({
  resolver: zodResolver(schema),
  mode: 'onSubmit', // 🔑 Ключевое решение
});
```

### Когда показывать ошибки

```
📝 Во время заполнения: НИЧЕГО (только зеленые галочки ✓)
⚠️ После submit:        Список всех ошибок + красные borders
✅ После исправления:   Ошибки исчезают, появляются галочки
```

---

## Error Display

### Финальная стратегия (после итераций)

**Элементы:**

1. **Красный блок наверху формы** с списком ошибок
2. **Красный border** на проблемных полях
3. **Никаких дублирующих сообщений** под полями

### Структура error блока

```tsx
{
  /* Список помилок валідації */
}
{
  Object.keys(errors).length > 0 && (
    <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
      <ul className="list-inside list-disc space-y-1">
        {errors.email && <li>{errors.email.message}</li>}
        {errors.password && <li>{errors.password.message}</li>}
        {errors.confirmPassword && <li>{errors.confirmPassword.message}</li>}
      </ul>
    </div>
  );
}
```

**Важно:**

- ❌ **БЕЗ заголовка** "❌ Виправте наступні помилки:" (избыточно)
- ✅ **Только список** с bullet points
- ✅ **Красный фон** сам по себе сигнализирует об ошибке

### Красные borders на полях

```tsx
<Input className={errors.email ? 'border-red-500' : ''} {...register('email')} />
```

**Почему без текста под полем:**

- Все ошибки уже перечислены наверху
- Текст под полем вызывает layout shift
- Красный border + список наверху = достаточно информативно

### Server vs Client errors

```tsx
{
  /* Серверна помилка */
}
{
  serverError && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{serverError}</div>;
}

{
  /* Клієнтські помилки валідації */
}
{
  !serverError && Object.keys(errors).length > 0 && (
    <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
      <ul className="list-inside list-disc space-y-1">
        {errors.email && <li>{errors.email.message}</li>}
      </ul>
    </div>
  );
}
```

**Логика:**

- Если есть server error → показываем только его
- Если нет server error → показываем validation errors

---

## Success Indicators

### Зеленые галочки ✓

**Концепция:** Позитивное подкрепление - показываем что поле заполнено правильно.

### Реализация

```tsx
import { CheckCircle2 } from 'lucide-react';

<div className="relative">
  <Input {...register('email')} />
  {touchedFields.email && !errors.email && (
    <CheckCircle2 className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-green-600" />
  )}
</div>;
```

**Условия показа:**

- ✅ `touchedFields.email` - пользователь взаимодействовал с полем
- ✅ `!errors.email` - нет ошибок валидации

### Позиционирование

**Для обычного Input:**

```tsx
right - 3; // 12px от правого края
```

**Для PasswordInput (с иконкой глаза):**

```tsx
right - 12; // 48px от правого края (не перекрывает eye icon)
```

### Визуальный feedback

```
❌ Ошибка:   [input с красным border]
✅ Валидно:  [input с зеленой галочкой ✓]
⚪ Untouched: [обычный input]
```

---

## Password Input

### Компонент с show/hide

**Проблема:** Пользователь может ошибиться при вводе пароля (CapsLock, раскладка клавиатуры).

**Решение:** Кнопка "глаз" для показа/скрытия пароля.

### Реализация (`components/ui/password-input.tsx`)

```tsx
'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';

const PasswordInput = forwardRef<HTMLInputElement, ComponentProps<typeof Input>>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={className}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
```

**Ключевые моменты:**

- ✅ `forwardRef` для совместимости с `react-hook-form`
- ✅ `tabIndex={-1}` на кнопке (не участвует в tab navigation)
- ✅ `type="button"` (не submit)
- ✅ Позиционирование: `absolute top-0 right-0`

### Использование

```tsx
<PasswordInput id="password" placeholder="Введіть пароль" {...register('password')} />
```

---

## Autofocus & AutoComplete

### Autofocus на первом поле

**UX принцип:** Пользователь не должен кликать на первое поле - курсор уже там.

```tsx
<Input
  id="email"
  type="email"
  autoFocus // 🔑 Первое поле формы
  {...register('email')}
/>
```

**Где применяем:**

- ✅ Login form - email field
- ✅ Register form - email field
- ✅ Change password - current password field
- ✅ Update name - name field

### AutoComplete OFF

**Проблема:** Браузер автоматически заполняет логин/пароль из других сайтов.

**Решение:**

```tsx
<Input
  type="email"
  autoComplete="off"  // 🔑 Отключаем автозаполнение
  {...register('email')}
/>

<PasswordInput
  autoComplete="new-password"  // Для новых паролей
  {...register('password')}
/>
```

**Значения autoComplete:**

- `off` - полностью отключить
- `new-password` - для новых паролей (регистрация)
- `current-password` - для текущего пароля (логин)

---

## Registration Flow

### Эволюция: от 3 полей к 2

**❌ Было:**

```
- Name (required)
- Email (required)
- Password (required)
- Confirm Password (required)
```

**Проблемы:**

- Слишком много полей = выше abandon rate
- Name - сложно придумать "на ходу"
- Name нельзя изменить → пользователь думает долго

**✅ Стало:**

```
- Email (required)
- Password (required)
- Confirm Password (required)
```

**Name убран из регистрации!**

### Auto-generated Usernames

**Решение:** Генерируем временное имя автоматически.

```typescript
const tempName = `user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
```

**Примеры:**

- `user_lp8x9z_a3f7`
- `user_lp8y1k_b9m2`

**Формат:**

```
user_<timestamp_base36>_<random_4chars>
```

**Преимущества:**

- ✅ Уникальность гарантирована
- ✅ Короткие и читаемые
- ✅ Легко проверить regex: `/^user_[a-z0-9]+_[a-z0-9]+$/i`

---

## Name Change Logic

### One-time change rule

**Правило:** Пользователь может изменить auto-generated имя **ОДИН РАЗ**.

### Проверка системного имени

```typescript
const isSystemGeneratedName = (name: string): boolean => {
  return /^user_[a-z0-9]+_[a-z0-9]+$/i.test(name);
};
```

### UI states

**1. Системное имя (можно изменить):**

```tsx
{
  isSystemName && (
    <div className="rounded-md bg-yellow-50 p-3">
      <p className="text-sm text-yellow-800">
        ⚠️ У вас тимчасове імʼя. Ви можете змінити його ОДИН РАЗ. Обирайте обережно!
      </p>
    </div>
  );
}
```

**2. Пользовательское имя (нельзя изменить):**

```tsx
{
  !isSystemName && (
    <div className="rounded-md bg-gray-50 p-3">
      <p className="text-sm text-gray-600">
        ℹ️ Імʼя вже було змінено і не може бути змінено повторно.
      </p>
      <Input disabled value={currentName} />
    </div>
  );
}
```

### Server-side validation

```typescript
export async function updateNameAction(name: string) {
  const user = await getCurrentUser();

  // Проверяем: текущее имя системное?
  const isSystemName = /^user_[a-z0-9]+_[a-z0-9]+$/i.test(user.name);

  if (!isSystemName) {
    return {
      error: 'Імʼя вже було змінено раніше і не може бути змінено повторно',
    };
  }

  // Update...
}
```

---

## Responsive Design

### Mobile-first approach

**Все формы адаптивны:**

- Mobile: стековые поля (vertical)
- Desktop: можно использовать grid

### Password fields layout

**Было:** 2 поля в ряд (side-by-side)
**Проблема:** Сообщения об ошибках ломают layout

**Стало:** Вертикальный стек

```tsx
<div className="grid gap-4">
  {' '}
  {/* Не grid-cols-2! */}
  <div className="grid gap-2">
    <Label>Пароль</Label>
    <PasswordInput {...register('password')} />
  </div>
  <div className="grid gap-2">
    <Label>Підтвердження пароля</Label>
    <PasswordInput {...register('confirmPassword')} />
  </div>
</div>
```

### Breakpoints

Используем Tailwind breakpoints:

```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

---

## Accessibility

### Semantic HTML

```tsx
<form onSubmit={handleSubmit(onSubmit)}>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</form>
```

**Важно:**

- ✅ `<form>` element (не `<div>`)
- ✅ `<Label htmlFor="id">` связана с input
- ✅ Правильные `type` атрибуты (email, password)

### Keyboard navigation

- ✅ Tab navigation работает
- ✅ Enter на форме = submit
- ✅ Кнопка "глаз" имеет `tabIndex={-1}` (не мешает tab flow)

### ARIA labels

```tsx
<Button aria-label="Показати пароль" onClick={togglePassword}>
  <Eye />
</Button>
```

### Color contrast

- ✅ Red errors: `bg-red-50` + `text-red-800` (достаточный контраст)
- ✅ Green success: `text-green-600` (WCAG AA compliant)

### Screen readers

- Ошибки валидации читаются screen reader'ом
- Labels правильно связаны с inputs

---

## Итоговый Checklist

### Для каждой формы проверь:

- [ ] `mode: 'onSubmit'` в useForm
- [ ] Autofocus на первом поле
- [ ] AutoComplete настроен (off / new-password)
- [ ] Зеленые галочки для валидных полей
- [ ] Красный блок с СПИСКОМ ошибок (без заголовка)
- [ ] Красные borders на проблемных полях
- [ ] Password fields используют PasswordInput
- [ ] Vertical layout для password fields
- [ ] Semantic HTML (form, label[htmlFor])
- [ ] Keyboard navigation работает

---

## Lessons Learned

### Что НЕ работает:

- ❌ Validation `onBlur` - раздражает пользователя
- ❌ Сообщения под каждым полем - ломают layout
- ❌ Заголовки типа "❌ Fix errors" - избыточны
- ❌ Требовать Name при регистрации - снижает conversion
- ❌ Очищать форму при ошибке - ужасный UX

### Что работает:

- ✅ Validation `onSubmit` - стабильная форма
- ✅ Один блок с ошибками наверху - информативно
- ✅ Зеленые галочки - позитивное подкрепление
- ✅ Auto-generated names - zero friction
- ✅ One-time change - баланс гибкости и стабильности
- ✅ Show password toggle - помогает избежать ошибок

---

**Автор:** Cursor AI + Max
**Последнее обновление:** 2025-11-09
