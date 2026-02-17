import { OfficesList } from '@/components/mx-admin/offices/offices-list';
import { getOffices } from '@/data/mx-dic/offices';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const offices = await getOffices();

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Філії</h1>
        <p className="text-muted-foreground">
          Філії, представництва або офіси як підрозділи компанії.
        </p>
      </div>

      <OfficesList offices={offices} />
    </div>
  );
}
