'use client';

import { FileText, Lock, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';

import { PasskeyList } from '@/components/passkey/passkey-list';
import { PasskeySetup } from '@/components/passkey/passkey-setup';
import { ChangePasswordForm } from '@/components/profile/change-password-form';
import { PersonalDataSection } from '@/components/profile/personal-data-section';
import { ProfileInfo } from '@/components/profile/profile-info';
import { TwoFactorSetupComponent } from '@/components/profile/two-factor-setup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { PasskeyDisplay } from '@/interfaces/passkey';
import { useUser } from '@/lib/auth/user-context';

// Конфігурація вкладок
type TabId = 'overview' | 'personal' | 'security';

const tabs: { id: TabId; label: string; description: string; icon: typeof User }[] = [
  { id: 'overview', label: 'Огляд', description: 'Основна інформація', icon: User },
  { id: 'personal', label: 'Персональні дані', description: 'Імʼя та контакти', icon: FileText },
  { id: 'security', label: 'Безпека', description: 'Пароль, 2FA, Passkey', icon: Shield },
];

export default function ProfilePage() {
  // Отримуємо користувача з context (авторизація перевіряється в layout)
  const user = useUser();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [passkeys, setPasskeys] = useState<PasskeyDisplay[]>([]);
  const [passkeyRefresh, setPasskeyRefresh] = useState(0);

  // Завантажуємо статус 2FA
  useEffect(() => {
    const fetchTwoFactorStatus = async () => {
      try {
        const response = await fetch('/api/two-factor/status');
        if (response.ok) {
          const data = await response.json();
          setTwoFactorEnabled(data.enabled);
        }
      } catch (error) {
        console.error('[Profile] Помилка завантаження статусу 2FA:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTwoFactorStatus();
  }, []);

  // Завантажуємо список passkeys
  useEffect(() => {
    const fetchPasskeys = async () => {
      try {
        const response = await fetch('/api/passkey/list');
        if (response.ok) {
          const data = await response.json();
          setPasskeys(data.passkeys || []);
        }
      } catch (error) {
        console.error('[Profile] Помилка завантаження passkeys:', error);
      }
    };

    fetchPasskeys();
  }, [passkeyRefresh]);

  const handleTwoFactorStatusChange = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  const handlePasskeyChange = () => {
    // Оновлюємо список passkeys
    setPasskeyRefresh((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold">Профіль користувача</h1>
        <p className="text-muted-foreground mt-2">
          Керуйте своїм профілем та налаштуваннями безпеки
        </p>
      </div>

      {/* Кастомна навігація */}
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
              className={cn(
                'flex flex-1 items-center gap-3 rounded-lg border p-3 text-left transition-all sm:p-4',
                isActive
                  ? 'border-primary/30 bg-primary/5 shadow-sm'
                  : 'border-border hover:border-border/80 hover:bg-muted/30'
              )}
            >
              <div
                className={cn(
                  'flex size-9 items-center justify-center rounded-md',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{tab.label}</p>
                <p className="text-muted-foreground hidden text-xs sm:block">{tab.description}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* ЗОНА 1: Огляд */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <ProfileInfo
            user={user}
            twoFactorEnabled={twoFactorEnabled}
            passkeysCount={passkeys.length}
          />
        </div>
      )}

      {/* ЗОНА 2: Персональні дані */}
      {activeTab === 'personal' && (
        <div className="space-y-6">
          <PersonalDataSection />
        </div>
      )}

      {/* ЗОНА 3: Безпека */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Зміна пароля */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="size-5" />
                Зміна пароля
              </CardTitle>
              <CardDescription>Оновіть пароль для свого облікового запису</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>

          {/* 2FA */}
          {!isLoading && (
            <TwoFactorSetupComponent
              isEnabled={twoFactorEnabled}
              onStatusChange={handleTwoFactorStatusChange}
            />
          )}

          {/* Passkey секція */}
          <div className="space-y-6">
            <PasskeySetup onSuccess={handlePasskeyChange} hasPasskeys={passkeys.length > 0} />
            {passkeys.length > 0 && (
              <>
                <Separator />
                <PasskeyList onPasskeyDeleted={handlePasskeyChange} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
