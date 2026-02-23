import { redirect } from 'next/navigation';

import { ClientWizard } from '@/components/mx-job/clients/client-wizard';
import { getCurrentUser } from '@/lib/auth/auth-server';

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return <ClientWizard />;
}
