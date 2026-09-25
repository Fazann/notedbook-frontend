'use client';

import type { FieldPath, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldBaseProps } from './form-field';
import { OptionSelect, type SelectOption } from './option-select';

export type FormSelectProps<T extends FieldValues, N extends FieldPath<T>> = FormFieldBaseProps<T, N> & {
  options: readonly SelectOption[];
  placeholder?: React.ReactNode;
  disabled?: boolean;
  /** Store the value as a number (e.g. an id) instead of a string. */
  valueAsNumber?: boolean;
  selectClassName?: string;
};

/** Select row: label + OptionSelect + description + error. */
export function FormSelect<T extends FieldValues, N extends FieldPath<T>>({
  options,
  placeholder,
  disabled,
  valueAsNumber,
  selectClassName,
  ...base
}: FormSelectProps<T, N>) {
  return (
    <FormField {...base}>
      {({ field, id, describedBy, invalid }) => (
        <OptionSelect
          id={id}
          options={options}
          value={field.value === undefined || field.value === null ? undefined : String(field.value)}
          onValueChange={(v) => field.onChange(valueAsNumber ? Number(v) : v)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={selectClassName}
        />
      )}
    </FormField>
  );
}
