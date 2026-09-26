'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';

import { FormField, type FormFieldBaseProps } from './form-field';

export type FormPasswordInputProps<T extends FieldValues, N extends FieldPath<T>> = FormFieldBaseProps<T, N> &
  Pick<React.ComponentProps<'input'>, 'placeholder' | 'autoFocus' | 'disabled'> & {
    /** `current-password` on login, `new-password` on register / reset so password managers fill correctly. */
    autoComplete: 'current-password' | 'new-password';
    /** Accessible names for the show / hide button (translated by the caller). */
    showLabel: string;
    hideLabel: string;
  };

/** Password row: label + input with a show / hide toggle + description + error. Touch-sized on phones. */
export function FormPasswordInput<T extends FieldValues, N extends FieldPath<T>>({
  placeholder,
  autoFocus,
  disabled,
  autoComplete,
  showLabel,
  hideLabel,
  ...base
}: FormPasswordInputProps<T, N>) {
  const [visible, setVisible] = useState(false);

  return (
    <FormField {...base}>
      {({ field, id, describedBy, invalid }) => (
        <InputGroup className="h-11 md:h-9">
          <InputGroupInput
            {...field}
            value={field.value ?? ''}
            id={id}
            type={visible ? 'text' : 'password'}
            placeholder={placeholder}
            autoFocus={autoFocus}
            autoComplete={autoComplete}
            autoCapitalize="none"
            spellCheck={false}
            disabled={disabled}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className="h-full text-base md:text-sm"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-sm"
              className="size-10 md:size-8"
              aria-label={visible ? hideLabel : showLabel}
              aria-pressed={visible}
              disabled={disabled}
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      )}
    </FormField>
  );
}
