# Концепція дизайну профілю користувача

**Версія:** 2.0
**Дата останнього оновлення:** 2025-01-12
**Статус:** ✅ Повністю реалізовано і протестовано

---

## 🎨 Дизайн-система

Створено unified components для забезпечення єдиного стилю та UX в усіх блоках профілю.

### Компоненти дизайн-системи

1. **ProfileAlert** - єдині alert блоки (5 варіантів)
2. **ProfileSection** - обгортка для секцій з іконками
3. **ProfileInfoRow** - рядок інформації (key-value)
4. **ProfileBadge** - badges для статусів/ролей (5 варіантів)
5. **Item** (shadcn UI) - універсальні списки з іконками, заголовками та діями

---

## 📋 Приклади використання

### 1. ProfileAlert - Інформаційні блоки

#### Варіанти:

- `info` - синій (інформація)
- `success` - зелений (успіх)
- `warning` - жовтий (попередження)
- `error` - червоний (помилка)
- `note` - сірий (примітка)

```tsx
// Попередження про одноразову зміну імені
<ProfileAlert variant="warning" title="⚠️ Важливо!">
  <p>
    Ви можете змінити автоматично згенероване імʼя <strong>тільки один раз</strong>.
    Добре обдумайте свій вибір, адже після збереження змінити імʼя повторно буде неможливо.
  </p>
</ProfileAlert>

// Успішна активація 2FA
<ProfileAlert variant="success">
  ✓ Двохфакторна аутентифікація активна
</ProfileAlert>

// Інформація про Passkey
<ProfileAlert variant="info" title="Що таке Passkey?">
  <p>
    Це найбезпечніший спосіб входу без пароля. Використовує біометрію вашого пристрою.
  </p>
</ProfileAlert>

// Примітка про обмеження
<ProfileAlert variant="note">
  <p>
    <strong>Примітка:</strong> Email не можна змінити. Для зміни зверніться до адміністратора.
  </p>
</ProfileAlert>

// Помилка
<ProfileAlert variant="error">
  Помилка оновлення даних. Спробуйте ще раз.
</ProfileAlert>
```

### 2. ProfileSection - Обгортка секцій

```tsx
// Базове використання
<ProfileSection
  title="Зміна пароля"
  description="Оновіть пароль для свого облікового запису"
>
  <ChangePasswordForm />
</ProfileSection>

// З іконкою
<ProfileSection
  title="Додати Passkey"
  description="Швидкий та безпечний вхід без пароля"
  icon={<Fingerprint className="size-5" />}
>
  <PasskeySetup />
</ProfileSection>
```

### 3. ProfileInfoRow - Відображення інформації

```tsx
// Простий текст
<ProfileInfoRow label="Імʼя" value={user.name} />
<ProfileInfoRow label="Email" value={user.email} />

// З badge
<ProfileInfoRow
  label="Роль"
  value={
    <ProfileBadge variant={user.role === 'admin' ? 'info' : 'default'}>
      {user.role === 'admin' ? 'Адміністратор' : 'Користувач'}
    </ProfileBadge>
  }
/>

<ProfileInfoRow
  label="Email підтверджено"
  value={
    <ProfileBadge variant={user.emailVerified ? 'success' : 'warning'}>
      {user.emailVerified ? '✓ Підтверджено' : 'Не підтверджено'}
    </ProfileBadge>
  }
/>
```

### 4. ProfileBadge - Статуси

```tsx
<ProfileBadge variant="success">✓ Підтверджено</ProfileBadge>
<ProfileBadge variant="warning">Не підтверджено</ProfileBadge>
<ProfileBadge variant="info">Адміністратор</ProfileBadge>
<ProfileBadge variant="error">Заблокований</ProfileBadge>
<ProfileBadge variant="default">Користувач</ProfileBadge>
```

### 5. Item - Універсальні списки (shadcn UI)

**Компонент Item** з shadcn UI використовується для відображення списків з іконками, заголовками, описами та діями.

