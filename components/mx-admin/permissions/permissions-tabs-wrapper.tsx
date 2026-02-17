import { PermissionsCategoriesTab } from './permissions-categories-tab';

import type {
  UserPermissionsCategory,
  UserPermissionsItem,
} from '@/interfaces/mx-dic/user-permissions';

interface PermissionsTabsWrapperProps {
  categories: UserPermissionsCategory[];
  items: UserPermissionsItem[];
}

export function PermissionsTabsWrapper({ categories, items }: PermissionsTabsWrapperProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Редагування повноважень</h1>
        <p className="text-muted-foreground">
          Управління категоріями та пунктами повноважень користувачів
        </p>
      </div>

      <PermissionsCategoriesTab categories={categories} items={items} />
    </div>
  );
}
