import { NotebookPen } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type AuthCardProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
};

/** The card on logged-out pages (log in, register, forgot password): app mark, title, then the content. */
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <Card className="w-full max-w-sm py-6 [--card-spacing:--spacing(6)]">
      <CardHeader className="items-center gap-2 text-center">
        <span
          className={cn(
            'bg-primary text-primary-foreground mb-2 flex size-12 items-center justify-center',
            'justify-self-center rounded-xl [&_svg]:size-6'
          )}
        >
          <NotebookPen aria-hidden />
        </span>
        <CardTitle>
          <h1 className="text-xl font-semibold break-words">{title}</h1>
        </CardTitle>
        {description && <CardDescription className="leading-relaxed break-words">{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
