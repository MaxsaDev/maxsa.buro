import { MenuTabsWrapper } from '@/components/mx-admin/menu/menu-tabs-wrapper';
import {
  getMenuAppSupport,
  getMenuUserItems,
  getMenuUserSectionsCategories,
  getMenuUserSectionsItems,
} from '@/data/mx-dic/menu-admin';
import { getMenusByType, getMenuTypes } from '@/data/mx-dic/menus';

export default async function Page() {
  const [menuTypes, menusSections, menusItems, categories, sectionsItems, userItems, appSupport] =
    await Promise.all([
      getMenuTypes(),
      getMenusByType('sections'),
      getMenusByType('items'),
      getMenuUserSectionsCategories(),
      getMenuUserSectionsItems(),
      getMenuUserItems(),
      getMenuAppSupport(),
    ]);

  // Знаходимо ID типів меню
  const sectionsMenuTypeId = menuTypes.find((type) => type.code === 'sections')?.id || 1;
  const itemsMenuTypeId = menuTypes.find((type) => type.code === 'items')?.id || 2;

  // Знаходимо ID меню поддержки (единственное меню, к которому привязаны пункты поддержки)
  // Меню поддержки - это меню типа "items" с названием "Меню підтримки додатку"
  const appSupportMenuId =
    appSupport.length > 0
      ? appSupport[0].menu_id
      : menusItems.find((menu) => menu.title === 'Меню підтримки додатку')?.id ||
        menusItems[0]?.id ||
        0;

  return (
    <MenuTabsWrapper
      menusSections={menusSections}
      menusItems={menusItems}
      appSupportMenuId={appSupportMenuId}
      sectionsMenuTypeId={sectionsMenuTypeId}
      itemsMenuTypeId={itemsMenuTypeId}
      categories={categories}
      sectionsItems={sectionsItems}
      userItems={userItems}
      appSupport={appSupport}
    />
  );
}
