import { columns } from '@/components/tables/public/user-view/columns';
import { DataTable } from '@/components/tables/public/user-view/data-table';
import type { UserView } from '@/interfaces/public/user-view';

interface Props {
  data: UserView[];
}

export const TableWrapper = async ({ data }: Props) => {
  //const data: UserView[] = await getUsersWithUserDataFullName();

  {
    /* TODO: Додати таблицю з користувачами
        Додатковий перший стовпчик (іконки статусів):
        - адміністратор (<Crown />)
        - забанений чи ні (<Ban />)
        Поля:
        - name (друга строка зареєстроване імʼя full_name)
        - email (друга строка emailVerified "підтверджено" або "не підтверджено")
        Управлянські кнопки для користувача:
        - зміна ролі (user -> admin, admin -> user)
        - відміна 2FA, якщо увімкнено
        - відміна Passkey, якщо є хоча б один Passkey
        - повторна відправка верифікаційного email
        - блокування
        - видалення користувача */
  }
  return <DataTable columns={columns} data={data} />;
};
