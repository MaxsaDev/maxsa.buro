'use client';

import { Edit2, User } from 'lucide-react';
import { type ReactNode, useState } from 'react';

type TabId = 'info' | 'edit';

interface Tab {
  id: TabId;
  label: string;
  description: string;
  icon: typeof User;
}

interface ClientTabsProps {
  infoContent: ReactNode;
  editContent: ReactNode;
}

const tabs: Tab[] = [
  {
    id: 'info',
    label: 'Інформація',
    description: 'Основні дані та контакти',
    icon: User,
  },
  {
    id: 'edit',
    label: 'Редагування',
    description: 'Зміна персональних даних',
    icon: Edit2,
  },
];

export function ClientTabs({ infoContent, editContent }: ClientTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('info');

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
      {activeTab === 'info' && infoContent}
      {activeTab === 'edit' && editContent}
    </>
  );
}

ClientTabs.displayName = 'ClientTabs';
