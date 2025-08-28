import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CategorySelector from '../CategorySelector';
import { Category } from '../../../types';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

const mockCategories: Category[] = [
  {
    id: '1',
    name: '食費',
    color: '#ff0000',
    type: 'expense',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: '給与',
    color: '#00ff00',
    type: 'income',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: '交通費',
    color: '#0000ff',
    type: 'expense',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('CategorySelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    renderWithTheme(
      <CategorySelector
        value={null}
        onChange={mockOnChange}
        categories={mockCategories}
      />
    );

    expect(screen.getByLabelText('カテゴリ')).toBeInTheDocument();
  });

  it('displays categories in dropdown', () => {
    renderWithTheme(
      <CategorySelector
        value={null}
        onChange={mockOnChange}
        categories={mockCategories}
      />
    );

    const select = screen.getByLabelText('カテゴリ');
    fireEvent.mouseDown(select);

    expect(screen.getByText('食費')).toBeInTheDocument();
    expect(screen.getByText('給与')).toBeInTheDocument();
    expect(screen.getByText('交通費')).toBeInTheDocument();
  });

  it('calls onChange when category is selected', () => {
    renderWithTheme(
      <CategorySelector
        value={null}
        onChange={mockOnChange}
        categories={mockCategories}
      />
    );

    const select = screen.getByLabelText('カテゴリ');
    fireEvent.mouseDown(select);

    const foodOption = screen.getByText('食費');
    fireEvent.click(foodOption);

    expect(mockOnChange).toHaveBeenCalledWith('1');
  });

  it('displays selected category', () => {
    renderWithTheme(
      <CategorySelector
        value="1"
        onChange={mockOnChange}
        categories={mockCategories}
      />
    );

    expect(screen.getByText('食費')).toBeInTheDocument();
  });

  it('filters categories by type', () => {
    renderWithTheme(
      <CategorySelector
        value={null}
        onChange={mockOnChange}
        categories={mockCategories}
        filterByType="expense"
      />
    );

    const select = screen.getByLabelText('カテゴリ');
    fireEvent.mouseDown(select);

    expect(screen.getByText('食費')).toBeInTheDocument();
    expect(screen.getByText('交通費')).toBeInTheDocument();
    expect(screen.queryByText('給与')).not.toBeInTheDocument();
  });

  it('shows empty option when allowed', () => {
    renderWithTheme(
      <CategorySelector
        value={null}
        onChange={mockOnChange}
        categories={mockCategories}
        allowEmpty={true}
        emptyLabel="未選択"
      />
    );

    const select = screen.getByLabelText('カテゴリ');
    fireEvent.mouseDown(select);

    expect(screen.getByText('未選択')).toBeInTheDocument();
  });

  it('handles empty selection', () => {
    renderWithTheme(
      <CategorySelector
        value="1"
        onChange={mockOnChange}
        categories={mockCategories}
        allowEmpty={true}
        emptyLabel="未選択"
      />
    );

    const select = screen.getByLabelText('カテゴリ');
    fireEvent.mouseDown(select);

    const emptyOption = screen.getByText('未選択');
    fireEvent.click(emptyOption);

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('shows default category chip', () => {
    renderWithTheme(
      <CategorySelector
        value={null}
        onChange={mockOnChange}
        categories={mockCategories}
      />
    );

    const select = screen.getByLabelText('カテゴリ');
    fireEvent.mouseDown(select);

    expect(screen.getAllByText('デフォルト')).toHaveLength(2); // 食費 and 給与
  });

  it('hides colors when showColors is false', () => {
    renderWithTheme(
      <CategorySelector
        value="1"
        onChange={mockOnChange}
        categories={mockCategories}
        showColors={false}
      />
    );

    // Color circles should not be present
    const colorElements = screen
      .queryAllByRole('generic')
      .filter((el) => el.style.backgroundColor);
    expect(colorElements).toHaveLength(0);
  });

  it('groups categories by type when enabled', () => {
    renderWithTheme(
      <CategorySelector
        value={null}
        onChange={mockOnChange}
        categories={mockCategories}
        groupByType={true}
      />
    );

    const select = screen.getByLabelText('カテゴリ');
    fireEvent.mouseDown(select);

    expect(screen.getByText('収入')).toBeInTheDocument();
    expect(screen.getByText('支出')).toBeInTheDocument();
  });
});
