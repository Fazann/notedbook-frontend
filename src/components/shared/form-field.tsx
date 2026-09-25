'use client';

import { useId } from 'react';
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

/** Props shared by every form field component (FormInput, FormSelect, ...). */
export type FormFieldBaseProps<T extends FieldValues, N extends FieldPath<T>> = {
  control: Control<T>;
  name: N;
  label: React.ReactNode;
  /** Help text under the control. */
  description?: React.ReactNode;
  /** Small text at the right of the label (e.g. a character counter); a function gets the current value. */
  hint?: React.ReactNode | ((value: T[N]) => React.ReactNode);
  /**
   * Turns an error message into display text. Zod schemas use translation keys as messages
   * (e.g. "required"), so forms pass a function that translates them. Default: shown as-is.
   */
  translateError?: (message: string) => string;
  className?: string;
};

/** What the render slot gets: RHF field + state, plus ids to wire up accessibility. */
export type FormFieldControlProps<T extends FieldValues, N extends FieldPath<T>> = {
  field: ControllerRenderProps<T, N>;
  fieldState: ControllerFieldState;
  /** Put on the control; the label points at it. */
  id: string;
  /** For controls that are not labelable elements (e.g. a radiogroup): use as `aria-labelledby`. */
  labelId: string;
  /** Put on the control as `aria-describedby` (description + error). */
  describedBy: string | undefined;
  invalid: boolean;
};

export type FormFieldProps<T extends FieldValues, N extends FieldPath<T>> = FormFieldBaseProps<T, N> & {
  children: (props: FormFieldControlProps<T, N>) => React.ReactNode;
};

/**
 * One form row: label, control, description and error, connected to react-hook-form.
 * Use FormInput / FormTextarea / FormSelect for common controls, or this with a render slot for custom ones.
 */
export function FormField<T extends FieldValues, N extends FieldPath<T>>({
  control,
  name,
  label,
  description,
  hint,
  translateError,
  className,
  children,
}: FormFieldProps<T, N>) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const message = fieldState.error?.message;
        const errorText = message && (translateError ? translateError(message) : message);
        const hintContent = typeof hint === 'function' ? hint(field.value) : hint;
        const describedBy = [description && descriptionId, errorText && errorId].filter(Boolean).join(' ') || undefined;

        return (
          <Field data-invalid={fieldState.invalid} className={cn(className)}>
            <div className="flex items-baseline justify-between gap-2">
              <FieldLabel htmlFor={id} id={labelId}>
                {label}
              </FieldLabel>
              {hintContent && (
                <span className="text-muted-foreground text-xs tabular-nums" aria-hidden>
                  {hintContent}
                </span>
              )}
            </div>
            {children({ field, fieldState, id, labelId, describedBy, invalid: fieldState.invalid })}
            {description && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
            <FieldError id={errorId}>{errorText}</FieldError>
          </Field>
        );
      }}
    />
  );
}
