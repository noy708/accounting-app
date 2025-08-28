// Tests for YearSelector component
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { YearSelector } from '../YearSelector';

describe('YearSelector', () => {
  const mockOnYearChange = jest.fn();
  const currentYear = new Date().getFullYear();

  beforeEach(() => {
    mockOnYearChange.mockClear();
  });

  it('renders with current year selected', () => {
    render(<YearSelector year={currentYear} onYearChange={mockOnYearChange} />);

    expect(
      screen.getByDisplayValue(currentYear.toString())
    ).toBeInTheDocument();
  });

  it('calls onYearChange when year is selected from dropdown', () => {
    render(<YearSelector year={currentYear} onYearChange={mockOnYearChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    const option = screen.getByRole('option', { name: `${currentYear - 1}年` });
    fireEvent.click(option);

    expect(mockOnYearChange).toHaveBeenCalledWith(currentYear - 1);
  });

  it('navigates to previous year when left arrow is clicked', () => {
    render(<YearSelector year={currentYear} onYearChange={mockOnYearChange} />);

    const prevButton = screen.getByLabelText('前の年');
    fireEvent.click(prevButton);

    expect(mockOnYearChange).toHaveBeenCalledWith(currentYear - 1);
  });

  it('navigates to next year when right arrow is clicked', () => {
    render(<YearSelector year={currentYear} onYearChange={mockOnYearChange} />);

    const nextButton = screen.getByLabelText('次の年');
    fireEvent.click(nextButton);

    expect(mockOnYearChange).toHaveBeenCalledWith(currentYear + 1);
  });

  it('disables previous button when at minimum year', () => {
    const minYear = 2020;
    render(
      <YearSelector
        year={minYear}
        onYearChange={mockOnYearChange}
        minYear={minYear}
      />
    );

    const prevButton = screen.getByLabelText('前の年');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button when at maximum year', () => {
    const maxYear = 2025;
    render(
      <YearSelector
        year={maxYear}
        onYearChange={mockOnYearChange}
        maxYear={maxYear}
      />
    );

    const nextButton = screen.getByLabelText('次の年');
    expect(nextButton).toBeDisabled();
  });

  it('respects custom min and max year range', () => {
    const minYear = 2020;
    const maxYear = 2025;

    render(
      <YearSelector
        year={2022}
        onYearChange={mockOnYearChange}
        minYear={minYear}
        maxYear={maxYear}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    // Should have years from 2020 to 2025 (6 years total)
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(6);

    // Should be in descending order (newest first)
    expect(options[0]).toHaveTextContent('2025年');
    expect(options[5]).toHaveTextContent('2020年');
  });

  it('applies custom className', () => {
    const { container } = render(
      <YearSelector
        year={currentYear}
        onYearChange={mockOnYearChange}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('does not call onYearChange when clicking disabled buttons', () => {
    const minYear = 2020;
    render(
      <YearSelector
        year={minYear}
        onYearChange={mockOnYearChange}
        minYear={minYear}
      />
    );

    const prevButton = screen.getByLabelText('前の年');
    fireEvent.click(prevButton);

    expect(mockOnYearChange).not.toHaveBeenCalled();
  });

  it('renders years in descending order', () => {
    render(
      <YearSelector
        year={2022}
        onYearChange={mockOnYearChange}
        minYear={2020}
        maxYear={2023}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    const options = screen.getAllByRole('option');
    const yearTexts = options.map((option) => option.textContent);

    expect(yearTexts).toEqual(['2023年', '2022年', '2021年', '2020年']);
  });
});
