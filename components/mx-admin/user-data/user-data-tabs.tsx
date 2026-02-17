'use client';

import { Building2, Menu, Shield, User } from 'lucide-react';
import { type ReactNode, useState } from 'react';

type TabId = 'user-data' | 'user-offices' | 'user-menu' | 'user-permissions';

interface Tab {
  id: TabId;
  label: string;
  description: string;
  icon: typeof User;
}

interface UserDataTabsProps {
  userDataContent: ReactNode;
  userOfficesContent: ReactNode;
  userMenuContent: ReactNode;
  userPermissionsContent: ReactNode;
}

// Визначення вкладок
const tabs: Tab[] = [
  {
    id: 'user-data',
    label: 'Інформація',
    description: 'Основні дані та контакти',
    icon: User,
  },
  {
    id: 'user-offices',
    label: 'Філії',
    description: 'Призначені підрозділи',
    icon: Building2,
  },
  {
    id: 'user-menu',
    label: 'Меню',
    description: 'Пункти меню користувача',
    icon: Menu,
  },
  {
    id: 'user-permissions',
    label: 'Доступи',
    description: 'Повноваження користувача',
    icon: Shield,
  },
];

export const UserDataTabs = ({
  userDataContent,
  userOfficesContent,
  userMenuContent,
  userPermissionsContent,
}: UserDataTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabId>('user-data');

  return (
    <>
      {/* Навігація вкладок */}
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

      {/* Контент вкладок */}
      {activeTab === 'user-data' && userDataContent}
      {activeTab === 'user-offices' && userOfficesContent}
      {activeTab === 'user-menu' && userMenuContent}
      {activeTab === 'user-permissions' && userPermissionsContent}
    </>
  );
};

UserDataTabs.displayName = 'UserDataTabs';
