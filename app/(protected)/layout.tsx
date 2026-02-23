import { redirect } from 'next/navigation';

import { AppSidebar } from '@/components/app-sidebar';
import { DynamicBreadcrumb } from '@/components/dynamic-breadcrumb';
import { MenuProvider } from '@/components/menu-provider';
import { PermissionsProvider } from '@/components/permissions-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { getUserById } from '@/data/auth/users';
import { isOnboardingComplete } from '@/data/mx-data/onboarding';
import { getMenuAppSupport } from '@/data/mx-dic/menu-admin';
import { getUserOfficesUserViewByUserId } from '@/data/mx-system/user-offices';
import { getCurrentUser } from '@/lib/auth/auth-server';
import type { ExtendedUser } from '@/lib/auth/auth-types';
import { UserProvider } from '@/lib/auth/user-context';
import { buildUserMenu } from '@/lib/menu/build-user-menu';
import { getUserPermissions } from '@/lib/permissions/get-user-permissions';

export const dynamic = 'force-dynamic';

/**
 * Layout для захищених сторінок із перевіркою сесії.
 */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // Перевіряємо авторизацію
  const sessionUser = (await getCurrentUser()) as ExtendedUser | null;

  if (!sessionUser) {
    redirect('/login');
  }

  // Отримуємо актуальні дані користувача з БД (включаючи image)
  // Better Auth кешує дані в сесії, тому для image читаємо напряму з БД
  const dbUser = await getUserById(sessionUser.id);
  if (!dbUser) {
    redirect('/login');
  }

  // Об'єднуємо дані з сесії та БД
  // Використовуємо актуальне значення image з БД (Better Auth кешує це поле)
  const user: ExtendedUser = {
    ...sessionUser,
    image: dbUser.image || null, // Використовуємо актуальне значення з БД
  };

  // Перевірка онбордингу: перенаправляємо на /onboarding якщо дані не заповнені
  // Сторінка /onboarding живе в окремій route group (onboarding), тому сюди не потрапляє
  // Адміністратори пропускають онбординг
  if (user.role !== 'admin') {
    const onboardingDone = await isOnboardingComplete(user.id);
    if (!onboardingDone) {
      redirect('/onboarding');
    }
  }

  // Завантажуємо меню користувача, повноваження та меню підтримки з БД
  const [userMenu, userPermissions, appSupportMenu, userOffices] = await Promise.all([
    buildUserMenu(user.id),
    getUserPermissions(user.id),
    getMenuAppSupport(),
    getUserOfficesUserViewByUserId(user.id),
  ]);

  // Фільтруємо тільки активні пункти меню підтримки
  const activeAppSupport = appSupportMenu
    .filter((item) => item.is_active)
    .map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      icon: item.icon,
    }));

  // Передаємо в MenuProvider тільки користувацьке меню
  // Адмінське меню буде додано в AppSidebar для адміністраторів
  const navSections = userMenu.sections.map((section) => ({
    ...section,
    isActive: section.isActive ?? true,
    items: section.items ?? [],
  }));
  const navItems = userMenu.items;
  const navGeneralItems = userMenu.generalItems;

  return (
    <UserProvider user={user}>
      <MenuProvider
        initialSections={navSections}
        initialItems={navItems}
        initialGeneralItems={navGeneralItems}
      >
        <PermissionsProvider initialPermissions={userPermissions}>
          <SidebarProvider>
            <AppSidebar user={user} appSupportMenu={activeAppSupport} userOffices={userOffices} />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex w-full items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <DynamicBreadcrumb appSupportMenu={activeAppSupport} />
                  <div className="ml-auto">
                    <ThemeToggle />
                  </div>
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
            </SidebarInset>
          </SidebarProvider>
        </PermissionsProvider>
      </MenuProvider>
    </UserProvider>
  );
}
