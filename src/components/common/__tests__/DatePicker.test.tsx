import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DatePicker from '../DatePicker';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('DatePicker', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    renderWithTheme(<DatePicker value={null} onChange={mockOnChange} />);

    expect(screen.getByLabelText('日付')).toBeInTheDocument();
  });

  it('displays formatted date value', () => {
    const testDate = new Date('2023-12-25');
    renderWithTheme(<DatePicker value={testDate} onChange={mockOnChange} />);

    const input = screen.getByDisplayValue('2023-12-25');
    expect(input).toBeInTheDocument();
  });

  it('calls onChange when date is changed', () => {
    renderWithTheme(<DatePicker value={null} onChange={mockOnChange} />);

    const input = screen.getByLabelText('日付');
    fireEvent.change(input, { target: { value: '2023-12-25' } });

    expect(mockOnChange).toHaveBeenCalledWith(new Date('2023-12-25T00:00:00'));
  });

  it('handles empty date input', () => {
    renderWithTheme(
      <DatePicker value={new Date('2023-12-25')} onChange={mockOnChange} />
    );

    const input = screen.getByLabelText('日付');
    fireEvent.change(input, { target: { value: '' } });

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('respects min date constraint', () => {
    const minDate = new Date('2023-12-01');
    const testDate = new Date('2023-11-30'); // Before min date

    renderWithTheme(
      <DatePicker value={null} onChange={mockOnChange} minDate={minDate} />
    );

    const input = screen.getByLabelText('日付');
    fireEvent.change(input, { target: { value: '2023-11-30' } });

    // Should not call onChange for date before minDate
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('respects max date constraint', () => {
    const maxDate = new Date('2023-12-31');

    renderWithTheme(
      <DatePicker value={null} onChange={mockOnChange} maxDate={maxDate} />
    );

    const input = screen.getByLabelText('日付');
    fireEvent.change(input, { target: { value: '2024-01-01' } });

    // Should not call onChange for date after maxDate
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('shows helper text with date format', () => {
    renderWithTheme(<DatePicker value={null} onChange={mockOnChange} />);

    expect(screen.getByText('形式: yyyy-MM-dd')).toBeInTheDocument();
  });

  it('shows custom helper text when provided', () => {
    renderWithTheme(
      <DatePicker
        value={null}
        onChange={mockOnChange}
        helperText="カスタムヘルプテキスト"
      />
    );

    expect(screen.getByText('カスタムヘルプテキスト')).toBeInTheDocument();
  });

  it('uses custom date format', () => {
    const testDate = new Date('2023-12-25');
    renderWithTheme(
      <DatePicker
        value={testDate}
        onChange={mockOnChange}
        dateFormat="MM/dd/yyyy"
      />
    );

    // HTML date input always shows yyyy-MM-dd format, but helper text shows custom format
    expect(screen.getByText('形式: MM/dd/yyyy')).toBeInTheDocument();
  });
});
