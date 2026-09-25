import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type SectionCardProps = Omit<React.ComponentProps<typeof Card>, 'title'> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

/** A dashboard-style card with a title row, optional description and action slot. */
export function SectionCard({ title, description, action, children, className, ...props }: SectionCardProps) {
  return (
    <Card className={cn('min-w-0', className)} {...props}>
      <CardHeader>
        <CardTitle className="text-base">
          <h2>{title}</h2>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}
