import { notFound } from 'next/navigation';

import { getAssigneeById } from '@/data/mx-data/assignee';

interface Props {
  params: Promise<{ assignee_id: string }>;
}

export default async function Page({ params }: Props) {
  const { assignee_id } = await params;
  const assignee = await getAssigneeById(assignee_id);

  if (!assignee) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{assignee.full_name}</h1>
        <p className="text-muted-foreground mt-2">{assignee.post_assignee_title}</p>
      </div>
      {/* TODO: розробити повний функціонал персональної сторінки виконавця */}
    </div>
  );
}
