import { cn } from '@/lib/utils';

import { PageHeader } from './page-header';

export type ListPageProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Primary action in the header (e.g. "Add category"). */
  primaryAction?: React.ReactNode;
  /** Section navigation under the header (e.g. tabs). */
  navigation?: React.ReactNode;
  /** Totals or stats shown above the toolbar (e.g. a row of StatCards). */
  summary?: React.ReactNode;
  toolbar?: React.ReactNode;
  pagination?: React.ReactNode;
};

/** Standard layout for a list screen: header, optional tabs, summary, toolbar, the list, pagination. */
export function ListPage({
  title,
  description,
  primaryAction,
  navigation,
  summary,
  toolbar,
  pagination,
  children,
  className,
  ...props
}: ListPageProps) {
  return (
    <div className={cn('space-y-4 md:space-y-6', className)} {...props}>
      <div className="space-y-4">
        <PageHeader title={title} description={description} actions={primaryAction} />
        {navigation}
      </div>
      {summary}
      <div className="space-y-4">
        {toolbar}
        {children}
        {pagination}
      </div>
    </div>
  );
}
