import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataBackup } from '../DataBackup';
import { DataBackupService } from '../../../database/services/DataBackupService';

// Mock the DataBackupService
jest.mock('../../../database/services/DataBackupService');

const mockBackupService = {
  createManualBackup: jest.fn(),
  startAutoBackup: jest.fn(),
  stopAutoBackup: jest.fn(),
  restoreFromBackup: jest.fn(),
  downloadBackup: jest.fn(),
  getAutoBackups: jest.fn(),
  validateBackupIntegrity: jest.fn(),
};

// Mock the service constructor
(DataBackupService as jest.Mock).mockImplementation(() => mockBackupService);

// Mock URL methods
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('DataBackup', () => {
  const mockOnBackupComplete = jest.fn();
  const mockOnRestoreComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockBackupService.getAutoBackups.mockReturnValue([]);
  });

  const renderComponent = () => {
    return render(
      <DataBackup
        onBackupComplete={mockOnBackupComplete}
        onRestoreComplete={mockOnRestoreComplete}
      />
    );
  };

  describe('rendering', () => {
    it('should render main title', () => {
      renderComponent();
      expect(
        screen.getByText('データバックアップ・リストア')
      ).toBeInTheDocument();
    });

    it('should render auto backup section', () => {
      renderComponent();
      expect(screen.getByText('自動バックアップ')).toBeInTheDocument();
      expect(
        screen.getByText('自動バックアップを有効にする')
      ).toBeInTheDocument();
    });

    it('should render manual backup section', () => {
      renderComponent();
      expect(screen.getByText('手動バックアップ')).toBeInTheDocument();
      expect(screen.getByText('バックアップを作成')).toBeInTheDocument();
    });

    it('should render file restore section', () => {
      renderComponent();
      expect(screen.getByText('ファイルからリストア')).toBeInTheDocument();
      expect(
        screen.getByText('バックアップファイルを選択')
      ).toBeInTheDocument();
    });

    it('should render auto backup history section', () => {
      renderComponent();
      expect(screen.getByText('自動バックアップ履歴')).toBeInTheDocument();
    });
  });

  describe('auto backup functionality', () => {
    it('should enable auto backup when toggle is switched on', async () => {
      renderComponent();

      const toggle = screen.getByRole('switch', {
        name: /自動バックアップを有効にする/,
      });
      await userEvent.click(toggle);

      expect(mockBackupService.startAutoBackup).toHaveBeenCalledWith(60);
    });

    it('should disable auto backup when toggle is switched off', async () => {
      renderComponent();

      const toggle = screen.getByRole('switch', {
        name: /自動バックアップを有効にする/,
      });

      // Enable first
      await userEvent.click(toggle);
      // Then disable
      await userEvent.click(toggle);

      expect(mockBackupService.stopAutoBackup).toHaveBeenCalled();
    });

    it('should update backup interval', async () => {
      renderComponent();

      const intervalInput = screen.getByLabelText('バックアップ間隔（分）');
      await userEvent.clear(intervalInput);
      await userEvent.type(intervalInput, '30');

      const toggle = screen.getByRole('switch', {
        name: /自動バックアップを有効にする/,
      });
      await userEvent.click(toggle);

      expect(mockBackupService.startAutoBackup).toHaveBeenCalledWith(30);
    });
  });

  describe('manual backup functionality', () => {
    it('should create manual backup with default options', async () => {
      const mockBackupData = {
        version: '1.0.0',
        timestamp: new Date(),
        metadata: { transactionCount: 5, categoryCount: 3, checksum: 'test' },
        transactions: [],
        categories: [],
      };

      mockBackupService.createManualBackup.mockResolvedValue(mockBackupData);

      renderComponent();

      const backupButton = screen.getByText('バックアップを作成');
      await userEvent.click(backupButton);

      await waitFor(() => {
        expect(mockBackupService.createManualBackup).toHaveBeenCalledWith(
          {
            includeTransactions: true,
            includeCategories: true,
            compress: false,
          },
          expect.any(Function)
        );
      });

      expect(mockBackupService.downloadBackup).toHaveBeenCalledWith(
        mockBackupData
      );
      expect(mockOnBackupComplete).toHaveBeenCalledWith(true);
    });

    it('should handle backup options correctly', async () => {
      renderComponent();

      // Disable transactions
      const transactionToggle = screen.getByRole('switch', {
        name: /取引データを含める/,
      });
      await userEvent.click(transactionToggle);

      const backupButton = screen.getByText('バックアップを作成');
      await userEvent.click(backupButton);

      await waitFor(() => {
        expect(mockBackupService.createManualBackup).toHaveBeenCalledWith(
          {
            includeTransactions: false,
            includeCategories: true,
            compress: false,
          },
          expect.any(Function)
        );
      });
    });

    it('should disable backup button when no data is selected', async () => {
      renderComponent();

      // Disable both options
      const transactionToggle = screen.getByRole('switch', {
        name: /取引データを含める/,
      });
      const categoryToggle = screen.getByRole('switch', {
        name: /カテゴリデータを含める/,
      });

      await userEvent.click(transactionToggle);
      await userEvent.click(categoryToggle);

      const backupButton = screen.getByText('バックアップを作成');
      expect(backupButton).toBeDisabled();
    });

    it('should handle backup errors', async () => {
      mockBackupService.createManualBackup.mockRejectedValue(
        new Error('Backup failed')
      );

      renderComponent();

      const backupButton = screen.getByText('バックアップを作成');
      await userEvent.click(backupButton);

      await waitFor(() => {
        expect(
          screen.getByText(/バックアップに失敗しました/)
        ).toBeInTheDocument();
      });

      expect(mockOnBackupComplete).toHaveBeenCalledWith(false);
    });
  });

  describe('auto backup history', () => {
    it('should display auto backup history', () => {
      const mockAutoBackups = [
        {
          version: '1.0.0',
          timestamp: new Date('2024-01-01T10:00:00'),
          metadata: {
            transactionCount: 5,
            categoryCount: 3,
            checksum: 'test1',
          },
          transactions: [],
          categories: [],
        },
        {
          version: '1.0.0',
          timestamp: new Date('2024-01-02T10:00:00'),
          metadata: {
            transactionCount: 7,
            categoryCount: 4,
            checksum: 'test2',
          },
          transactions: [],
          categories: [],
        },
      ];

      mockBackupService.getAutoBackups.mockReturnValue(mockAutoBackups);

      renderComponent();

      expect(screen.getByText('2024/01/01 10:00')).toBeInTheDocument();
      expect(screen.getByText('2024/01/02 10:00')).toBeInTheDocument();
      expect(screen.getByText('取引: 5')).toBeInTheDocument();
      expect(screen.getByText('カテゴリ: 3')).toBeInTheDocument();
    });

    it('should show message when no auto backups exist', () => {
      mockBackupService.getAutoBackups.mockReturnValue([]);

      renderComponent();

      expect(
        screen.getByText('自動バックアップがありません')
      ).toBeInTheDocument();
    });

    it('should handle download auto backup', async () => {
      const mockAutoBackup = {
        version: '1.0.0',
        timestamp: new Date('2024-01-01T10:00:00'),
        metadata: { transactionCount: 5, categoryCount: 3, checksum: 'test' },
        transactions: [],
        categories: [],
      };

      mockBackupService.getAutoBackups.mockReturnValue([mockAutoBackup]);

      renderComponent();

      const downloadButton = screen.getByTitle('ダウンロード');
      await userEvent.click(downloadButton);

      expect(mockBackupService.downloadBackup).toHaveBeenCalledWith(
        mockAutoBackup
      );
    });
  });

  describe('alert handling', () => {
    it('should show success alert after successful backup', async () => {
      mockBackupService.createManualBackup.mockResolvedValue({
        version: '1.0.0',
        timestamp: new Date(),
        metadata: { transactionCount: 0, categoryCount: 0, checksum: 'test' },
        transactions: [],
        categories: [],
      });

      renderComponent();

      const backupButton = screen.getByText('バックアップを作成');
      await userEvent.click(backupButton);

      await waitFor(() => {
        expect(
          screen.getByText('バックアップが正常に作成されました')
        ).toBeInTheDocument();
      });
    });
  });
});
