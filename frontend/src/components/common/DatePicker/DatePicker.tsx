import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  format?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  variant?: 'outlined' | 'filled' | 'standard';
}

const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  error = false,
  helperText,
  disabled = false,
  required = false,
  minDate,
  maxDate,
  format = 'dd/MM/yyyy',
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MuiDatePicker
        label={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        format={format}
        slotProps={{
          textField: {
            fullWidth,
            size,
            variant,
            error,
            helperText,
            required,
            sx: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            },
          } as TextFieldProps,
        }}
      />
    </LocalizationProvider>
  );
};

export default DatePicker;