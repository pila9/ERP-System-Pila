import { TextField, Select, MenuItem, InputLabel, FormControl, Button, Box, Grid, IconButton } from '@mui/material';
import { FilterList, Clear } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface FilterField {
  name: string;
  label: string;
  type?: 'text' | 'select' | 'date' | 'number';
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

interface FilterBarProps {
  fields: FilterField[];
  onSearch: (filters: Record<string, any>) => void;
  onClear: () => void;
  loading?: boolean;
  defaultValues?: Record<string, any>;
}

export function FilterBar({ fields, onSearch, onClear, loading = false, defaultValues }: FilterBarProps) {
  const schema = z.object(
    fields.reduce((acc, field) => {
      acc[field.name] = field.type === 'number' ? z.number().optional() : z.string().optional();
      return acc;
    }, {} as Record<string, any>)
  );

  const methods = useForm({ resolver: zodResolver(schema), defaultValues, mode: 'onChange' });

  const handleSubmit = methods.handleSubmit((data) => {
    const filters = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== '' && v !== undefined));
    onSearch(filters);
  });

  return (
    <form onSubmit={handleSubmit} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end', p: 2, bgcolor: 'grey.50', borderRadius: 2, border: 1, borderColor: 'divider' }}>
      {fields.map(field => (
        <Controller
          key={field.name}
          name={field.name}
          control={methods.control}
          render={({ field }) => {
            const commonProps = { ...field, fullWidth: true, size: 'small' as const, placeholder: field.placeholder };
            switch (field.type) {
              case 'select':
                return (
                  <FormControl {...commonProps}>
                    <InputLabel htmlFor={field.name}>{field.label}</InputLabel>
                    <Select native id={field.name} value={field.value} onChange={field.onChange}>
                      <option value="">{field.placeholder || 'All'}</option>
                      {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                  </FormControl>
                );
              case 'date':
                return <TextField type="date" {...commonProps} InputLabelProps={{ shrink: true }} />;
              case 'number':
                return <TextField type="number" {...commonProps} InputLabelProps={{ shrink: true }} />;
              default:
                return <TextField {...commonProps} InputLabelProps={{ shrink: true }} />;
            }
          }}
        />
      ))}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <Button type="submit" variant="contained" startIcon={<FilterList />} disabled={loading} size="small">
          Search
        </Button>
        <Button type="button" variant="outlined" startIcon={<Clear />} onClick={() => { methods.reset(); onClear(); }} size="small">
          Clear
        </Button>
      </Box>
    </form>
  );
}