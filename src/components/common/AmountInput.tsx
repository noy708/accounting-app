import React, { useState, useEffect } from 'react';
import { TextField, TextFieldProps, InputAdornment } from '@mui/material';

interface AmountInputProps
  extends Omit<TextFieldProps, 'value' | 'onChange' | 'type'> {
  value: number | null;
  onChange: (amount: number | null) => void;
  currency?: string;
  allowNegative?: boolean;
  allowZero?: boolean;
  maxAmount?: number;
  minAmount?: number;
  decimalPlaces?: number;
}

const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  currency = '¥',
  allowNegative = false,
  allowZero = false,
  maxAmount,
  minAmount,
  decimalPlaces = 0,
  label = '金額',
  error,
  helperText,
  ...textFieldProps
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  // Format number for display
  const formatAmount = (amount: number | null): string => {
    if (amount === null || amount === undefined) return '';
    return amount.toLocaleString('ja-JP', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  };

  // Parse display value to number
  const parseAmount = (value: string): number | null => {
    if (!value.trim()) return null;

    // Remove commas and other formatting
    const cleanValue = value.replace(/[,\s]/g, '');
    const parsed = parseFloat(cleanValue);

    if (isNaN(parsed)) return null;
    return parsed;
  };

  // Update display value when prop value changes
  useEffect(() => {
    const formattedValue =
      value === null || value === undefined
        ? ''
        : value.toLocaleString('ja-JP', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          });
    setDisplayValue(formattedValue);
  }, [value, decimalPlaces]);

  // Validate amount
  const validateAmount = (amount: number | null): string => {
    if (amount === null) return '';

    if (!allowNegative && amount < 0) {
      return '負の値は入力できません';
    }

    if (!allowZero && amount === 0) {
      return '0より大きい値を入力してください';
    }

    const effectiveMinAmount =
      minAmount !== undefined ? minAmount : allowZero ? 0 : 1;
    if (amount < effectiveMinAmount) {
      return `最小値は${formatAmount(effectiveMinAmount)}です`;
    }

    if (maxAmount !== undefined && amount > maxAmount) {
      return `最大値は${formatAmount(maxAmount)}です`;
    }

    return '';
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setDisplayValue(inputValue);

    const parsedAmount = parseAmount(inputValue);
    const validationMsg = validateAmount(parsedAmount);
    setValidationError(validationMsg);

    // Always call onChange, but set validation error if needed
    onChange(parsedAmount);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    // Format the display value on blur
    const parsedAmount = parseAmount(displayValue);
    if (parsedAmount !== null && !validationError) {
      setDisplayValue(formatAmount(parsedAmount));
    }

    // Call original onBlur if provided
    if (textFieldProps.onBlur) {
      textFieldProps.onBlur(event);
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    // Remove formatting on focus for easier editing
    if (value !== null) {
      setDisplayValue(value.toString());
    }

    // Call original onFocus if provided
    if (textFieldProps.onFocus) {
      textFieldProps.onFocus(event);
    }
  };

  const getHelperText = (): React.ReactNode => {
    if (validationError) return validationError;
    if (helperText) return helperText;

    let text = '';
    const effectiveMinAmount =
      minAmount !== undefined ? minAmount : allowZero ? 0 : 1;

    if (effectiveMinAmount !== undefined || maxAmount !== undefined) {
      text = '範囲: ';
      if (effectiveMinAmount !== undefined) {
        text += `${formatAmount(effectiveMinAmount)}`;
      }
      if (effectiveMinAmount !== undefined && maxAmount !== undefined) {
        text += ' 〜 ';
      }
      if (maxAmount !== undefined) {
        text += `${formatAmount(maxAmount)}`;
      }
    }

    return text;
  };

  return (
    <TextField
      {...textFieldProps}
      label={label}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      error={error || !!validationError}
      helperText={getHelperText()}
      InputProps={{
        startAdornment: currency ? (
          <InputAdornment position="start">{currency}</InputAdornment>
        ) : undefined,
        ...textFieldProps.InputProps,
      }}
      inputProps={{
        inputMode: 'decimal',
        pattern: allowNegative ? '[0-9,-]*' : '[0-9,]*',
        ...textFieldProps.inputProps,
      }}
    />
  );
};

export default AmountInput;
