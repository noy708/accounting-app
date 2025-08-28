import React, { useState } from 'react';
import {
  Box,
  Grid,
  IconButton,
  TextField,
  Typography,
  Paper,
  Tooltip,
} from '@mui/material';
import { Circle as CircleIcon } from '@mui/icons-material';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

// Predefined color palette
const COLOR_PALETTE = [
  // Primary colors
  '#1976d2',
  '#1565c0',
  '#0d47a1', // Blues
  '#388e3c',
  '#2e7d32',
  '#1b5e20', // Greens
  '#f57c00',
  '#ef6c00',
  '#e65100', // Oranges
  '#d32f2f',
  '#c62828',
  '#b71c1c', // Reds
  '#7b1fa2',
  '#6a1b9a',
  '#4a148c', // Purples
  '#00796b',
  '#00695c',
  '#004d40', // Teals

  // Secondary colors
  '#303f9f',
  '#3f51b5',
  '#5c6bc0', // Indigos
  '#689f38',
  '#8bc34a',
  '#aed581', // Light greens
  '#ff9800',
  '#ffb74d',
  '#ffcc02', // Ambers
  '#e91e63',
  '#f06292',
  '#f8bbd9', // Pinks
  '#9c27b0',
  '#ba68c8',
  '#ce93d8', // Light purples
  '#009688',
  '#4db6ac',
  '#80cbc4', // Light teals

  // Neutral colors
  '#424242',
  '#616161',
  '#757575', // Grays
  '#795548',
  '#8d6e63',
  '#a1887f', // Browns
  '#607d8b',
  '#78909c',
  '#90a4ae', // Blue grays
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [customColor, setCustomColor] = useState(value);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
  };

  const handleCustomColorChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newColor = event.target.value;
    setCustomColor(newColor);

    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
      onChange(newColor);
    }
  };

  const isValidHexColor = (color: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(color);
  };

  return (
    <Box>
      {/* Current color preview */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <CircleIcon
          sx={{
            color: value,
            fontSize: 32,
            filter: disabled ? 'grayscale(100%)' : 'none',
          }}
        />
        <Typography variant="body2" color="text.secondary">
          選択中の色: {value}
        </Typography>
      </Box>

      {/* Color palette */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        プリセットカラー
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={1}>
          {COLOR_PALETTE.map((color) => (
            <Grid key={color}>
              <Tooltip title={color}>
                <IconButton
                  onClick={() => handleColorSelect(color)}
                  disabled={disabled}
                  sx={{
                    width: 32,
                    height: 32,
                    border: value === color ? '2px solid' : '1px solid',
                    borderColor: value === color ? 'primary.main' : 'divider',
                    borderRadius: '50%',
                    p: 0,
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <CircleIcon
                    sx={{
                      color: color,
                      fontSize: 24,
                      filter: disabled ? 'grayscale(100%)' : 'none',
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Custom color input */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        カスタムカラー
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          size="small"
          label="色コード"
          value={customColor}
          onChange={handleCustomColorChange}
          disabled={disabled}
          placeholder="#1976d2"
          error={!isValidHexColor(customColor)}
          helperText={
            !isValidHexColor(customColor)
              ? '有効な色コード（例: #1976d2）を入力してください'
              : undefined
          }
          sx={{ minWidth: 120 }}
          inputProps={{
            pattern: '^#[0-9A-Fa-f]{6}$',
            maxLength: 7,
          }}
        />
        <input
          type="color"
          value={isValidHexColor(customColor) ? customColor : '#1976d2'}
          onChange={(e) => handleColorSelect(e.target.value)}
          disabled={disabled}
          style={{
            width: 40,
            height: 40,
            border: 'none',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            filter: disabled ? 'grayscale(100%)' : 'none',
          }}
        />
      </Box>
    </Box>
  );
};
