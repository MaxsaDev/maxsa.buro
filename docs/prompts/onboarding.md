# Промпт: Реалізація онбордингу для нових користувачів

## Контекст задачі

Після реєстрації (email+password або Google) і підтвердження email, користувач потрапляє на Dashboard. Але адміністратор може надати повний доступ лише тим користувачам, які заповнили персональні дані: **повне імʼя** та **мінімум один контакт**. Користувач про це не знає — потрібна автоматична сторінка онбордингу.

## Вимоги

1. Новий користувач (role !== 'admin') без заповнених персональних даних автоматично перенаправляється на `/onboarding`
2. Сторінка онбордингу — покроковий візард: Крок 1 (імʼя) → Крок 2 (контакти) → Крок 3 (успіх + redirect на dashboard)
3. Після успішного збереження — redirect на `/dashboard`
4. Якщо онбординг вже завершено і користувач зайшов на `/onboarding` — redirect на `/dashboard`
5. Адміністратори пропускають онбординг

## Архітектура (ВАЖЛИВО — Next.js 16)

### Принцип розділення відповідальності

- **`proxy.ts`** — ТІЛЬКИ routing (перевірка cookie, redirect неавторизованих). Жодної бізнес-логіки, жодних запитів до БД. Це не middleware в класичному розумінні.
- **Server Layout Guards** (layout.tsx) — авторизація, перевірка онбордингу, завантаження даних. Вся бізнес-логіка тут.
- **НЕ використовувати `middleware.ts`** — в Next.js 16 цей файл deprecated, замінений на `proxy.ts`
- **НЕ використовувати `headers()` для отримання pathname в layout** — це хак, Server Layout не повинен знати свій URL

### Route Groups — ключ до рішення

Проблема: `(protected)/layout.tsx` робить redirect на `/onboarding`, але якщо `/onboarding` всередині `(protected)` — буде нескінченний цикл redirect. Layout не знає поточний pathname.

**Рішення**: Винести `/onboarding` в окрему route group `(onboarding)` зі своїм легким layout:

```
app/
  (auth)/              — публічні auth сторінки (login, register, etc.)
  (protected)/         — захищені сторінки з sidebar/меню
    layout.tsx         — перевірка auth + онбординг → redirect /onboarding
    dashboard/
    profile/
    mx-admin/
  (onboarding)/        — НОВА route group для онбордингу
    layout.tsx         — перевірка auth + зворотний guard (якщо вже є дані → /dashboard)
    onboarding/
      page.tsx
```

**Чому це працює без хаків:**

- `(protected)/layout.tsx` завжди може безпечно redirect на `/onboarding` — бо `/onboarding` НЕ всередині `(protected)`, циклу не буде
- `(onboarding)/layout.tsx` має зворотний guard — якщо онбординг вже пройдено, redirect на `/dashboard`
- Кожен layout знає тільки свою відповідальність, не потрібно знати pathname

## Покрокова реалізація

### Крок 1: Data-функція перевірки онбордингу

**Файл: `data/mx-data/onboarding.ts`**

SQL-функція що перевіряє наявність ОБОХ записів:

1. `mx_data.user_data` — повне імʼя (таблиця існує)
2. `mx_data.user_contact` — хоча б один контакт (таблиця існує)

```typescript
import { pool } from '@/lib/db';

export async function isOnboardingComplete(userId: string): Promise<boolean> {
  try {
    const result = await pool.query<{ is_complete: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM mx_data.user_data ud
        WHERE ud.user_id = $1
        AND EXISTS (
          SELECT 1 FROM mx_data.user_contact uc
          WHERE uc.user_id = $1
        )
      ) AS is_complete`,
      [userId]
    );
    return result.rows[0]?.is_complete ?? false;
  } catch (error) {
    console.error('[isOnboardingComplete] Помилка:', error);
    // У разі помилки — не блокуємо користувача
    return true;
  }
}
```

**ВАЖЛИВО**: У catch повертаємо `true`, щоб помилка БД не заблокувала доступ.

### Крок 2: Додати `/onboarding` в protected routes в `proxy.ts`

В масив `protectedRoutes` додати `'/onboarding'` — щоб proxy перевіряв наявність session cookie:

```typescript
const protectedRoutes = ['/dashboard', '/profile', '/mx-admin', '/onboarding'];
```

Більше нічого в proxy НЕ змінювати.

### Крок 3: Додати перевірку онбордингу в `(protected)/layout.tsx`

Після створення об'єкта `user` (рядки ~39-44), ПЕРЕД завантаженням меню, додати:

```typescript
import { isOnboardingComplete } from '@/data/mx-data/onboarding';

// ... (після створення user)

// Перевірка онбордингу
// Сторінка /onboarding живе в окремій route group (onboarding), тому сюди не потрапляє
// Адміністратори пропускають онбординг
if (user.role !== 'admin') {
  const onboardingDone = await isOnboardingComplete(user.id);
  if (!onboardingDone) {
    redirect('/onboarding');
  }
}

// Завантажуємо меню користувача...
```

**Логіка**: якщо онбординг не пройдено — redirect ПЕРЕД завантаженням меню/permissions (економія запитів до БД).

### Крок 4: Створити route group `(onboarding)` з layout

**Файл: `app/(onboarding)/layout.tsx`**

Легкий layout — тільки auth + UserProvider, БЕЗ sidebar/меню/permissions:

```typescript
import { redirect } from 'next/navigation';
import { getUserById } from '@/data/auth/users';
import { isOnboardingComplete } from '@/data/mx-data/onboarding';
import { getCurrentUser } from '@/lib/auth/auth-server';
import type { ExtendedUser } from '@/lib/auth/auth-types';
import { UserProvider } from '@/lib/auth/user-context';

