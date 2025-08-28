// Reusable month and year selector component
import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
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

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  year,
  month,
  onYearChange,
  onMonthChange,
  yearRange,
  size = 'small',
  disabled = false,
}) => {
  const currentDate = new Date();

  // デフォルトの年範囲（過去5年から未来1年まで）
  const defaultYearRange = {
    start: currentDate.getFullYear() - 5,
    end: currentDate.getFullYear() + 1,
  };

  const range = yearRange || defaultYearRange;
  const yearOptions = Array.from(
    { length: range.end - range.start + 1 },
    (_, i) => range.start + i
  );

  // 月の選択肢
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
    <Grid container spacing={2} alignItems="center">
      <Grid item>
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
      </Grid>
      <Grid item>
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
      </Grid>
    </Grid>
  );
};
