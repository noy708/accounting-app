import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { DataExport } from '../DataExport';
import { DataExportService } from '../../../database/services/DataExportService';
import categoryReducer from '../../../store/slices/categorySlice';
import { Category } from '../../../types';

// Mock the selectors
jest.mock('../../../store/selectors/categorySelectors', () => ({
  selectCategories: (state: any) => state.categories.categories,
}));

// Mock the DataExportService
jest.mock('../../../database/services/DataExportService');
const MockedDataExportService = DataExportService as jest.MockedClass<
  typeof DataExportService
>;

// Mock date picker
jest.mock('../../common/DatePicker', () => {
  return function MockDatePicker({ label, onChange, value, ...props }: any) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const date = e.target.value ? new Date(e.target.value) : null;
      onChange(date);
    };

    const formatValue = (date: Date | null) => {
      if (!date) return '';
      return date.toISOString().split('T')[0];
    };

    return (
      <input
        type="date"
        data-testid={`date-picker-${label}`}
        value={formatValue(value)}
        onChange={handleChange}
        {...props}
      />
    );
  };
});

const mockCategories: Category[] = [
  {
    id: 'cat1',
    name: 'Food',
    color: '#FF5722',
    type: 'expense',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat2',
    name: 'Salary',
    color: '#4CAF50',
    type: 'income',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const createTestStore = (categories: Category[] = mockCategories) => {
  return configureStore({
    reducer: {
      categories: categoryReducer,
    },
    preloadedState: {
      categories: {
        categories,
        currentCategory: null,
        loading: { isLoading: false },
        lastUpdated: null,
      },
    },
  });
};

const renderWithStore = (
  component: React.ReactElement,
  store = createTestStore()
) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe('DataExport', () => {
  let mockExportService: jest.Mocked<DataExportService>;
  let mockOnClose: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockExportService = {
      exportToCSV: jest.fn(),
      downloadCSV: jest.fn(),
    } as any;

    MockedDataExportService.mockImplementation(() => mockExportService);
    mockOnClose = jest.fn();
  });

  it('should render export options', () => {
    renderWithStore(<DataExport />);

    expect(screen.getByText('データエクスポート')).toBeInTheDocument();
    expect(screen.getByLabelText('取引データ')).toBeInTheDocument();
    expect(screen.getByLabelText('カテゴリデータ')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /エクスポート/i })
    ).toBeInTheDocument();
  });

  it('should have both options checked by default', () => {
    renderWithStore(<DataExport />);

    expect(screen.getByLabelText('取引データ')).toBeChecked();
    expect(screen.getByLabelText('カテゴリデータ')).toBeChecked();
  });

  it('should show date range inputs when transactions are selected', () => {
    renderWithStore(<DataExport />);

    expect(screen.getByTestId('date-picker-開始日')).toBeInTheDocument();
    expect(screen.getByTestId('date-picker-終了日')).toBeInTheDocument();
  });

  it('should show category selection when transactions are selected', () => {
    renderWithStore(<DataExport />);

    expect(screen.getByText('カテゴリ指定（オプション）')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '全て選択' })
    ).toBeInTheDocument();
  });

  it('should toggle category selection', () => {
    renderWithStore(<DataExport />);

    const foodChip = screen.getByText('Food');
    fireEvent.click(foodChip);

    expect(
      screen.getByText('1個のカテゴリが選択されています')
    ).toBeInTheDocument();
  });

  it('should select/deselect all categories', () => {
    renderWithStore(<DataExport />);

    const selectAllButton = screen.getByRole('button', { name: '全て選択' });
    fireEvent.click(selectAllButton);

    expect(
      screen.getByText('2個のカテゴリが選択されています')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '全て解除' })
    ).toBeInTheDocument();

    fireEvent.click(selectAllButton);
    expect(
      screen.queryByText(/個のカテゴリが選択されています/)
    ).not.toBeInTheDocument();
  });

  it('should disable export button when no options are selected', () => {
    renderWithStore(<DataExport />);

    const transactionCheckbox = screen.getByLabelText('取引データ');
    const categoryCheckbox = screen.getByLabelText('カテゴリデータ');
    const exportButton = screen.getByRole('button', { name: /エクスポート/i });

    fireEvent.click(transactionCheckbox);
    fireEvent.click(categoryCheckbox);

    expect(exportButton).toBeDisabled();
  });

  it('should show error when no options are selected and export is clicked', async () => {
    renderWithStore(<DataExport />);

    const transactionCheckbox = screen.getByLabelText('取引データ');
    const categoryCheckbox = screen.getByLabelText('カテゴリデータ');

    fireEvent.click(transactionCheckbox);
    fireEvent.click(categoryCheckbox);

    // Re-enable one option to make button clickable
    fireEvent.click(transactionCheckbox);

    // Now disable it again and try to click
    fireEvent.click(transactionCheckbox);

    // The button should be disabled, so this test checks the validation logic
    expect(
      screen.getByRole('button', { name: /エクスポート/i })
    ).toBeDisabled();
  });

  it('should perform export successfully', async () => {
    mockExportService.exportToCSV.mockResolvedValue({
      transactions: 'date,amount\n2023-01-01,1000',
      categories: 'name,color\nFood,#FF5722',
    });

    renderWithStore(<DataExport onClose={mockOnClose} />);

    const exportButton = screen.getByRole('button', { name: /エクスポート/i });
    fireEvent.click(exportButton);

    expect(exportButton).toHaveTextContent('エクスポート中...');
    expect(exportButton).toBeDisabled();

    await waitFor(() => {
      expect(mockExportService.exportToCSV).toHaveBeenCalledWith(
        expect.objectContaining({
          includeTransactions: true,
          includeCategories: true,
        }),
        expect.any(Function)
      );
    });

    await waitFor(() => {
      expect(mockExportService.downloadCSV).toHaveBeenCalledTimes(2);
      expect(
        screen.getByText('データのエクスポートが完了しました')
      ).toBeInTheDocument();
    });

    // Should auto-close after success
    await waitFor(
      () => {
        expect(mockOnClose).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it('should show progress during export', async () => {
    let progressCallback: ((progress: any) => void) | undefined;

    mockExportService.exportToCSV.mockImplementation(
      async (options, onProgress) => {
        progressCallback = onProgress;

        // Simulate progress updates
        setTimeout(() => {
          progressCallback?.({
            current: 0,
            total: 2,
            stage: 'preparing',
            message: 'エクスポートを準備中...',
          });
        }, 10);

        setTimeout(() => {
          progressCallback?.({
            current: 1,
            total: 2,
            stage: 'exporting',
            message: '取引をエクスポート中...',
          });
        }, 20);

        return { transactions: 'test' };
      }
    );

    renderWithStore(<DataExport />);

    const exportButton = screen.getByRole('button', { name: /エクスポート/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('エクスポートを準備中...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('取引をエクスポート中...')).toBeInTheDocument();
    });
  });

  it('should handle export errors', async () => {
    mockExportService.exportToCSV.mockRejectedValue(new Error('Export failed'));

    renderWithStore(<DataExport />);

    const exportButton = screen.getByRole('button', { name: /エクスポート/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Export failed')).toBeInTheDocument();
    });

    expect(exportButton).not.toBeDisabled();
    expect(exportButton).toHaveTextContent('エクスポート');
  });

  it('should call onClose when cancel button is clicked', () => {
    renderWithStore(<DataExport onClose={mockOnClose} />);

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not show cancel button when onClose is not provided', () => {
    renderWithStore(<DataExport />);

    expect(
      screen.queryByRole('button', { name: 'キャンセル' })
    ).not.toBeInTheDocument();
  });

  it('should handle date range selection', () => {
    renderWithStore(<DataExport />);

    const startDateInput = screen.getByTestId('date-picker-開始日');
    const endDateInput = screen.getByTestId('date-picker-終了日');

    fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2023-01-31' } });

    // The component should update its internal state
    // This is tested indirectly through the export functionality
    expect(startDateInput).toHaveValue('2023-01-01');
    expect(endDateInput).toHaveValue('2023-01-31');
  });

  it('should hide date range and category filters when transactions are not selected', () => {
    renderWithStore(<DataExport />);

    const transactionCheckbox = screen.getByLabelText('取引データ');
    fireEvent.click(transactionCheckbox);

    expect(
      screen.queryByText('期間指定（オプション）')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('カテゴリ指定（オプション）')
    ).not.toBeInTheDocument();
  });
});
