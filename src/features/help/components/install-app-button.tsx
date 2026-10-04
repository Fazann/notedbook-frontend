'use client';

import { CircleCheck, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';

/** Chrome / Edge / Android event, not in the TS DOM types yet. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/**
 * One-tap install where the browser supports it (Chrome, Edge, Android). Renders nothing elsewhere
 * (e.g. iPhone Safari), where the written steps on the install page apply instead.
 */
export function InstallAppButton() {
  const t = useTranslations('help.install');
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // True when this page runs as the installed app (opened from the home screen icon), on any platform.
  const standalone = useMediaQuery('(display-mode: standalone)');
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      // Keep the browser's own mini bar from showing; the button below triggers the same dialog.
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setJustInstalled(true);
      setPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (standalone || justInstalled) {
    return (
      <p role="status" className="bg-muted flex items-start gap-2 rounded-lg p-3 text-sm break-words">
        <CircleCheck className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
        {t('installed')}
      </p>
    );
  }

  if (!prompt) return null;

  const install = async () => {
    await prompt.prompt();
    // The event can only be used once, whatever the user chose.
    setPrompt(null);
  };

  return (
    <div className="bg-muted flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center">
      <p className="flex-1 text-sm break-words">{t('hint')}</p>
      <Button size="touch" onClick={install}>
        <Download aria-hidden />
        {t('button')}
      </Button>
    </div>
  );
}
