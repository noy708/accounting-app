import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';

import TransactionForm from '../TransactionForm';
import { Category, CreateTransactionDto } from '../../../types';

// Mock the API hooks
const mockCreateTransaction = jest.fn();
const mockGetCategoriesByType = jest.fn();

jest.mock('../../../store/api', () => ({
  useCreateTransactionMutation: () => [
    mockCreateTransaction,
    { isLoading: false, error: null },
  ],
  useGetCategoriesByTypeQuery: () => mockGetCategoriesByType(),
}));

// Mock common components
jest.mock('../../common/AmountInput', () => {
  return function MockAmountInput({
    value,
    onChange,
    label,
    error,
    helperText,
    ...props
  }: any) {
    return (
      <div data-testid="amount-input">
        <label>{label}</label>
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || null)}
          data-error={error}
          {...props}
        />
        {helperText && <div data-testid="helper-text">{helperText}</div>}
      </div>
    );
  };
});

jest.mock('../../common/CategorySelector', () => {
  return function MockCategorySelector({
    value,
    onChange,
    categories,
    label,
    error,
    helperText,
  }: any) {
    return (
      <div data-testid="category-selector">
        <label>{label}</label>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          data-error={error}
        >
          <option value="">選択してください</option>
          {categories.map((cat: Category) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {helperText && <div data-testid="helper-text">{helperText}</div>}
      </div>
    );
  };
});

jest.mock('../../common/DatePicker', () => {
  return function MockDatePicker({
    value,
    onChange,
    label,
    error,
    helperText,
    ...props
  }: any) {
    const { format } = require('date-fns');
    return (
      <div data-testid="date-picker">
        <label>{label}</label>
        <input
          type="date"
          value={value ? format(value, 'yyyy-MM-dd') : ''}
          onChange={(e) =>
            onChange(e.target.value ? new Date(e.target.value) : null)
          }
          data-error={error}
          {...props}
        />
        {helperText && <div data-testid="helper-text">{helperText}</div>}
      </div>
    );
  };
});

jest.mock('../../common/ErrorDisplay', () => {
  return function MockErrorDisplay({ error }: any) {
    return (
      <div data-testid="error-display">
        {error?.message || 'Error occurred'}
      </div>
    );
  };
});

jest.mock('../../common/LoadingDisplay', () => {
  return function MockLoadingDisplay({ message }: any) {
    return <div data-testid="loading-display">{message}</div>;
  };
});

const mockCategories: Category[] = [
  {
    id: '1',
    name: '食費',
    color: '#FF5722',
    type: 'expense',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: '給与',
    color: '#4CAF50',
    type: 'income',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('TransactionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCategoriesByType.mockReturnValue({
      data: mockCategories.filter((cat) => cat.type === 'expense'),
      isLoading: false,
      error: null,
    });
    mockCreateTransaction.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ id: '123', amount: 1000 }),
    });
  });

  it('renders form with all required fields', () => {
    render(<TransactionForm />);

    expect(screen.getByText('取引を追加')).toBeInTheDocument();
    expect(screen.getByText('取引種別 *')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '収入' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '支出' })).toBeInTheDocument();
    expect(screen.getByTestId('amount-input')).toBeInTheDocument();
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    expect(screen.getByTestId('category-selector')).toBeInTheDocument();
    expect(screen.getByLabelText('説明 *')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
  });

  it('defaults to expense type', () => {
    render(<TransactionForm />);

    const expenseButton = screen.getByRole('button', { name: '支出' });
    expect(expenseButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches between income and expense types', async () => {
    // Mock different categories for income
    mockGetCategoriesByType.mockImplementation((type) => ({
      data: mockCategories.filter((cat) => cat.type === type),
      isLoading: false,
      error: null,
    }));

    render(<TransactionForm />);

    const incomeButton = screen.getByRole('button', { name: '収入' });
    const expenseButton = screen.getByRole('button', { name: '支出' });

    // Initially expense should be selected
    expect(expenseButton).toHaveAttribute('aria-pressed', 'true');

    // Click income button
    await userEvent.click(incomeButton);
    expect(incomeButton).toHaveAttribute('aria-pressed', 'true');
    expect(expenseButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('validates required fields', async () => {
    render(<TransactionForm />);

    const submitButton = screen.getByRole('button', { name: '保存' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('金額は必須です')).toBeInTheDocument();
      expect(screen.getByText('説明を入力してください')).toBeInTheDocument();
      expect(screen.getByText('カテゴリは必須です')).toBeInTheDocument();
    });
  });

  it('validates amount is positive', async () => {
    render(<TransactionForm />);

    const amountInput = screen
      .getByTestId('amount-input')
      .querySelector('input')!;
    await userEvent.type(amountInput, '-100');

    const submitButton = screen.getByRole('button', { name: '保存' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('金額は正の値で入力してください')
      ).toBeInTheDocument();
    });
  });

  it('validates description length', async () => {
    render(<TransactionForm />);

    const descriptionInput = screen.getByLabelText('説明 *');
    const longDescription = 'a'.repeat(201);
    await userEvent.type(descriptionInput, longDescription);

    const submitButton = screen.getByRole('button', { name: '保存' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('説明は200文字以内で入力してください')
      ).toBeInTheDocument();
    });
  });

  it('validates date is not in future', async () => {
    render(<TransactionForm />);

    const dateInput = screen.getByTestId('date-picker').querySelector('input')!;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    fireEvent.change(dateInput, {
      target: { value: format(futureDate, 'yyyy-MM-dd') },
    });

    const submitButton = screen.getByRole('button', { name: '保存' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('未来の日付は入力できません')
      ).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const onSuccess = jest.fn();

    render(<TransactionForm onSuccess={onSuccess} />);

    // Fill out the form
    const amountInput = screen
      .getByTestId('amount-input')
      .querySelector('input')!;
    fireEvent.change(amountInput, { target: { value: '1000' } });

    const descriptionInput = screen.getByLabelText('説明 *');
    await userEvent.type(descriptionInput, 'Test transaction');

    const categorySelect = screen
      .getByTestId('category-selector')
      .querySelector('select')!;
    fireEvent.change(categorySelect, { target: { value: '1' } });

    const dateInput = screen.getByTestId('date-picker').querySelector('input')!;
    fireEvent.change(dateInput, {
      target: { value: format(new Date(), 'yyyy-MM-dd') },
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: '保存' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateTransaction).toHaveBeenCalledWith({
        type: 'expense',
        amount: 1000,
        description: 'Test transaction',
        categoryId: '1',
        date: expect.any(Date),
      });
      expect(onSuccess).toHaveBeenCalledWith({ id: '123', amount: 1000 });
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = jest.fn();

    render(<TransactionForm onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    await userEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('shows warning when no categories available', () => {
    mockGetCategoriesByType.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<TransactionForm />);

    expect(
      screen.getByText(/支出カテゴリが見つかりません/)
    ).toBeInTheDocument();
  });

  it('shows loading state when categories are loading', () => {
    mockGetCategoriesByType.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    render(<TransactionForm />);

    expect(screen.getByTestId('loading-display')).toBeInTheDocument();
    expect(screen.getByText('カテゴリを読み込み中...')).toBeInTheDocument();
  });

  it('shows error when categories fail to load', () => {
    const mockError = { message: 'Failed to load categories' };
    mockGetCategoriesByType.mockReturnValue({
      data: [],
      isLoading: false,
      error: mockError,
    });

    render(<TransactionForm />);

    expect(screen.getByTestId('error-display')).toBeInTheDocument();
  });

  it('resets category when transaction type changes', async () => {
    render(<TransactionForm />);

    // Select a category
    const categorySelect = screen
      .getByTestId('category-selector')
      .querySelector('select')!;
    fireEvent.change(categorySelect, { target: { value: '1' } });
    expect(categorySelect.value).toBe('1');

    // Change transaction type
    const incomeButton = screen.getByRole('button', { name: '収入' });
    await userEvent.click(incomeButton);

    // Category should be reset
    await waitFor(() => {
      expect(categorySelect.value).toBe('');
    });
  });

  it('uses initial values when provided', () => {
    const initialValues = {
      type: 'income' as const,
      amount: 5000,
      description: 'Initial description',
      date: new Date('2023-01-01'),
    };

    render(<TransactionForm initialValues={initialValues} />);

    const incomeButton = screen.getByRole('button', { name: '収入' });
    expect(incomeButton).toHaveAttribute('aria-pressed', 'true');

    const amountInput = screen
      .getByTestId('amount-input')
      .querySelector('input')!;
    expect(amountInput.value).toBe('5000');

    const descriptionInput = screen.getByLabelText(
      '説明 *'
    ) as HTMLInputElement;
    expect(descriptionInput.value).toBe('Initial description');

    const dateInput = screen
      .getByTestId('date-picker')
      .querySelector('input')! as HTMLInputElement;
    expect(dateInput.value).toBe('2023-01-01');
  });
});
