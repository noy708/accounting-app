import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TransactionEditModal from '../TransactionEditModal';
import { transactionApi } from '../../../store/api/transactionApi';
import { categoryApi } from '../../../store/api/categoryApi';
import { Transaction, Category } from '../../../types';

// Mock the APIs
const mockUpdateTransaction = jest.fn();
const mockGetCategoriesByType = jest.fn();

jest.mock('../../../store/api/transactionApi', () => ({
  useUpdateTransactionMutation: () => [
    mockUpdateTransaction,
    { isLoading: false, error: null },
  ],
}));

jest.mock('../../../store/api/categoryApi', () => ({
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
          {categories?.map((cat: Category) => (
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
    return (
      <div data-testid="date-picker">
        <label>{label}</label>
        <input
          type="date"
          value={value ? value.toISOString().split('T')[0] : ''}
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
        {error?.message || 'エラーが発生しました'}
      </div>
    );
  };
});

jest.mock('../../common/LoadingDisplay', () => {
  return function MockLoadingDisplay({ message }: any) {
    return <div data-testid="loading-display">{message}</div>;
  };
});

const mockStore = configureStore({
  reducer: {
    [transactionApi.reducerPath]: transactionApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      transactionApi.middleware,
      categoryApi.middleware
    ),
});

const mockTransaction: Transaction = {
  id: '1',
  date: new Date('2024-01-15'),
  amount: -1000,
  description: 'Test transaction',
  categoryId: 'cat1',
  type: 'expense',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

const mockCategories: Category[] = [
  {
    id: 'cat1',
    name: 'Food',
    color: '#ff0000',
    type: 'expense',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat2',
    name: 'Transport',
    color: '#00ff00',
    type: 'expense',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const renderComponent = (
  props: Partial<React.ComponentProps<typeof TransactionEditModal>> = {}
) => {
  const defaultProps = {
    open: true,
    transaction: mockTransaction,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    ...props,
  };

  return render(
    <Provider store={mockStore}>
      <TransactionEditModal {...defaultProps} />
    </Provider>
  );
};

describe('TransactionEditModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCategoriesByType.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      error: null,
    });
    mockUpdateTransaction.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue(mockTransaction),
    });
  });

  it('renders modal when open', () => {
    renderComponent();

    expect(screen.getByText('取引を編集')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test transaction')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderComponent({ open: false });

    expect(screen.queryByText('取引を編集')).not.toBeInTheDocument();
  });

  it('returns null when transaction is null', () => {
    const { container } = renderComponent({ transaction: null });

    expect(container.firstChild).toBeNull();
  });

  it('initializes form with transaction data', () => {
    renderComponent();

    // Check if form is initialized with transaction data
    expect(screen.getByDisplayValue('Test transaction')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument(); // Amount without sign
    expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument();
  });

  it('handles transaction type toggle', async () => {
    const user = userEvent.setup();
    renderComponent();

    const incomeButton = screen.getByRole('button', { name: '収入' });
    await user.click(incomeButton);

    // Should reset category when type changes
    expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Category selector should be reset
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Clear required fields
    const descriptionInput = screen.getByDisplayValue('Test transaction');
    await user.clear(descriptionInput);

    const updateButton = screen.getByRole('button', { name: '更新' });
    await user.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText('説明を入力してください')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    const onClose = jest.fn();

    renderComponent({ onSuccess, onClose });

    // Modify description
    const descriptionInput = screen.getByDisplayValue('Test transaction');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated transaction');

    const updateButton = screen.getByRole('button', { name: '更新' });
    await user.click(updateButton);

    await waitFor(() => {
      expect(mockUpdateTransaction).toHaveBeenCalledWith({
        id: '1',
        data: {
          type: 'expense',
          amount: 1000,
          description: 'Updated transaction',
          categoryId: 'cat1',
          date: expect.any(Date),
        },
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles close button click', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    renderComponent({ onClose });

    const closeButton = screen.getByLabelText('close');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('handles cancel button click', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    renderComponent({ onClose });

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('shows loading state during update', () => {
    mockUpdateTransaction.mockReturnValue({
      unwrap: jest.fn().mockReturnValue(new Promise(() => {})), // Never resolves
    });

    // Mock the hook to return loading state
    jest.doMock('../../../store/api/transactionApi', () => ({
      useUpdateTransactionMutation: () => [
        mockUpdateTransaction,
        { isLoading: true, error: null },
      ],
    }));

    renderComponent();

    expect(screen.getByText('更新中...')).toBeInTheDocument();
  });

  it('displays error when update fails', () => {
    const error = { message: 'Update failed' };

    // Mock the hook to return error state
    jest.doMock('../../../store/api/transactionApi', () => ({
      useUpdateTransactionMutation: () => [
        mockUpdateTransaction,
        { isLoading: false, error },
      ],
    }));

    renderComponent();

    expect(screen.getByTestId('error-display')).toBeInTheDocument();
  });

  it('shows loading when categories are loading', () => {
    mockGetCategoriesByType.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    renderComponent();

    expect(screen.getByTestId('loading-display')).toBeInTheDocument();
    expect(screen.getByText('カテゴリを読み込み中...')).toBeInTheDocument();
  });

  it('shows error when categories fail to load', () => {
    const error = { message: 'Failed to load categories' };
    mockGetCategoriesByType.mockReturnValue({
      data: [],
      isLoading: false,
      error,
    });

    renderComponent();

    expect(screen.getByTestId('error-display')).toBeInTheDocument();
  });

  it('validates amount input', async () => {
    const user = userEvent.setup();
    renderComponent();

    const amountInput = screen.getByDisplayValue('1000');
    await user.clear(amountInput);
    await user.type(amountInput, '0');

    const updateButton = screen.getByRole('button', { name: '更新' });
    await user.click(updateButton);

    await waitFor(() => {
      expect(
        screen.getByText('金額は正の値で入力してください')
      ).toBeInTheDocument();
    });
  });

  it('validates date input', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Set future date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = screen.getByDisplayValue('2024-01-15');
    await user.clear(dateInput);
    await user.type(dateInput, tomorrow.toISOString().split('T')[0]);

    const updateButton = screen.getByRole('button', { name: '更新' });
    await user.click(updateButton);

    await waitFor(() => {
      expect(
        screen.getByText('未来の日付は入力できません')
      ).toBeInTheDocument();
    });
  });
});
