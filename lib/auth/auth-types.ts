/**
 * Типи для Better Auth
 * Конвертація з БД формату (snake_case) в клієнтський (camelCase)
 */

/**
 * Розширений тип користувача для роботи в додатку
 *
 * Конвертується з БД типу `Users` (snake_case) в клієнтський формат (camelCase)
 * для зручності роботи в React компонентах
 *
 * Використовується в:
 * - UserContext (lib/user-context.tsx) - Context API для Client Components
 * - Protected Layout (app/(protected)/layout.tsx) - SSR перевірка авторизації
 * - App Sidebar (components/app-sidebar.tsx) - відображення інфо користувача
 * - Admin Page (app/(protected)/mx-admin/page.tsx) - адмін-панель
 */
export interface ExtendedUser {
  /** UUID користувача */
  id: string;
  /** Імʼя користувача (може бути змінено один раз) */
  name: string;
  /** Email (унікальний) */
  email: string;
  /** Чи підтверджено email */
  emailVerified: boolean;
  /** URL аватара (опційно) */
  image?: string | null;
  /** Роль: 'user' | 'admin' */
  role: 'user' | 'admin';
  /** Чи заблокований користувач */
  isBanned: boolean;
  /** Чи увімкнено двохфакторну аутентифікацію */
  twoFactorEnabled: boolean;
  /** Дата створення */
  createdAt: Date;
  /** Дата останнього оновлення */
  updatedAt: Date;
}
