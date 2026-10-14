import { TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Grid, Stack, Typography, Checkbox } from '@mui/material';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, ZodSchema } from 'zod';
import { Button } from './Button';

export const Input = TextField;
export const Textarea = TextField;
export const Select = Select;
export const Checkbox = Checkbox;
export const FormGrid = Grid;

interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  select?: boolean;
  options?: { value: string | number; label: string }[];
  multiline?: boolean;
  rows?: number;
  helperText?: string;
}

export function FormField({ name, label, type = 'text', placeholder, required, disabled, fullWidth = true, select, options, multiline, rows, helperText }: FormFieldProps) {
  return (
    <Controller
      name={name}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          label={label}
          type={type}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          fullWidth={fullWidth}
          select={select}
          multiline={multiline}
          rows={rows}
          error={!!error}
          helperText={error?.message || helperText}
          SelectProps={{ native: true }}
        >
          {select && options?.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <Stack direction="column" spacing={2} sx={{ py: 1 }}>
      <Typography variant="subtitle1" fontWeight={600} color="text.primary" sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

interface FormLayoutProps {
  schema: ZodSchema;
  defaultValues?: Record<string, any>;
  onSubmit: (data: any) => void;
  children: (fields: ReturnType<typeof useForm>) => React.ReactNode;
  submitLabel?: string;
  loading?: boolean;
}

export function FormLayout({ schema, defaultValues, onSubmit, children, submitLabel = 'Save', loading = false }: FormLayoutProps) {
  const methods = useForm({ resolver: zodResolver(schema), defaultValues, mode: 'onChange' });

  const handleSubmit = methods.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submit error:', error);
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {children(methods)}
        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ pt: 2, borderTop: 1, borderColor: 'divider', mt: 'auto' }}>
          <Button type="button" variant="outlined" onClick={methods.reset}>Reset</Button>
          <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Saving...' : submitLabel}</Button>
        </Stack>
      </form>
    </FormProvider>
  );
}