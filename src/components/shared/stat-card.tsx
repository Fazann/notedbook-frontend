import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type StatCardProps = React.ComponentProps<typeof Card> & {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  /** Small line under the value (e.g. trend or count). */
  hint?: React.ReactNode;
  isLoading?: boolean;
};

export function StatCard({ label, value, icon, hint, isLoading, className, ...props }: StatCardProps) {
  return (
    <Card className={cn('min-w-0 gap-2 px-4 py-4 md:px-5', className)} {...props}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-sm break-words">{label}</p>
        {icon && (
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4',
              'bg-primary/10 text-primary'
            )}
          >
            {icon}
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ) : (
        <>
          <p className="truncate text-xl font-semibold tabular-nums md:text-2xl">{value}</p>
          {hint && <div className="text-muted-foreground text-xs break-words">{hint}</div>}
        </>
      )}
    </Card>
  );
}
