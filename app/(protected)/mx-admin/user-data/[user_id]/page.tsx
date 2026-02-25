import { redirect } from 'next/navigation';

import { UserContactsView } from '@/components/mx-admin/user-contacts-view';
import { UserDataView } from '@/components/mx-admin/user-data-view';
import { UserDataTabs } from '@/components/mx-admin/user-data/user-data-tabs';
import { UserGeneralMenu } from '@/components/mx-admin/user-data/user-general-menu';
import { UserMenu } from '@/components/mx-admin/user-data/user-menu';
import { UserOffices } from '@/components/mx-admin/user-data/user-offices';
import { UserPermissions } from '@/components/mx-admin/user-data/user-permissions';
import { getUserFullDataByUserId } from '@/data/mx-data/user-data';
import { getCurrentUser } from '@/lib/auth/auth-server';
import type { ExtendedUser } from '@/lib/auth/auth-types';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{
    user_id: string;
  }>;
}

export default async function Page({ params }: Props) {
  const { user_id } = await params;

  // Перевіряємо авторизацію (додаткова перевірка для admin)
  const user = (await getCurrentUser()) as ExtendedUser | null;

  if (!user) {
    redirect('/login');
  }

  // Перевірка ролі адміністратора
  if (user.role !== 'admin') {
    redirect('/mx-job');
  }

  // Отримуємо дані користувача
  const userData = await getUserFullDataByUserId(user_id);

  if (!userData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Користувач не знайдено</h1>
          <p className="text-muted-foreground">Користувач з ID {user_id} не знайдено в системі</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Дані користувача</h1>
        <p className="text-muted-foreground">Перегляд даних користувача {userData.name}</p>
      </div>

      {/* Вкладки з card-based навігацією */}
      <UserDataTabs
        userDataContent={
          <>
            <UserDataView user={userData} />
            <div className="mt-6">
              <UserContactsView userId={user_id} />
            </div>
          </>
        }
        userOfficesContent={<UserOffices userId={user_id} />}
        userMenuContent={<UserMenu userId={user_id} />}
        userGeneralMenuContent={<UserGeneralMenu userId={user_id} />}
        userPermissionsContent={<UserPermissions userId={user_id} />}
      />
    </div>
  );
}
