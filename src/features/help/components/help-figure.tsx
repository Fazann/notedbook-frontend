import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  EllipsisVertical,
  Glasses,
  History,
  House,
  Lock,
  MonitorDown,
  NotebookPen,
  Plus,
  Pointer,
  Share,
  SquarePlus,
  Smartphone,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import type { HelpFigureId } from '../topics';

export type HelpFigureProps = { id: HelpFigureId; className?: string };

/**
 * Drawn picture of a phone or browser screen for the install guide, with the control to tap highlighted.
 * Built from theme tokens (not screenshots) so it follows light / dark mode and the page language.
 */
export function HelpFigure({ id, className }: HelpFigureProps) {
  const t = useTranslations('help.figures');
  const Figure = FIGURES[id];

  return (
    <div role="img" aria-label={t(`captions.${id}`)} className={cn('select-none', className)}>
      <Figure />
    </div>
  );
}

/* ---------- building blocks ---------- */

/** The LifeApp icon (same as public/icons/icon.svg). */
function AppMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-[22%]',
        '[&_svg]:size-[55%]',
        className
      )}
    >
      <NotebookPen />
    </span>
  );
}

/** Ring and pointer around the control the reader should tap. */
function Tap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'ring-primary ring-offset-background relative inline-flex rounded-md ring-2 ring-offset-2',
        className
      )}
    >
      {children}
      <Pointer
        className="text-primary fill-background absolute -right-3 -bottom-4 size-5 drop-shadow-sm"
        strokeWidth={2.25}
      />
    </span>
  );
}

function Phone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'border-foreground/15 bg-background relative flex h-72 w-48 flex-col overflow-hidden rounded-[1.75rem]',
        'border-[5px] text-[0.6875rem] leading-snug shadow-sm',
        className
      )}
    >
      <span className="bg-foreground/15 mx-auto mt-1.5 h-1.5 w-12 shrink-0 rounded-full" />
      {children}
    </div>
  );
}

/** Grey lines standing in for a web page. */
function PageLines({ className }: { className?: string }) {
  return (
    <div className={cn('flex-1 space-y-2 p-3', className)}>
      <div className="bg-primary/25 h-3 w-2/3 rounded" />
      <div className="bg-muted h-2 w-full rounded" />
      <div className="bg-muted h-2 w-5/6 rounded" />
      <div className="bg-muted h-12 w-full rounded-md" />
      <div className="bg-muted h-2 w-4/5 rounded" />
      <div className="bg-muted h-2 w-3/5 rounded" />
    </div>
  );
}

function AddressBar({ className }: { className?: string }) {
  const tApp = useTranslations('app');
  return (
    <div className={cn('bg-muted flex h-7 min-w-0 flex-1 items-center gap-1 rounded-full px-2.5', className)}>
      <Lock className="text-muted-foreground size-3 shrink-0" />
      <span className="truncate">{tApp('name').toLowerCase()}</span>
    </div>
  );
}

function MenuRow({
  icon: Icon,
  label,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  highlight?: boolean;
}) {
  const row = (
    <span className="flex w-full items-center justify-between gap-2 px-2.5 py-2">
      <span className="min-w-0 break-words">{label}</span>
      <Icon className="size-3.5 shrink-0" />
    </span>
  );
  return highlight ? (
    <Tap className="bg-background w-full font-semibold">{row}</Tap>
  ) : (
    <span className="text-muted-foreground flex w-full">{row}</span>
  );
}

/* ---------- figures ---------- */

function HomeScreen() {
  const tApp = useTranslations('app');
  return (
    <Phone className="bg-primary/10 h-52">
      <div className="grid grid-cols-4 gap-x-2 gap-y-3 p-3 pt-5">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="bg-foreground/10 aspect-square rounded-[22%]" />
        ))}
        <span className="col-start-3 flex flex-col items-center gap-1">
          <Tap className="w-full rounded-[22%]">
            <AppMark className="aspect-square h-auto w-full" />
          </Tap>
          <span className="mt-3 font-medium">{tApp('name')}</span>
        </span>
      </div>
    </Phone>
  );
}

function IosShare() {
  return (
    <Phone>
      <PageLines />
      <div className="bg-card space-y-2 border-t px-2.5 pt-2 pb-3">
        <AddressBar className="mx-auto w-full" />
        <div className="text-primary flex items-center justify-between px-1 [&_svg]:size-4">
          <ChevronLeft />
          <ChevronRight className="opacity-40" />
          <Tap className="p-0.5">
            <Share />
          </Tap>
          <BookOpen />
          <Copy />
        </div>
      </div>
    </Phone>
  );
}

function IosAddToHome() {
  const t = useTranslations('help.figures');
  const tApp = useTranslations('app');
  return (
    <Phone>
      <div className="bg-foreground/10 relative flex-1">
        <PageLines className="opacity-40" />
        <div className="bg-card absolute inset-x-0 bottom-0 space-y-2 rounded-t-xl p-2.5 shadow-md">
          <div className="flex items-center gap-2 border-b pb-2">
            <AppMark className="size-7" />
            <span className="font-semibold">{tApp('name')}</span>
          </div>
          <div className="bg-muted/60 flex flex-col gap-1 rounded-lg p-1">
            <MenuRow icon={Copy} label={t('ui.copy')} />
            <MenuRow icon={Glasses} label={t('ui.addToReadingList')} />
            <MenuRow icon={BookOpen} label={t('ui.addBookmark')} />
            <MenuRow icon={SquarePlus} label={t('ui.addToHomeScreen')} highlight />
          </div>
        </div>
      </div>
    </Phone>
  );
}

