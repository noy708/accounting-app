// Reusable month and year selector component
import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
// Using simple month names instead of date-fns to avoid Jest issues

interface MonthSelectorProps {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  yearRange?: { start: number; end: number };
  size?: 'small' | 'medium';
  disabled?: boolean;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({
  year,
  month,
  onYearChange,
  onMonthChange,
  yearRange = { start: 2020, end: new Date().getFullYear() + 1 },
  size = 'medium',
  disabled = false,
}) => {
  // Generate year options
  const yearOptions = Array.from(
    { length: yearRange.end - yearRange.start + 1 },
    (_, i) => yearRange.start + i
  );

  // Month options with Japanese names
  const monthOptions = [
    { value: 1, label: '1月' },
    { value: 2, label: '2月' },
    { value: 3, label: '3月' },
    { value: 4, label: '4月' },
    { value: 5, label: '5月' },
    { value: 6, label: '6月' },
    { value: 7, label: '7月' },
    { value: 8, label: '8月' },
    { value: 9, label: '9月' },
    { value: 10, label: '10月' },
    { value: 11, label: '11月' },
    { value: 12, label: '12月' },
  ];

  return (
    <Box display="flex" gap={2} alignItems="center">
      <FormControl size={size} sx={{ minWidth: 120 }} disabled={disabled}>
        <InputLabel>年</InputLabel>
        <Select
          value={year}
          label="年"
          onChange={(e) => onYearChange(Number(e.target.value))}
        >
          {yearOptions.map((yearOption) => (
            <MenuItem key={yearOption} value={yearOption}>
              {yearOption}年
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size={size} sx={{ minWidth: 120 }} disabled={disabled}>
        <InputLabel>月</InputLabel>
        <Select
          value={month}
          label="月"
          onChange={(e) => onMonthChange(Number(e.target.value))}
        >
          {monthOptions.map((monthOption) => (
            <MenuItem key={monthOption.value} value={monthOption.value}>
              {monthOption.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default MonthSelector;