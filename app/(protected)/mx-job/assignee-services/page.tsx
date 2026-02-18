import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Toolbox } from 'lucide-react';

export default function Page() {
  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Послуги</h1>
        <p className="text-muted-foreground mt-2">Список послуг відданих на виконання.</p>
      </div>

      <Empty>
        <EmptyMedia>
          <Toolbox className="size-10" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Послуг відданих на виконання ще немає</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
