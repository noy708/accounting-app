import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { DataImport } from '../DataImport';
import { DataImportService } from '../../../database/services/DataImportService';
import categorySlice from '../../../store/slices/categorySlice';

// Mock the DataImportService
jest.mock('../../../database/services/DataImportService');
const MockedDataImportService = DataImportService as jest.MockedClass<
  typeof DataImportService
>;

// Mock file reading
const mockFileReader = {
  readAsText: jest.fn(),
  result: '',
  onload: null as any,
};

Object.defineProperty(global, 'FileReader', {
  writable: true,
  value: jest.fn(() => mockFileReader),
});

// Mock URL.createObjectURL
Object.defineProperty(global.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mock-url'),
});

Object.defineProperty(global.URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

const mockStore = configureStore({
  reducer: {
    categories: categorySlice,
  },
  preloadedState: {
    categories: {
      items: [
        {
          id: 'cat1',
          name: '食費',
          color: '#FF5722',
          type: 'expense' as const,
          isDefault: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
      loading: false,
      error: null,
    },
  },
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(<Provider store={mockStore}>{component}</Provider>);
};

describe('DataImport', () => {
  let mockImportService: jest.Mocked<DataImportService>;

  const simulateFileSelection = (fileIndex: number, file: File) => {
    const inputs = document.querySelectorAll('input[type="file"]');
    const input = inputs[fileIndex] as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    // Simulate FileReader onload
    mockFileReader.result = 'test content';
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'test content' } } as any);
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockImportService = {
      importFromCSV: jest.fn(),
    } as any;

    MockedDataImportService.mockImplementation(() => mockImportService);

    // Reset FileReader mock
    mockFileReader.readAsText.mockClear();
    mockFileReader.result = '';
  });

  it('renders import interface correctly', () => {
    renderWithProvider(<DataImport />);

    expect(screen.getByText('データインポート')).toBeInTheDocument();
    expect(screen.getByText('取引データを選択')).toBeInTheDocument();
    expect(screen.getByText('カテゴリデータを選択')).toBeInTheDocument();
    expect(screen.getByText('インポートオプション')).toBeInTheDocument();
    expect(screen.getByText('重複データをスキップ')).toBeInTheDocument();
    expect(screen.getByText('既存データを更新')).toBeInTheDocument();
    expect(
      screen.getByText('存在しないカテゴリを自動作成')
    ).toBeInTheDocument();
  });

  it('handles file selection for transactions', async () => {
    renderWithProvider(<DataImport />);

    const file = new File(['test content'], 'transactions.csv', {
      type: 'text/csv',
    });
    simulateFileSelection(0, file);

    await waitFor(() => {
      expect(screen.getByText('transactions.csv')).toBeInTheDocument();
    });
  });

  it('handles file selection for categories', async () => {
    renderWithProvider(<DataImport />);

    const file = new File(['test content'], 'categories.csv', {
      type: 'text/csv',
    });
    simulateFileSelection(1, file);

    await waitFor(() => {
      expect(screen.getByText('categories.csv')).toBeInTheDocument();
    });
  });

  it('rejects non-CSV files', async () => {
    renderWithProvider(<DataImport />);

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    simulateFileSelection(0, file);

    await waitFor(() => {
      expect(
        screen.getByText('CSVファイルを選択してください')
      ).toBeInTheDocument();
    });
  });

  it('allows removing selected files', async () => {
    renderWithProvider(<DataImport />);

    const file = new File(['test content'], 'transactions.csv', {
      type: 'text/csv',
    });
    simulateFileSelection(0, file);

    await waitFor(() => {
      expect(screen.getByText('transactions.csv')).toBeInTheDocument();
    });

    // Remove file
    const removeButton = screen.getByLabelText('delete');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('transactions.csv')).not.toBeInTheDocument();
    });
  });

  it('handles import option changes', async () => {
    renderWithProvider(<DataImport />);

    const skipDuplicatesCheckbox = screen.getByRole('checkbox', {
      name: '重複データをスキップ',
    });
    const updateExistingCheckbox = screen.getByRole('checkbox', {
      name: '既存データを更新',
    });

    expect(skipDuplicatesCheckbox).toBeChecked();
    expect(updateExistingCheckbox).not.toBeChecked();
    expect(updateExistingCheckbox).toBeDisabled();

    // Uncheck skip duplicates
    fireEvent.click(skipDuplicatesCheckbox);

    expect(skipDuplicatesCheckbox).not.toBeChecked();
    expect(updateExistingCheckbox).not.toBeDisabled();

    // Check update existing
    fireEvent.click(updateExistingCheckbox);

    expect(updateExistingCheckbox).toBeChecked();
  });

  it('shows error when trying to import without files', async () => {
    renderWithProvider(<DataImport />);

    const importButton = screen.getByRole('button', { name: 'インポート' });
    expect(importButton).toBeDisabled();
  });

  it('shows confirmation dialog before import', async () => {
    renderWithProvider(<DataImport />);

    // Add a file first
    const file = new File(['test content'], 'transactions.csv', {
      type: 'text/csv',
    });
    simulateFileSelection(0, file);

    await waitFor(() => {
      expect(screen.getByText('transactions.csv')).toBeInTheDocument();
    });

    // Click import
    const importButton = screen.getByRole('button', { name: 'インポート' });
    fireEvent.click(importButton);

    // Check confirmation dialog
    expect(screen.getByText('インポート確認')).toBeInTheDocument();
    expect(
      screen.getByText('以下の設定でデータをインポートします。よろしいですか？')
    ).toBeInTheDocument();
  });

  it('performs import successfully', async () => {
    const mockResult = {
      transactions: { imported: 5, skipped: 1, errors: 0 },
      categories: { imported: 2, skipped: 0, errors: 0 },
      errors: [],
    };

    mockImportService.importFromCSV.mockResolvedValue(mockResult);

    const onImportComplete = jest.fn();
    renderWithProvider(<DataImport onImportComplete={onImportComplete} />);

    // Add a file
    const file = new File(['test content'], 'transactions.csv', {
      type: 'text/csv',
    });
    simulateFileSelection(0, file);

    await waitFor(() => {
      expect(screen.getByText('transactions.csv')).toBeInTheDocument();
    });

    // Click import
    const importButton = screen.getByRole('button', { name: 'インポート' });
    fireEvent.click(importButton);

    // Confirm import
    const confirmButton = screen.getByRole('button', {
      name: 'インポート実行',
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockImportService.importFromCSV).toHaveBeenCalledWith(
        'test content',
        undefined,
        {
          skipDuplicates: true,
          updateExisting: false,
          createMissingCategories: true,
        },
        expect.any(Function)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('インポート結果')).toBeInTheDocument();
      expect(screen.getByText('インポート: 5')).toBeInTheDocument();
      expect(screen.getByText('スキップ: 1')).toBeInTheDocument();
    });

    expect(onImportComplete).toHaveBeenCalledWith(mockResult);
  });

  it('handles import errors', async () => {
    const mockResult = {
      transactions: { imported: 2, skipped: 0, errors: 1 },
      categories: { imported: 0, skipped: 0, errors: 0 },
      errors: [
        {
          row: 3,
          field: 'amount',
          message: '金額は数値である必要があります',
        },
      ],
    };

    mockImportService.importFromCSV.mockResolvedValue(mockResult);

    renderWithProvider(<DataImport />);

    // Add a file and perform import
    const file = new File(['test content'], 'transactions.csv', {
      type: 'text/csv',
    });
    const input = screen.getByText('取引データを選択').closest('button')
      ?.previousElementSibling as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    mockFileReader.result = 'test content';
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'test content' } } as any);
    }

    await waitFor(() => {
      expect(screen.getByText('transactions.csv')).toBeInTheDocument();
    });

    const importButton = screen.getByRole('button', { name: 'インポート' });
    fireEvent.click(importButton);

    const confirmButton = screen.getByRole('button', {
      name: 'インポート実行',
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('インポート結果')).toBeInTheDocument();
      expect(screen.getByText('エラー詳細')).toBeInTheDocument();
      expect(
        screen.getByText('金額は数値である必要があります')
      ).toBeInTheDocument();
    });
  });

  it('handles service errors', async () => {
    mockImportService.importFromCSV.mockRejectedValue(
      new Error('Service error')
    );

    renderWithProvider(<DataImport />);

    // Add a file and perform import
    const file = new File(['test content'], 'transactions.csv', {
      type: 'text/csv',
    });
    const input = screen.getByText('取引データを選択').closest('button')
      ?.previousElementSibling as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    mockFileReader.result = 'test content';
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'test content' } } as any);
    }

    await waitFor(() => {
      expect(screen.getByText('transactions.csv')).toBeInTheDocument();
    });

    const importButton = screen.getByRole('button', { name: 'インポート' });
    fireEvent.click(importButton);

    const confirmButton = screen.getByRole('button', {
      name: 'インポート実行',
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Service error')).toBeInTheDocument();
    });
  });

  it('shows progress during import', async () => {
    let progressCallback: ((progress: any) => void) | undefined;

    mockImportService.importFromCSV.mockImplementation(
      async (_, __, ___, onProgress) => {
        progressCallback = onProgress;

        // Simulate progress updates
        if (progressCallback) {
          progressCallback({
            current: 0,
            total: 2,
            stage: 'parsing',
            message: 'データを解析中...',
          });

          progressCallback({
            current: 1,
            total: 2,
            stage: 'importing',
            message: '取引をインポート中...',
          });
        }

        return {
          transactions: { imported: 1, skipped: 0, errors: 0 },
          categories: { imported: 0, skipped: 0, errors: 0 },
          errors: [],
        };
      }
    );

    renderWithProvider(<DataImport />);

    // Add a file and perform import
    const file = new File(['test content'], 'transactions.csv', {
      type: 'text/csv',
    });
    const input = screen.getByText('取引データを選択').closest('button')
      ?.previousElementSibling as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    mockFileReader.result = 'test content';
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'test content' } } as any);
    }

    await waitFor(() => {
      expect(screen.getByText('transactions.csv')).toBeInTheDocument();
    });

    const importButton = screen.getByRole('button', { name: 'インポート' });
    fireEvent.click(importButton);

    const confirmButton = screen.getByRole('button', {
      name: 'インポート実行',
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('データを解析中...')).toBeInTheDocument();
    });
  });

  it('calls onClose when provided', async () => {
    const onClose = jest.fn();
    renderWithProvider(<DataImport onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});
