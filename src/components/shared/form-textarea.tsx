'use client';

import { useTranslations } from 'next-intl';
import type { FieldPath, FieldValues } from 'react-hook-form';

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { FormField, type FormFieldBaseProps } from './form-field';

export type FormTextareaProps<T extends FieldValues, N extends FieldPath<T>> = FormFieldBaseProps<T, N> &
  Pick<React.ComponentProps<'textarea'>, 'placeholder' | 'maxLength' | 'rows' | 'autoFocus' | 'disabled'> & {
    /** Shows "12/500" next to the label (needs `maxLength`). */
    showCount?: boolean;
    textareaClassName?: string;
  };

/** Multi-line text row: label + Textarea + description + error. */
export function FormTextarea<T extends FieldValues, N extends FieldPath<T>>({
  showCount,
  textareaClassName,
  placeholder,
  maxLength,
  rows = 3,
  autoFocus,
  disabled,
  hint,
  ...base
}: FormTextareaProps<T, N>) {
  const t = useTranslations('common');
  const counter =
    showCount && maxLength !== undefined
      ? (value: unknown) => t('charCount', { count: String(value ?? '').length, max: maxLength })
      : hint;

  return (
    <FormField {...base} hint={counter}>
      {({ field, id, describedBy, invalid }) => (
        <Textarea
          {...field}
          value={field.value ?? ''}
          id={id}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn('text-base md:text-sm', textareaClassName)}
        />
      )}
    </FormField>
  );
}
