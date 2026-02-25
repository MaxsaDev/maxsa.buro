import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { UserCog } from 'lucide-react';

export default function Page() {
  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Співробітники</h1>
        <p className="text-muted-foreground mt-2">Список ваших співробітників.</p>
      </div>

      <Empty>
        <EmptyMedia>
          <UserCog className="size-10" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Співробітників в офісі ще немає</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