function IosConfirm() {
  const t = useTranslations('help.figures');
  const tApp = useTranslations('app');
  return (
    <Phone>
      <div className="bg-muted/60 flex-1">
        <div className="bg-card flex items-center justify-between gap-1 border-b px-2.5 py-2">
          <span className="text-primary">{t('ui.cancel')}</span>
          <span className="min-w-0 truncate font-semibold">{t('ui.addToHomeScreen')}</span>
          <Tap className="text-primary px-1 font-semibold">{t('ui.add')}</Tap>
        </div>
        <div className="bg-card m-2.5 flex items-center gap-2 rounded-lg p-2.5">
          <AppMark />
          <span className="min-w-0 flex-1 space-y-1">
            <span className="block border-b pb-1 font-medium">{tApp('name')}</span>
            <span className="bg-muted block h-1.5 w-3/4 rounded" />
          </span>
        </div>
      </div>
    </Phone>
  );
}

function AndroidMenu() {
  return (
    <Phone>
      <div className="bg-card flex items-center gap-1.5 border-b px-2 py-2 [&_svg]:size-4">
        <House className="text-muted-foreground shrink-0" />
        <AddressBar />
        <span
          className={cn(
            'flex size-4 shrink-0 items-center justify-center rounded-sm border text-[0.5625rem]',
            'border-foreground/50'
          )}
        >
          2
        </span>
        <Tap className="p-0.5">
          <EllipsisVertical />
        </Tap>
      </div>
      <PageLines />
    </Phone>
  );
}

function AndroidInstall() {
  const t = useTranslations('help.figures');
  return (
    <Phone>
      <div className="relative flex-1">
        <div className="bg-card flex items-center gap-1.5 border-b px-2 py-2 [&_svg]:size-4">
          <House className="text-muted-foreground shrink-0" />
          <AddressBar />
          <EllipsisVertical className="shrink-0" />
        </div>
        <PageLines className="opacity-40" />
        <div
          className={cn(
            'absolute top-2 right-2 left-7 flex flex-col gap-0.5 rounded-lg p-1',
            'bg-card ring-foreground/10 shadow-lg ring-1'
          )}
        >
          <MenuRow icon={Plus} label={t('ui.newTab')} />
          <MenuRow icon={History} label={t('ui.history')} />
          <MenuRow icon={Download} label={t('ui.downloads')} />
          <MenuRow icon={Smartphone} label={t('ui.installApp')} highlight />
        </div>
      </div>
    </Phone>
  );
}

function AndroidConfirm() {
  const t = useTranslations('help.figures');
  const tApp = useTranslations('app');
  return (
    <Phone>
      <div className="bg-foreground/10 relative flex flex-1 items-center p-3">
        <PageLines className="absolute inset-0 opacity-30" />
        <div className="bg-card relative w-full space-y-3 rounded-xl p-3 shadow-lg">
          <p className="text-xs font-semibold">{t('ui.installApp')}</p>
          <div className="flex items-center gap-2">
            <AppMark className="size-8" />
            <span className="font-medium">{tApp('name')}</span>
          </div>
          <div className="flex items-center justify-end gap-3">
            <span className="text-primary">{t('ui.cancel')}</span>
            <Tap className="bg-primary text-primary-foreground rounded-full px-2.5 py-1 font-semibold">
              {t('ui.install')}
            </Tap>
          </div>
        </div>
      </div>
    </Phone>
  );
}

function DesktopInstall() {
  const tApp = useTranslations('app');
  return (
    <div
      className={cn(
        'border-foreground/15 bg-background flex w-full max-w-sm flex-col overflow-hidden rounded-lg border-2',
        'text-[0.6875rem] shadow-sm'
      )}
    >
      <div className="bg-muted flex items-end gap-1.5 px-2 pt-1.5">
        <span className="flex gap-1 pb-2">
          <span className="bg-foreground/20 size-2 rounded-full" />
          <span className="bg-foreground/20 size-2 rounded-full" />
          <span className="bg-foreground/20 size-2 rounded-full" />
        </span>
        <span className="bg-background flex min-w-0 items-center gap-1.5 rounded-t-md px-2 py-1">
          <AppMark className="size-3.5 rounded-[3px]" />
          <span className="truncate">{tApp('name')}</span>
        </span>
      </div>
      <div className="bg-background flex items-center gap-2 border-b px-2 py-1.5 [&_svg]:size-3.5">
        <ChevronLeft className="text-muted-foreground shrink-0" />
        <ChevronRight className="text-muted-foreground shrink-0" />
        <div className="bg-muted flex h-6 min-w-0 flex-1 items-center gap-1 rounded-full pr-1 pl-2.5">
          <Lock className="text-muted-foreground shrink-0" />
          <span className="flex-1 truncate">{tApp('name').toLowerCase()}</span>
          <Tap className="p-0.5">
            <MonitorDown />
          </Tap>
        </div>
        <EllipsisVertical className="shrink-0" />
      </div>
      <PageLines className="h-24 flex-none" />
    </div>
  );
}

const FIGURES: Record<HelpFigureId, () => React.ReactElement> = {
  homeScreen: HomeScreen,
  iosShare: IosShare,
  iosAddToHome: IosAddToHome,
  iosConfirm: IosConfirm,
  androidMenu: AndroidMenu,
  androidInstall: AndroidInstall,
  androidConfirm: AndroidConfirm,
  desktopInstall: DesktopInstall,
};
