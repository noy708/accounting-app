import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AmountInput from '../AmountInput';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('AmountInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    renderWithTheme(<AmountInput value={null} onChange={mockOnChange} />);

    expect(screen.getByLabelText('金額')).toBeInTheDocument();
    expect(screen.getByText('¥')).toBeInTheDocument();
  });

  it('displays formatted amount value', () => {
    renderWithTheme(<AmountInput value={1000} onChange={mockOnChange} />);

    expect(screen.getByDisplayValue('1,000')).toBeInTheDocument();
  });

  it('calls onChange when amount is changed', () => {
    renderWithTheme(<AmountInput value={null} onChange={mockOnChange} />);

    const input = screen.getByLabelText('金額');
    fireEvent.change(input, { target: { value: '1000' } });

    expect(mockOnChange).toHaveBeenCalledWith(1000);
  });

  it('handles empty input', () => {
    renderWithTheme(<AmountInput value={1000} onChange={mockOnChange} />);

    const input = screen.getByLabelText('金額');
    fireEvent.change(input, { target: { value: '' } });

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('validates negative values when not allowed', () => {
    renderWithTheme(
      <AmountInput value={null} onChange={mockOnChange} allowNegative={false} />
    );

    const input = screen.getByLabelText('金額');
    fireEvent.change(input, { target: { value: '-100' } });

    expect(screen.getByText('負の値は入力できません')).toBeInTheDocument();
  });

  it('allows negative values when enabled', () => {
    renderWithTheme(
      <AmountInput value={null} onChange={mockOnChange} allowNegative={true} />
    );

    const input = screen.getByLabelText('金額');
    fireEvent.change(input, { target: { value: '-100' } });

    // Should not show validation error
    expect(
      screen.queryByText('負の値は入力できません')
    ).not.toBeInTheDocument();
    expect(mockOnChange).toHaveBeenCalledWith(-100);
  });

  it('validates minimum amount', () => {
    renderWithTheme(
      <AmountInput value={null} onChange={mockOnChange} minAmount={100} />
    );

    const input = screen.getByLabelText('金額');
    fireEvent.change(input, { target: { value: '50' } });

    expect(screen.getByText('最小値は100です')).toBeInTheDocument();
  });

  it('validates maximum amount', () => {
    renderWithTheme(
      <AmountInput value={null} onChange={mockOnChange} maxAmount={1000} />
    );

    const input = screen.getByLabelText('金額');
    fireEvent.change(input, { target: { value: '2000' } });

    expect(screen.getByText('最大値は1,000です')).toBeInTheDocument();
  });

  it('formats value on blur', () => {
    renderWithTheme(<AmountInput value={null} onChange={mockOnChange} />);

    const input = screen.getByLabelText('金額');
    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.blur(input);

    expect(screen.getByDisplayValue('1,000')).toBeInTheDocument();
  });

  it('removes formatting on focus', () => {
    renderWithTheme(<AmountInput value={1000} onChange={mockOnChange} />);

    const input = screen.getByLabelText('金額');
    fireEvent.focus(input);

    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
  });

  it('uses custom currency symbol', () => {
    renderWithTheme(
      <AmountInput value={null} onChange={mockOnChange} currency="$" />
    );

    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('handles decimal places', () => {
    renderWithTheme(
      <AmountInput value={10.5} onChange={mockOnChange} decimalPlaces={2} />
    );

    expect(screen.getByDisplayValue('10.50')).toBeInTheDocument();
  });

  it('shows range helper text', () => {
    renderWithTheme(
      <AmountInput
        value={null}
        onChange={mockOnChange}
        minAmount={100}
        maxAmount={1000}
      />
    );

    expect(screen.getByText('範囲: 100 〜 1,000')).toBeInTheDocument();
  });
});
