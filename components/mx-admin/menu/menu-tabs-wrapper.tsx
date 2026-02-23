'use client';

import { FolderTree, Globe2, Layers, LifeBuoy } from 'lucide-react';
import { useState } from 'react';

import { MenuAppSupport } from './menu-app-support';
import { MenuGeneral } from './menu-general';
import { MenuUserItems } from './menu-user-items';
import { MenuUserSections } from './menu-user-sections';

import type { MenuAppSupport as MenuAppSupportType } from '@/interfaces/mx-dic/menu-app-support';
import type { MenuGeneralItems } from '@/interfaces/mx-dic/menu-general-items';
import type { MenuUserItems as MenuUserItemsType } from '@/interfaces/mx-dic/menu-user-items';
import type {
  MenuUserSectionsCategory,
  MenuUserSectionsItems,
} from '@/interfaces/mx-dic/menu-user-sections';
import type { Menu } from '@/interfaces/mx-dic/menus';

type TabId = 'user-sections' | 'user-items' | 'general' | 'app-support';

const tabs: Array<{ id: TabId; label: string; description: string; icon: typeof FolderTree }> = [
  {
    id: 'user-sections',
    label: 'Секції',
    description: 'Меню з категоріями',
    icon: FolderTree,
  },
  {
    id: 'user-items',
    label: 'Пункти',
    description: 'Меню з пунктами',
    icon: Layers,
  },
  {
    id: 'general',
    label: 'Загальне',
    description: 'Загальне меню',
    icon: Globe2,
  },
  {
    id: 'app-support',
    label: 'Підтримка',
    description: 'Меню підтримки',
    icon: LifeBuoy,
  },
];

interface MenuTabsWrapperProps {
  menusSections: Menu[];
  menusItems: Menu[];
  appSupportMenuId: number;
  generalMenuId: number;
  sectionsMenuTypeId: number;
  itemsMenuTypeId: number;
  categories: MenuUserSectionsCategory[];
  sectionsItems: MenuUserSectionsItems[];
  userItems: MenuUserItemsType[];
  appSupport: MenuAppSupportType[];
  generalItems: MenuGeneralItems[];
}

export function MenuTabsWrapper({
  menusSections,
  menusItems,
  appSupportMenuId,
  generalMenuId,
  sectionsMenuTypeId,
  itemsMenuTypeId,
  categories,
  sectionsItems,
  userItems,
  appSupport,
  generalItems,
}: MenuTabsWrapperProps) {
  const [activeTab, setActiveTab] = useState<TabId>('user-sections');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Конструктор меню</h1>
        <p className="text-muted-foreground">Управління меню користувача та підтримки додатку</p>
      </div>

      {/* Навігація */}
      <nav role="tablist" className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center gap-3 rounded-lg border p-3 text-left transition-all sm:p-4 ${
                isActive
                  ? 'border-primary/30 bg-primary/5 shadow-sm'
                  : 'border-border hover:border-border/80 hover:bg-muted/30'
              }`}
            >
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-md ${
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">{tab.label}</div>
                <div className="text-muted-foreground hidden text-xs sm:block">
                  {tab.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Контент */}
      <div>
        {activeTab === 'user-sections' && (
          <MenuUserSections
            menus={menusSections}
            menuTypeId={sectionsMenuTypeId}
            categories={categories}
            items={sectionsItems}
          />
        )}

        {activeTab === 'user-items' && (
          <MenuUserItems menus={menusItems} menuTypeId={itemsMenuTypeId} items={userItems} />
        )}

        {activeTab === 'general' && <MenuGeneral menuId={generalMenuId} items={generalItems} />}

        {activeTab === 'app-support' && (
          <MenuAppSupport menuId={appSupportMenuId} items={appSupport} />
        )}
      </div>
    </div>
  );
}
