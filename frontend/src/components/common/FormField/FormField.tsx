import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Box,
  useTheme,
} from '@mui/material';
import { FormField as FormFieldType } from '../../../types';
import DatePicker from '../DatePicker/DatePicker';

interface FormFieldProps {
  field: FormFieldType;
  value: any;
  onChange: (name: string, value: any) => void;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

const FormField: React.FC<FormFieldProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
  fullWidth = true,
  size = 'medium',
}) => {
  const theme = useTheme();

  const handleChange = (newValue: any) => {
    onChange(field.name, newValue);
  };

  const commonProps = {
    fullWidth,
    size,
    disabled: disabled || field.disabled,
    error: !!error,
    helperText: error,
    required: field.required,
    sx: {
      '& .MuiOutlinedInput-root': {
        borderRadius: 2,
      },
    },
  };

  switch (field.type) {
    case 'select':
      return (
        <FormControl {...commonProps}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            label={field.label}
          >
            {field.options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {error && <FormHelperText error>{error}</FormHelperText>}
        </FormControl>
      );

    case 'textarea':
      return (
        <TextField
          {...commonProps}
          label={field.label}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder}
          multiline
          rows={4}
        />
      );

    case 'date':
      return (
        <DatePicker
          label={field.label}
          value={value ? new Date(value) : null}
          onChange={(date) => handleChange(date)}
          error={!!error}
          helperText={error}
          disabled={disabled || field.disabled}
          required={field.required}
          fullWidth={fullWidth}
          size={size}
        />
      );

    case 'checkbox':
      return (
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => handleChange(e.target.checked)}
                disabled={disabled || field.disabled}
              />
            }
            label={field.label}
          />
          {error && <FormHelperText error>{error}</FormHelperText>}
        </Box>
      );

    case 'number':
      return (
        <TextField
          {...commonProps}
          type="number"
          label={field.label}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder}
          inputProps={{
            min: 0,
            step: field.name.includes('price') || field.name.includes('amount') ? '0.01' : '1',
          }}
        />
      );

    case 'email':
      return (
        <TextField
          {...commonProps}
          type="email"
          label={field.label}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );

    case 'password':
      return (
        <TextField
          {...commonProps}
          type="password"
          label={field.label}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );

    default:
      return (
        <TextField
          {...commonProps}
          label={field.label}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
  }
};

export default FormField;