#### Де використовується:

- **Контактна інформація** - список контактів користувача
- **Мої Passkeys** - список збережених passkeys

#### Структура компонента:

```tsx
<Item variant="outline">
  {/* Іконка */}
  <ItemMedia variant="icon">
    <IconComponent className="size-4" />
  </ItemMedia>

  {/* Контент */}
  <ItemContent>
    <ItemTitle>Заголовок</ItemTitle>
    <ItemDescription>Опис або додаткова інформація</ItemDescription>
  </ItemContent>

  {/* Дії (кнопки) */}
  <ItemActions>
    <Button variant="ghost" size="icon">
      <Edit2 className="size-4" />
    </Button>
    <Button variant="ghost" size="icon">
      <Trash2 className="size-4" />
    </Button>
  </ItemActions>
</Item>
```

#### Приклад - Контакт:

```tsx
<Item variant="outline">
  <ItemMedia variant="icon">
    <Phone className="size-4" />
  </ItemMedia>
  <ItemContent>
    <ItemTitle>Мобільний телефон</ItemTitle>
    <ItemDescription>+380501234567</ItemDescription>
  </ItemContent>
  <ItemActions>
    <Button variant="ghost" size="icon">
      <Heart className="size-4" />
    </Button>
    <Button variant="ghost" size="icon">
      <Trash2 className="size-4" />
    </Button>
  </ItemActions>
</Item>
```

#### Приклад - Passkey:

```tsx
<Item variant="outline">
  <ItemMedia variant="icon">
    <Smartphone className="size-4" />
  </ItemMedia>
  <ItemContent>
    <ItemTitle>iPhone 15 Pro</ItemTitle>
    <ItemDescription>Пристрій (синхронізовано) • Додано 3 дні тому</ItemDescription>
  </ItemContent>
  <ItemActions>
    <Button variant="ghost" size="icon">
      <Edit2 className="size-4" />
    </Button>
    <Button variant="ghost" size="icon">
      <Trash2 className="size-4" />
    </Button>
  </ItemActions>
</Item>
```

#### Централізоване управління іконками:

Всі іконки зберігаються в `lib/icon/get-icon.ts`:

```tsx
// Іконки контактів
export const contactIconMap: Record<string, ComponentType<{ className?: string }>> = {
  phone: Phone,
  email: Mail,
  telegram: Send,
  instagram: Instagram,
  // ...
};

// Іконки Passkey
export const passkeyIconMap = {
  multiDeviceSynced: Smartphone, // 📱 Синхронізований пристрій
  multiDeviceLocal: Laptop, // 💻 Локальний пристрій
  singleDevice: Key, // 🔑 Фізичний ключ
  unknown: ShieldCheck, // 🔐 Невідомий тип
};

// Функція для отримання іконки Passkey
export function getPasskeyIcon(deviceType: string, backedUp?: boolean) {
  if (deviceType === 'multiDevice') {
    return backedUp ? passkeyIconMap.multiDeviceSynced : passkeyIconMap.multiDeviceLocal;
  }
  if (deviceType === 'singleDevice') {
    return passkeyIconMap.singleDevice;
  }
  return passkeyIconMap.unknown;
}
```

#### Переваги Item компонента:

- ✅ Єдиний стиль для всіх списків
- ✅ Консистентний layout (іконка, контент, дії)
- ✅ Векторні іконки з Lucide React (краща підтримка кросплатформенності)
- ✅ Централізоване управління іконками
- ✅ Покращена доступність (семантична структура)
- ✅ Адаптивний дизайн (mobile-first)
- ✅ Підтримка різних варіантів (`outline`, `default`, `muted`)

