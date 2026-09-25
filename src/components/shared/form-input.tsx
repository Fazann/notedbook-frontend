'use client';

import { useTranslations } from 'next-intl';
import type { FieldPath, FieldValues } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { FormField, type FormFieldBaseProps } from './form-field';

export type FormInputProps<T extends FieldValues, N extends FieldPath<T>> = FormFieldBaseProps<T, N> &
  Pick<
    React.ComponentProps<'input'>,
    'type' | 'placeholder' | 'maxLength' | 'autoFocus' | 'autoComplete' | 'inputMode' | 'disabled'
  > & {
    /** Shows "12/50" next to the label (needs `maxLength`). */
    showCount?: boolean;
    /**
     * Shows this text read-only instead of the field value — e.g. a translated name that cannot be edited.
     * The form value itself is left unchanged.
     */
    readOnlyValue?: string;
    inputClassName?: string;
  };

/** Text input row: label + Input + description + error. Touch-sized on phones. */
export function FormInput<T extends FieldValues, N extends FieldPath<T>>({
  showCount,
  readOnlyValue,
  inputClassName,
  type = 'text',
  placeholder,
  maxLength,
  autoFocus,
  autoComplete,
  inputMode,
  disabled,
  hint,
  ...base
}: FormInputProps<T, N>) {
  const t = useTranslations('common');
  const readOnly = readOnlyValue !== undefined;
  const counter =
    showCount && maxLength !== undefined && !readOnly
      ? (value: unknown) => t('charCount', { count: String(value ?? '').length, max: maxLength })
      : hint;

  return (
    <FormField {...base} hint={counter}>
      {({ field, id, describedBy, invalid }) => (
        <Input
          {...field}
          value={readOnly ? readOnlyValue : (field.value ?? '')}
          readOnly={readOnly}
          id={id}
          type={type}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn('h-11 text-base md:h-9 md:text-sm', readOnly && 'bg-muted', inputClassName)}
        />
      )}
    </FormField>
  );
}