export const dynamic = 'force-dynamic';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = (await getCurrentUser()) as ExtendedUser | null;
  if (!sessionUser) {
    redirect('/login');
  }

  const dbUser = await getUserById(sessionUser.id);
  if (!dbUser) {
    redirect('/login');
  }

  const user: ExtendedUser = {
    ...sessionUser,
    image: dbUser.image || null,
  };

  // Зворотний guard: якщо онбординг завершено — на dashboard
  const onboardingDone = await isOnboardingComplete(user.id);
  if (onboardingDone) {
    redirect('/dashboard');
  }

  return <UserProvider user={user}>{children}</UserProvider>;
}
```

**Зворотний guard** — запобігає повторному проходженню онбордингу.

### Крок 5: Створити page

**Файл: `app/(onboarding)/onboarding/page.tsx`**

```typescript
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
```

### Крок 6: Створити Client Component візард

**Файл: `components/onboarding/onboarding-wizard.tsx`**

Client Component (`'use client'`) з покроковим візардом.

**Залежності які вже є в проекті:**

- `@/actions/profile/get-contact-types` — `getContactTypesAction()` повертає `DicContactType[]`
- `@/actions/profile/save-personal-data` — `savePersonalDataAction(payload)` зберігає дані
- `@/lib/auth/user-context` — `useUser()` повертає поточного користувача
- `@/lib/regexp` — `UkrFullName` regex для валідації українського імені
- `@/schemas/profile/personal-data-schema` — `validateContactValue(value, typeCode)` валідує контакт
- Shadcn UI: Button, Card, CardContent, InputGroup, InputGroupAddon, InputGroupInput, Item, ItemActions, ItemContent, ItemDescription, ItemMedia, Label, ToggleGroup, ToggleGroupItem, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger

**Структура стану:**

```typescript
// Поточний крок (1, 2, 3)
const [step, setStep] = useState(1);

// Крок 1: Повне імʼя
const [fullName, setFullName] = useState('');
const [nameError, setNameError] = useState<string | null>(null);
const [nameTouched, setNameTouched] = useState(false);

// Крок 2: Контакти
const [contactTypes, setContactTypes] = useState<DicContactType[]>([]); // завантажуються через useEffect
const [contacts, setContacts] = useState<LocalContact[]>([]); // додані контакти
const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]); // вибрані типи в ToggleGroup
const [contactValue, setContactValue] = useState(''); // поточне значення input
const [contactError, setContactError] = useState<string | null>(null);

// Крок 3: Збереження
const [isSubmitting, setIsSubmitting] = useState(false);
```

**Payload для savePersonalDataAction:**

```typescript
const payload = {
  full_name: fullName,
  contacts: contacts.map((contact) => ({
    contact_type_ids: [contact.contact_type_id], // масив з одного ID
    contact_value: contact.contact_value,
  })),
};
```

**Іконки контактів:**

```typescript
const CONTACT_ICONS: Record<string, React.ElementType> = {
  phone: Phone, // lucide-react
  email: Mail,
  telegram: Send,
  viber: MessageSquare,
  whatsapp: MessageCircle,
  facebook: Facebook,
  messenger: MessageCircleMore,
  instagram: Instagram,
};
```

**Кроки візарду:**

1. **Крок 1 (Імʼя)**: Привітання з іменем/email користувача, InputGroup з валідацією UkrFullName, зелена галочка при валідному імені, кнопка "Продовжити", Enter для переходу
2. **Крок 2 (Контакти)**: ToggleGroup для вибору типу, InputGroup + кнопка "+" для додавання, список доданих контактів з видаленням, Enter для додавання, кнопки "Назад" та "Завершити"
3. **Крок 3 (Успіх)**: Повідомлення про успіх, прогрес-бар анімація, `router.push('/dashboard')` через 2 секунди. При помилці — повернення на крок 2

**UI патерни:**

- Індикатор прогресу зверху (3 кружечки з номерами, з'єднані лініями)
- Card з overflow-hidden для анімацій
- `animate-in fade-in slide-in-from-right-4` для переходів між кроками (class із tailwindcss-animate)
- Тематичні кольори: `bg-primary/10` для кроку 1, `bg-info/10` для кроку 2, `bg-success/10` для кроку 3

## Антипатерни — чого НЕ робити

1. **НЕ створювати `middleware.ts`** — deprecated в Next.js 16
2. **НЕ використовувати `headers()` в layout** для отримання pathname — це хак
3. **НЕ ставити онбординг всередину `(protected)` route group** — буде цикл redirect
4. **НЕ ставити бізнес-логіку в `proxy.ts`** — тільки routing (cookie check, redirect)
5. **НЕ перевіряти auth в proxy** (крім наявності cookie) — повна перевірка в layout
6. **НЕ блокувати користувача при помилці БД** — `catch` повертає `true`

## Перевірка

Після реалізації запустити:

```bash
npm run type-check   # TypeScript
npm run build        # Production build
```

У виводі build повинно бути:

- `ƒ /onboarding` — dynamic route
- `ƒ Proxy (Middleware)` — proxy працює
- Жодних помилок типізації

## Тестування потоку

1. Зареєструвати нового користувача
2. Підтвердити email
3. При вході — автоматичний redirect на `/onboarding` (без sidebar)
4. Заповнити імʼя → перейти далі → додати контакт → завершити
5. Redirect на `/dashboard` (з sidebar, меню, etc.)
6. Повторний вхід на `/onboarding` → redirect назад на `/dashboard`
