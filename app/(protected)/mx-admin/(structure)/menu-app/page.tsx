import { MenuTabsWrapper } from '@/components/mx-admin/menu/menu-tabs-wrapper';
import {
  getMenuAppSupport,
  getMenuUserItems,
  getMenuUserSectionsCategories,
  getMenuUserSectionsItems,
} from '@/data/mx-dic/menu-admin';
import { getAllMenuGeneralItems } from '@/data/mx-dic/menu-general';
import { getMenusByType, getMenuTypes } from '@/data/mx-dic/menus';

export default async function Page() {
  const [
    menuTypes,
    menusSections,
    menusItems,
    menusGeneral,
    categories,
    sectionsItems,
    userItems,
    appSupport,
    generalItems,
  ] = await Promise.all([
    getMenuTypes(),
    getMenusByType('sections'),
    getMenusByType('items'),
    getMenusByType('general'),
    getMenuUserSectionsCategories(),
    getMenuUserSectionsItems(),
    getMenuUserItems(),
    getMenuAppSupport(),
    getAllMenuGeneralItems(),
  ]);

  // Знаходимо ID типів меню
  const sectionsMenuTypeId = menuTypes.find((type) => type.code === 'sections')?.id || 1;
  const itemsMenuTypeId = menuTypes.find((type) => type.code === 'items')?.id || 2;

  // Знаходимо ID меню поддержки
  const appSupportMenuId =
    appSupport.length > 0
      ? appSupport[0].menu_id
      : menusItems.find((menu) => menu.title === 'Меню підтримки додатку')?.id ||
        menusItems[0]?.id ||
        0;

  // Знаходимо ID загального меню
  const generalMenuId =
    generalItems.length > 0 ? generalItems[0].menu_id : menusGeneral[0]?.id || 0;

  return (
    <MenuTabsWrapper
      menusSections={menusSections}
      menusItems={menusItems}
      appSupportMenuId={appSupportMenuId}
      generalMenuId={generalMenuId}
      sectionsMenuTypeId={sectionsMenuTypeId}
      itemsMenuTypeId={itemsMenuTypeId}
      categories={categories}
      sectionsItems={sectionsItems}
      userItems={userItems}
      appSupport={appSupport}
      generalItems={generalItems}
    />
  );
}
