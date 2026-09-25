import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FloatingActionButtonProps = Omit<React.ComponentProps<typeof Button>, 'aria-label'> & {
  /** Required: the button only shows an icon. */
  'aria-label': string;
};

/** The round floating button on phones, above the bottom nav (hidden from `md`). Pass an icon as children. */
export function FloatingActionButton({ className, ...props }: FloatingActionButtonProps) {
  return (
    <Button
      className={cn(
        'fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 md:hidden',
        "size-14 rounded-full shadow-lg [&_svg:not([class*='size-'])]:size-6",
        className
      )}
      {...props}
    />
  );
}
