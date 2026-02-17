import { redirect } from 'next/navigation';

import { getUserById } from '@/data/auth/users';
import { isOnboardingComplete } from '@/data/mx-data/onboarding';
import { getCurrentUser } from '@/lib/auth/auth-server';
import type { ExtendedUser } from '@/lib/auth/auth-types';
import { UserProvider } from '@/lib/auth/user-context';

export const dynamic = 'force-dynamic';

/**
 * Layout для сторінок онбордингу
 * Легкий layout без sidebar/меню — тільки авторизація + UserProvider
 * Якщо онбординг вже завершено — перенаправляємо на dashboard
 */
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

  // Якщо онбординг вже завершено — перенаправляємо на dashboard
  const onboardingDone = await isOnboardingComplete(user.id);
  if (onboardingDone) {
    redirect('/dashboard');
  }

  return <UserProvider user={user}>{children}</UserProvider>;
}
