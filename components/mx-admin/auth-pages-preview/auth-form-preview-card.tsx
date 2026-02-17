import Link from 'next/link';

import { cn } from '@/lib/utils';

interface AuthFormPreviewCardProps {
  title: string;
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function AuthFormPreviewCard({
  title,
  href,
  children,
  className,
}: AuthFormPreviewCardProps) {
  return (
    <Link href={href} className={cn('block h-full', className)}>
      <div className="group relative h-full">
        {children}
        <div className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100">
          <div className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium">
            Переглянути повну версію: {title}
          </div>
        </div>
      </div>
    </Link>
  );
}