**Посилання:** [shadcn UI Item Documentation](https://ui.shadcn.com/docs/components/item)

---

## 🗂️ Структура з Tabs (3 зони)

### Зона 1: "Огляд" (Overview)

**Мета:** Швидкий перегляд всієї інформації про користувача

```tsx
<ProfileSection title="Основна інформація" description="Дані вашого облікового запису">
  {/* Аватар */}
  <div className="mb-4 flex items-center gap-4">
    <div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-full">
      <User className="h-8 w-8" />
    </div>
    <div>
      <h3 className="text-lg font-medium">{user.name}</h3>
      <p className="text-muted-foreground text-sm">{user.email}</p>
    </div>
  </div>

  {/* Інформаційні поля */}
  <div className="space-y-3 border-t pt-4">
    <ProfileInfoRow label="Імʼя" value={user.name} />
    <ProfileInfoRow label="Email" value={user.email} />
    <ProfileInfoRow label="Повне імʼя" value={fullName || 'Не вказано'} />
    <ProfileInfoRow label="Основний контакт" value={mainContact || 'Не вказано'} />

    <ProfileInfoRow
      label="Роль"
      value={
        <ProfileBadge variant={user.role === 'admin' ? 'info' : 'default'}>
          {user.role === 'admin' ? 'Адміністратор' : 'Користувач'}
        </ProfileBadge>
      }
    />

    <ProfileInfoRow
      label="Email підтверджено"
      value={
        <ProfileBadge variant={user.emailVerified ? 'success' : 'warning'}>
          {user.emailVerified ? '✓ Підтверджено' : 'Не підтверджено'}
        </ProfileBadge>
      }
    />

    <ProfileInfoRow
      label="2FA"
      value={
        <ProfileBadge variant={twoFactorEnabled ? 'success' : 'default'}>
          {twoFactorEnabled ? '✓ Увімкнено' : 'Вимкнено'}
        </ProfileBadge>
      }
    />

    <ProfileInfoRow
      label="Passkeys"
      value={
        <ProfileBadge variant={passkeys.length > 0 ? 'success' : 'default'}>
          {passkeys.length > 0 ? `${passkeys.length} активних` : 'Немає'}
        </ProfileBadge>
      }
    />
  </div>

  <ProfileAlert variant="note" className="mt-4">
    <p>
      <strong>Примітка:</strong> Email не можна змінити. Для зміни зверніться до адміністратора.
    </p>
  </ProfileAlert>
</ProfileSection>
```

### Зона 2: "Персональні дані"

```tsx
// 1) Блок зміни імені користувача
<ProfileSection
  title="Імʼя користувача"
  description="Оновіть своє імʼя або псевдонім"
>
  {canChangeName ? (
    <>
      <ProfileAlert variant="warning" title="⚠️ Важливо!">
        <p>
          Ви можете змінити автоматично згенероване імʼя <strong>тільки один раз</strong>.
        </p>
      </ProfileAlert>
      <UpdateNameForm currentName={user.name} />
    </>
  ) : (
    <>
      <ProfileAlert variant="info" title="Імʼя не можна змінити">
        <p>
          Ви вже змінили своє імʼя з автоматично згенерованого. З міркувань безпеки,
          подальша зміна імені заборонена.
        </p>
        <p className="mt-2">Якщо потрібно змінити імʼя, зверніться до адміністратора.</p>
      </ProfileAlert>
      {/* Disabled input */}
    </>
  )}
</ProfileSection>

// 2) Блок персональних даних (новий)
<ProfileSection
  title="Персональні дані"
  description="Ваше повне імʼя та прізвище"
>
  <PersonalDataForm />
</ProfileSection>

// 3) Блок контактних даних (новий)
<ProfileSection
  title="Контактні дані"
  description="Ваші контактні телефони та email адреси"
>
  <ContactDataForm />
</ProfileSection>
```

### Зона 3: "Безпека"

```tsx
// 1) Зміна пароля
<ProfileSection
  title="Зміна пароля"
  description="Оновіть пароль для свого облікового запису"
>
  <ChangePasswordForm />
</ProfileSection>

// 2) 2FA
<ProfileSection
  title="Двохфакторна аутентифікація"
  description="Додайте додатковий рівень безпеки до вашого акаунту за допомогою TOTP"
>
  {twoFactorEnabled ? (
    <>
      <ProfileAlert variant="success">
        ✓ Двохфакторна аутентифікація активна
      </ProfileAlert>
      {/* Кнопки управління */}
    </>
  ) : (
    <TwoFactorSetupForm />
  )}
</ProfileSection>

// 3) Passkey
<ProfileSection
  title="Додати Passkey"
  description="Швидкий та безпечний вхід без пароля"
  icon={<Fingerprint className="size-5" />}
>
  <ProfileAlert variant="info" title="Що таке Passkey?">
    <p>
      Це найбезпечніший спосіб входу без пароля. Використовує біометрію вашого пристрою.
    </p>
  </ProfileAlert>
  <PasskeySetup />
</ProfileSection>

// 4) Список Passkeys
{passkeys.length > 0 && (
  <ProfileSection
    title="Мої Passkeys"
    description="Керуйте вашими збереженими passkeys"
  >
    <PasskeyList />
  </ProfileSection>
)}
```

---

## 🎯 Ключові переваги нової системи

### 1. Єдиний стиль

- Всі alert блоки використовують один компонент з різними варіантами
- Консистентні кольори, іконки, відступи
- Єдина типографіка

### 2. Покращена читабельність

- Чітка ієрархія інформації
- Зрозумілі візуальні групи
- Консистентні badges для статусів

### 3. Легка підтримка

- Зміни в одному місці відображаються скрізь
- Не потрібно копіювати стилі між компонентами
- TypeScript типізація для безпеки

### 4. Accessibility

- Семантичні HTML елементи
- Іконки з описами
- Правильні кольорові контрасти

### 5. Responsive Design

- Mobile-first підхід
- Адаптивні grid layouts
- Flexible spacing

---

## 📦 Експорт

### Компоненти профілю

Всі компоненти профілю експортуються з одного місця:

```tsx
import {
  ProfileAlert,
  ProfileSection,
  ProfileInfoRow,
  ProfileBadge,
  type ProfileAlertVariant,
  type ProfileBadgeVariant,
} from '@/components/profile/shared';
```

### Item компонент (shadcn UI)

```tsx
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/ui/item';
```

### Іконки

```tsx
// Іконки контактів
import { contactIconMap } from '@/lib/icon/get-icon';

// Іконки та функція для Passkey
import { passkeyIconMap, getPasskeyIcon } from '@/lib/icon/get-icon';
```

---

## 6. InputGroup - Єдиний стандарт для всіх форм

**Дата впровадження:** 13 листопада 2025
**Статус:** ✅ Впроваджено у всіх формах проекту

### Про компонент

`InputGroup` від shadcn UI - це консистентний API для роботи з input полями, що забезпечує:

- Єдиний стиль для всіх форм
- Автоматичне управління focus states
- Вбудовану підтримку accessibility
- Простоту використання з React Hook Form

### Компоненти InputGroup

- **InputGroup** - базовий контейнер
- **InputGroupInput** - замість `<Input />`
- **InputGroupTextarea** - замість `<Textarea />`
- **InputGroupAddon** - wrapper для іконок, кнопок, тексту
- **InputGroupButton** - кнопки всередині input (показати пароль, копіювати, тощо)
- **InputGroupText** - статичний текст (префікси, суфікси, підказки)

### Позиціонування addon

```tsx
// Для Input — використовуй inline-*
<InputGroup>
  <InputGroupInput />
  <InputGroupAddon align="inline-start">🔍</InputGroupAddon> {/* ліворуч */}
  <InputGroupAddon align="inline-end">✓</InputGroupAddon>     {/* праворуч */}
</InputGroup>

// Для Textarea — використовуй block-*
<InputGroup>
  <InputGroupTextarea />
  <InputGroupAddon align="block-start">  {/* зверху */}
    <InputGroupText>Заголовок</InputGroupText>
  </InputGroupAddon>
  <InputGroupAddon align="block-end">    {/* знизу */}
    <InputGroupText>120 символів</InputGroupText>
  </InputGroupAddon>
</InputGroup>
```

### Приклад: Поле з валідацією

```tsx
<InputGroup>
  <InputGroupInput type="text" placeholder="Шевченко Тарас Григорович" {...register('full_name')} />
  {/* Зелена галочка при валідних даних */}
  {isValid && (
    <InputGroupAddon align="inline-end">
      <CheckCircle2 className="size-5 text-green-600" />
    </InputGroupAddon>
  )}
  {/* Правила валідації знизу */}
  <InputGroupAddon align="block-end">
    <InputGroupText className="text-muted-foreground text-xs">
      Мінімум 2 символи, українська кирилиця
    </InputGroupText>
  </InputGroupAddon>
</InputGroup>
```

### Приклад: Поле паролю з кнопкою

```tsx
const [showPassword, setShowPassword] = useState(false);

<InputGroup>
  <InputGroupInput
    type={showPassword ? 'text' : 'password'}
    placeholder="Введіть пароль"
    {...register('password')}
  />
  <InputGroupAddon align="inline-end">
    {/* Зелена галочка */}
    {isPasswordValid && <CheckCircle2 className="size-5 text-green-600" />}

    {/* Кнопка показати/сховати */}
    <InputGroupButton
      size="icon-xs"
      variant="ghost"
      onClick={() => setShowPassword(!showPassword)}
      type="button"
      aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
    >
      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </InputGroupButton>
  </InputGroupAddon>

  {/* Правила знизу */}
  <InputGroupAddon align="block-end">
    <InputGroupText className="text-muted-foreground text-xs">Мінімум 8 символів</InputGroupText>
  </InputGroupAddon>
</InputGroup>;
```

### Інтеграція з React Hook Form

```tsx
<InputGroupInput
  id="email"
  type="email"
  placeholder="m@example.com"
  {...register('email')} // ✅ Працює без проблем
/>
```

### Переваги

1. **Консистентність** - єдиний стиль у всіх формах проекту
2. **Accessibility** - вбудована підтримка aria-атрибутів та keyboard navigation
3. **DX** - простий та зрозумілий API
4. **Responsive** - адаптивний з коробки
5. **Extensible** - легко розширювати новими варіантами

### Відрефакторені форми

**Профіль (6 форм):**

- ✅ `edit-full-name-form.tsx` - поле імені з валідацією
- ✅ `update-name-form.tsx` - поле username з валідацією
- ✅ `add-contact-form.tsx` - поле контакту з валідацією
- ✅ `personal-data-form.tsx` - 2 поля (ім'я + контакт)
- ✅ `change-password-form.tsx` - 3 поля паролів
- ✅ `two-factor-setup.tsx` - поле паролю

**Аутентифікація (5 форм):**

- ✅ `login-form.tsx` - email + password
- ✅ `signup-form.tsx` - email + 2 паролі
- ✅ `forgot-password/page.tsx` - email
- ✅ `reset-password/page.tsx` - 2 паролі
- ✅ `verify-email/page.tsx` - ❌ не потребує (інформаційна сторінка)

**Всього:** 10 форм повністю відрефакторено

---

## 🚀 Наступні кроки

1. ✅ Створити дизайн-систему
2. ✅ Додати Tabs компонент
3. ✅ Додати Item компонент для списків
4. ✅ Централізоване управління іконками (lib/icon/get-icon.ts)
5. ✅ Переробити Passkeys на Item компонент
6. ✅ Переробити Контакти на Item компонент
7. ✅ Впровадити InputGroup у всі форми проекту
8. 🔄 Рефакторинг сторінки профілю (RSC)
9. 🔄 Переробити існуючі блоки з новим дизайном
10. 🔄 Створити нові блоки (персональні та контактні дані)
11. 🔄 Тестування
12. 🔄 Документація (після тесту)
