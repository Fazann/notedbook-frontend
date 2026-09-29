'use client';

import { Camera, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useRef } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useErrorMessage } from '@/hooks/use-error-message';

import { useChangeAvatar } from '../hooks';
import { AVATAR_MAX_BYTES, type User } from '../types';

const MAX_MB = AVATAR_MAX_BYTES / 1024 / 1024;

export type AvatarUploadProps = { user: User };

/** Current avatar with a "Change photo" button. The picked image is uploaded and saved right away. */
export function AvatarUpload({ user }: AvatarUploadProps) {
  const t = useTranslations('settings.profile');
  const errorMessage = useErrorMessage();
  const change = useChangeAvatar();
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Clear it so picking the same file again still fires `change`.
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('photoNotImage'));
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error(t('photoTooLarge', { max: MAX_MB }));
      return;
    }
    change.mutate(file, {
      onSuccess: () => toast.success(t('photoSaved')),
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  const src = user.avatar?.thumbnail_url || user.avatar?.url;

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16 md:size-20">
        {src && <AvatarImage src={src} alt={t('photo')} className="object-cover" />}
        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
          {user.fullname.trim().slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={onFile}
        />
        <Button
          type="button"
          variant="outline"
          size="touch"
          disabled={change.isPending}
          aria-describedby={hintId}
          onClick={() => inputRef.current?.click()}
        >
          {change.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Camera aria-hidden />}
          {change.isPending ? t('uploading') : t('changePhoto')}
        </Button>
        <p id={hintId} className="text-muted-foreground text-xs leading-relaxed">
          {t('photoHint', { max: MAX_MB })}
        </p>
      </div>
    </div>
  );
}
