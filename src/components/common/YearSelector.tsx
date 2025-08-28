// Year selector component for yearly reports
import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface YearSelectorProps {
  year: number;
  onYearChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
  className?: string;
}

export const YearSelector: React.FC<YearSelectorProps> = ({
  year,
  onYearChange,
  minYear = 2020,
  maxYear = new Date().getFullYear() + 1,
  className,
}) => {
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i
  ).reverse(); // 新しい年から順に表示

  const handlePreviousYear = () => {
    if (year > minYear) {
      onYearChange(year - 1);
    }
  };

  const handleNextYear = () => {
    if (year < maxYear) {
      onYearChange(year + 1);
    }
  };

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <IconButton
        onClick={handlePreviousYear}
        disabled={year <= minYear}
        size="small"
        aria-label="前の年"
      >
        <ChevronLeft />
      </IconButton>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel id="year-selector-label">年</InputLabel>
        <Select
          labelId="year-selector-label"
          value={year}
          label="年"
          onChange={(e) => onYearChange(Number(e.target.value))}
        >
          {years.map((yearOption) => (
            <MenuItem key={yearOption} value={yearOption}>
              {yearOption}年
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <IconButton
        onClick={handleNextYear}
        disabled={year >= maxYear}
        size="small"
        aria-label="次の年"
      >
        <ChevronRight />
      </IconButton>
    </Box>
  );
};

export default YearSelector;
