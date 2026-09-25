'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type SelectOption = {
  value: string;
  label: React.ReactNode;
  /** Shown before the label, in the list and in the trigger. */
  icon?: React.ReactNode;
  disabled?: boolean;
};

export type OptionSelectProps = {
  options: readonly SelectOption[];
  value: string | undefined;
  onValueChange: (value: string) => void;
  placeholder?: React.ReactNode;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  align?: 'start' | 'center' | 'end';
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

/** A shadcn Select built from an `options` array. Touch-sized on phones. Use FormSelect inside forms. */
export function OptionSelect({
  options,
  value,
  onValueChange,
  placeholder,
  id,
  disabled,
  required,
  align,
  className,
  ...aria
}: OptionSelectProps) {
  return (
    <Select value={value ?? ''} onValueChange={onValueChange} disabled={disabled} required={required}>
      <SelectTrigger id={id} className={cn('h-11 w-full md:h-9', className)} {...aria}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align={align}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.icon}
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
