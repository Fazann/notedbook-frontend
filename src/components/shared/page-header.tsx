import { cn } from '@/lib/utils';

export type PageHeaderProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, actions, className, ...props }: PageHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4', className)}
      {...props}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="font-heading text-2xl font-semibold break-words md:text-3xl">{title}</h1>
        {description && <p className="text-muted-foreground break-words">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
