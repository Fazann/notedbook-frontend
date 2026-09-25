import { Skeleton } from '@/components/ui/skeleton';

/** Placeholder rows for a dashboard list widget while it loads. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="space-y-4" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-14" />
        </li>
      ))}
    </ul>
  );
}
