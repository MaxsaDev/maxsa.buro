import { PermissionsTabsWrapper } from '@/components/mx-admin/permissions/permissions-tabs-wrapper';
import {
  getUserPermissionsCategories,
  getUserPermissionsItems,
} from '@/data/mx-dic/user-permissions';

export default async function Page() {
  const [categories, items] = await Promise.all([
    getUserPermissionsCategories(),
    getUserPermissionsItems(),
  ]);

  return (
    <div className="space-y-6">
      <PermissionsTabsWrapper categories={categories} items={items} />
    </div>
  );
}
