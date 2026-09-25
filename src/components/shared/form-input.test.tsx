import { fireEvent, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { renderWithIntl } from '@/test/render';

import { FormInput } from './form-input';
import { FormSelect } from './form-select';

type Values = { name: string; size: number };

function TestForm({ readOnlyValue }: { readOnlyValue?: string }) {
  const form = useForm<Values>({ defaultValues: { name: 'Gym', size: 10 } });
  return (
    <form onSubmit={form.handleSubmit(() => {})}>
      <FormInput
        control={form.control}
        name="name"
        label="Name"
        maxLength={50}
        showCount
        description="Shown as typed"
        readOnlyValue={readOnlyValue}
        translateError={(key) => `translated:${key}`}
      />
      <FormSelect
        control={form.control}
        name="size"
        label="Size"
        valueAsNumber
        options={[
          { value: '10', label: 'Ten' },
          { value: '20', label: 'Twenty' },
        ]}
      />
      <button type="button" onClick={() => form.setError('name', { message: 'required' })}>
        fail
      </button>
    </form>
  );
}

describe('FormInput / FormSelect', () => {
  it('connects label, description and value', () => {
    renderWithIntl(<TestForm />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveValue('Gym');
    expect(input).toHaveAccessibleDescription('Shown as typed');
    expect(screen.getByText('3/50')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'Gym pass' } });
    expect(screen.getByText('8/50')).toBeInTheDocument();
  });

  it('shows the translated error and marks the input invalid', () => {
    renderWithIntl(<TestForm />);
    fireEvent.click(screen.getByRole('button', { name: 'fail' }));
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(screen.getByRole('alert')).toHaveTextContent('translated:required');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/translated:required/);
  });

  it('shows a read-only value without a counter', () => {
    renderWithIntl(<TestForm readOnlyValue="អាហារ" />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveValue('អាហារ');
    expect(input).toHaveAttribute('readonly');
    expect(screen.queryByText('3/50')).not.toBeInTheDocument();
  });

  it('labels the select and shows the current option', () => {
    renderWithIntl(<TestForm />);
    expect(screen.getByRole('combobox', { name: 'Size' })).toHaveTextContent('Ten');
  });
});
