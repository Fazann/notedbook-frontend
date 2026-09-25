import { cn } from '@/lib/utils';

export type EmptyStateProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-4 py-8 text-center', className)} {...props}>
      {icon && (
        <span
          className={cn(
            'flex size-12 items-center justify-center rounded-full [&_svg]:size-6',
            'bg-muted text-muted-foreground'
          )}
        >
          {icon}
        </span>
      )}
      <div className="max-w-sm space-y-1">
        <p className="font-medium break-words">{title}</p>
        {description && <p className="text-muted-foreground text-sm break-words">{description}</p>}
      </div>
      {action}
    </div>
  );
}
