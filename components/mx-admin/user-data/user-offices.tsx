'use client';

import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getUserOfficesDataAction } from '@/actions/mx-admin/user-data/get-user-offices-data';
import { toggleUserOfficeAction } from '@/actions/mx-admin/user-data/toggle-user-office';
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import type { UserOfficeAdminView } from '@/interfaces/mx-system/user-offices';

interface UserOfficesProps {
  userId: string;
}

export function UserOffices({ userId }: UserOfficesProps) {
  const router = useRouter();
  const [officesData, setOfficesData] = useState<UserOfficeAdminView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  // Завантаження даних
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await getUserOfficesDataAction(userId);
        setOfficesData(data.offices);
      } catch (error) {
        console.error('[UserOffices] Помилка завантаження даних офісів:', error);
        toast.error('Не вдалося завантажити дані офісів');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Обробка кліку на офіс
  const handleOfficeClick = async (office: UserOfficeAdminView) => {
    if (processingIds.has(office.office_id)) return;

    setProcessingIds((prev) => new Set(prev).add(office.office_id));

    try {
      const result = await toggleUserOfficeAction(
        userId,
        office.office_id,
        !office.office_is_assigned
      );

      if (result.status === 'success') {
        // Оновлюємо дані
        const data = await getUserOfficesDataAction(userId);
        setOfficesData(data.offices);

        toast.success(result.message);

        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('[UserOffices] Помилка зміни статусу офісу:', error);
      toast.error('Не вдалося змінити статус офісу');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(office.office_id);
        return next;
      });
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Завантаження офісів...</div>;
  }

  return (
    <div className="space-y-8">
      {officesData.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Призначені філії</h2>
          <ItemGroup className="gap-2">
            {officesData.map((office) => {
              const isActive = office.office_is_assigned && office.office_is_active;
              const isProcessing = processingIds.has(office.office_id);

              return (
                <Item
                  key={office.office_id}
                  variant="outline"
                  className={`cursor-pointer transition-colors ${
                    isActive ? 'menu-active-item' : 'hover:bg-muted/50'
                  } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
                  onClick={() => handleOfficeClick(office)}
                >
                  <ItemMedia
                    variant="icon"
                    className={isActive ? 'menu-active-media-success' : undefined}
                  >
                    <Building2 />
                  </ItemMedia>
                  <ItemContent>
                    <div className="flex items-center gap-2">
                      <ItemTitle>{office.office_title}</ItemTitle>
                      {office.office_city && (
                        <span className="text-muted-foreground text-sm">{office.office_city}</span>
                      )}
                    </div>
                    {!office.office_is_active && (
                      <p className="text-muted-foreground mt-1 text-xs">Офіс деактивовано</p>
                    )}
                  </ItemContent>
                </Item>
              );
            })}
          </ItemGroup>
        </div>
      ) : (
        <div className="text-muted-foreground py-8 text-center">
          Офіси для цього користувача відсутні
        </div>
      )}
    </div>
  );
}

UserOffices.displayName = 'UserOffices';
