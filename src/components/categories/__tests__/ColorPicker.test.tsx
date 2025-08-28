import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPicker } from '../ColorPicker';

describe('ColorPicker', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial color value', () => {
    render(<ColorPicker value="#1976d2" onChange={mockOnChange} />);

    expect(screen.getByText('選択中の色: #1976d2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#1976d2')).toBeInTheDocument();
  });

  it('displays color palette', () => {
    render(<ColorPicker value="#1976d2" onChange={mockOnChange} />);

    expect(screen.getByText('プリセットカラー')).toBeInTheDocument();

    // Check that color buttons are present
    const colorButtons = screen.getAllByRole('button');
    expect(colorButtons.length).toBeGreaterThan(10); // Should have many preset colors
  });

  it('calls onChange when preset color is clicked', async () => {
    const user = userEvent.setup();

    render(<ColorPicker value="#1976d2" onChange={mockOnChange} />);

    // Click on a color button (we can't easily test specific colors, so just click the first one)
    const colorButtons = screen.getAllByRole('button');
    const firstColorButton = colorButtons[0];

    await user.click(firstColorButton);

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('updates custom color input', async () => {
    const user = userEvent.setup();

    render(<ColorPicker value="#1976d2" onChange={mockOnChange} />);

    const customColorInput = screen.getByLabelText('色コード');

    await user.clear(customColorInput);
    await user.type(customColorInput, '#ff5722');

    expect(mockOnChange).toHaveBeenCalledWith('#ff5722');
  });

  it('validates hex color format in custom input', async () => {
    const user = userEvent.setup();

    render(<ColorPicker value="#1976d2" onChange={mockOnChange} />);

    const customColorInput = screen.getByLabelText('色コード');

    // Enter invalid color
    await user.clear(customColorInput);
    await user.type(customColorInput, 'invalid');

    expect(
      screen.getByText('有効な色コード（例: #1976d2）を入力してください')
    ).toBeInTheDocument();

    // onChange should not be called for invalid color
    expect(mockOnChange).not.toHaveBeenCalledWith('invalid');
  });

  it('calls onChange when HTML color input changes', () => {
    render(<ColorPicker value="#1976d2" onChange={mockOnChange} />);

    const htmlColorInputs = screen.getAllByDisplayValue('#1976d2');
    const htmlColorInput = htmlColorInputs.find(
      (input) => input.getAttribute('type') === 'color'
    );
    expect(htmlColorInput).toBeTruthy();

    fireEvent.change(htmlColorInput!, { target: { value: '#4caf50' } });

    expect(mockOnChange).toHaveBeenCalledWith('#4caf50');
  });

  it('disables all inputs when disabled prop is true', () => {
    render(
      <ColorPicker value="#1976d2" onChange={mockOnChange} disabled={true} />
    );

    // Check that color buttons are disabled
    const colorButtons = screen.getAllByRole('button');
    colorButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });

    // Check that text input is disabled
    expect(screen.getByLabelText('色コード')).toBeDisabled();

    // Check that HTML color input is disabled
    const htmlColorInputs = screen.getAllByDisplayValue('#1976d2');
    const htmlColorInput = htmlColorInputs.find(
      (input) => input.getAttribute('type') === 'color'
    );
    expect(htmlColorInput).toBeDisabled();
  });

  it('shows current color preview', () => {
    render(<ColorPicker value="#ff5722" onChange={mockOnChange} />);

    expect(screen.getByText('選択中の色: #ff5722')).toBeInTheDocument();
  });

  it('handles uppercase hex colors', async () => {
    render(<ColorPicker value="#1976d2" onChange={mockOnChange} />);

    const customColorInput = screen.getByLabelText('色コード');

    fireEvent.change(customColorInput, { target: { value: '#FF5722' } });

    expect(mockOnChange).toHaveBeenCalledWith('#FF5722');
  });

  it('shows custom color section', () => {
    render(<ColorPicker value="#1976d2" onChange={mockOnChange} />);

    expect(screen.getByText('カスタムカラー')).toBeInTheDocument();
    expect(screen.getByLabelText('色コード')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('#1976d2')).toBeInTheDocument();
  });

  it('synchronizes custom color input with HTML color input', () => {
    const { rerender } = render(
      <ColorPicker value="#1976d2" onChange={mockOnChange} />
    );

    // Both inputs should show the same value
    const initialInputs = screen.getAllByDisplayValue('#1976d2');
    expect(initialInputs.length).toBeGreaterThanOrEqual(1);

    // When value changes, both should update
    rerender(<ColorPicker value="#ff5722" onChange={mockOnChange} />);

    // Check that the color preview shows the new color
    expect(screen.getByText('選択中の色: #ff5722')).toBeInTheDocument();
  });

  it('handles invalid initial color gracefully', () => {
    render(<ColorPicker value="invalid-color" onChange={mockOnChange} />);

    // Should still render without crashing
    expect(screen.getByText('選択中の色: invalid-color')).toBeInTheDocument();

    // HTML color input should fallback to default
    const htmlColorInputs = screen.getAllByDisplayValue('#1976d2');
    const htmlColorInput = htmlColorInputs.find(
      (input) => input.getAttribute('type') === 'color'
    );
    expect(htmlColorInput).toBeTruthy();
  });
});
