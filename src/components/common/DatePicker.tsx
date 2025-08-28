import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { format, parse, isValid } from 'date-fns';

interface DatePickerProps extends Omit<TextFieldProps, 'value' | 'onChange'> {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  dateFormat?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  dateFormat = 'yyyy-MM-dd',
  label = '日付',
  error,
  helperText,
  ...textFieldProps
}) => {
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return format(date, dateFormat);
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    try {
      // For HTML date input, the value is always in yyyy-MM-dd format
      if (dateFormat === 'yyyy-MM-dd') {
        const parsed = new Date(dateString + 'T00:00:00');
        return isValid(parsed) ? parsed : null;
      }
      const parsed = parse(dateString, dateFormat, new Date());
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const parsedDate = parseDate(inputValue);

    // Validate date range
    if (parsedDate) {
      if (minDate && parsedDate < minDate) {
        return; // Don't update if before min date
      }
      if (maxDate && parsedDate > maxDate) {
        return; // Don't update if after max date
      }
    }

    onChange(parsedDate);
  };

  const getHelperText = (): React.ReactNode => {
    if (helperText) return helperText;

    let text = `形式: ${dateFormat}`;
    if (minDate || maxDate) {
      text += ' (';
      if (minDate) {
        text += `${format(minDate, dateFormat)}以降`;
      }
      if (minDate && maxDate) {
        text += '〜';
      }
      if (maxDate) {
        text += `${format(maxDate, dateFormat)}以前`;
      }
      text += ')';
    }

    return text;
  };

  const isDateInvalid = (): boolean => {
    if (!value) return false;

    if (minDate && value < minDate) return true;
    if (maxDate && value > maxDate) return true;

    return false;
  };

  return (
    <TextField
      {...textFieldProps}
      type="date"
      label={label}
      value={formatDate(value)}
      onChange={handleChange}
      error={error || isDateInvalid()}
      helperText={getHelperText()}
      InputLabelProps={{
        shrink: true,
      }}
      inputProps={{
        min: minDate ? formatDate(minDate) : undefined,
        max: maxDate ? formatDate(maxDate) : undefined,
      }}
    />
  );
};

export default DatePicker;
