import {
  DataBackupService,
  BackupData,
  BackupOptions,
  RestoreOptions,
} from '../DataBackupService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock URL.createObjectURL and related functions
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document methods
const mockLink = {
  href: '',
  download: '',
  style: { visibility: '' },
  click: jest.fn(),
};

document.createElement = jest.fn().mockImplementation((tagName) => {
  if (tagName === 'a') {
    return mockLink;
  }
  return {};
});

document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();

// Mock the repositories
jest.mock('../../repositories/TransactionRepository', () => {
  return {
    TransactionRepository: jest.fn().mockImplementation(() => ({
      getTransactions: jest.fn().mockResolvedValue([]),
      createTransaction: jest.fn().mockResolvedValue({
        id: '1',
        date: new Date(),
        amount: 1000,
        description: 'Test',
        categoryId: 'cat1',
        type: 'income',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    })),
  };
});

jest.mock('../../repositories/CategoryRepository', () => {
  return {
    CategoryRepository: jest.fn().mockImplementation(() => ({
      getCategories: jest.fn().mockResolvedValue([]),
      createCategory: jest.fn().mockResolvedValue({
        id: 'cat1',
        name: 'Test Category',
        color: '#FF0000',
        type: 'income',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    })),
  };
});

describe('DataBackupService', () => {
  let service: DataBackupService;

  beforeEach(() => {
    service = new DataBackupService();
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  afterEach(() => {
    service.stopAutoBackup();
  });

  describe('createManualBackup', () => {
    it('should create backup with all data', async () => {
      const options: BackupOptions = {
        includeTransactions: true,
        includeCategories: true,
      };

      const result = await service.createManualBackup(options);

      expect(result).toBeDefined();
      expect(result.version).toBe('1.0.0');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.checksum).toBeDefined();
    });

    it('should create backup with only transactions', async () => {
      const options: BackupOptions = {
        includeTransactions: true,
        includeCategories: false,
      };

      const result = await service.createManualBackup(options);

      expect(result.metadata.categoryCount).toBe(0);
    });

    it('should create backup with only categories', async () => {
      const options: BackupOptions = {
        includeTransactions: false,
        includeCategories: true,
      };

      const result = await service.createManualBackup(options);

      expect(result.metadata.transactionCount).toBe(0);
    });

    it('should call progress callback', async () => {
      const progressCallback = jest.fn();
      const options: BackupOptions = {
        includeTransactions: true,
        includeCategories: true,
      };

      await service.createManualBackup(options, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          current: expect.any(Number),
          total: 100,
          stage: expect.any(String),
          message: expect.any(String),
        })
      );
    });
  });

  describe('validateBackupIntegrity', () => {
    let validBackupData: BackupData;

    beforeEach(() => {
      validBackupData = {
        version: '1.0.0',
        timestamp: new Date(),
        metadata: {
          transactionCount: 0,
          categoryCount: 0,
          checksum: 'valid-checksum',
        },
        transactions: [],
        categories: [],
      };
    });

    it('should detect missing version', async () => {
      delete (validBackupData as any).version;

      const result = await service.validateBackupIntegrity(validBackupData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'バックアップファイルにバージョン情報がありません'
      );
    });

    it('should detect missing metadata', async () => {
      delete (validBackupData as any).metadata;

      const result = await service.validateBackupIntegrity(validBackupData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'バックアップファイルにメタデータがありません'
      );
    });

    it('should detect transaction count mismatch', async () => {
      validBackupData.metadata.transactionCount = 5;

      const result = await service.validateBackupIntegrity(validBackupData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('取引データ数がメタデータと一致しません');
    });

    it('should detect invalid data structure', async () => {
      (validBackupData as any).transactions = 'invalid';

      const result = await service.validateBackupIntegrity(validBackupData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('取引データの形式が正しくありません');
    });
  });

  describe('restoreFromBackup', () => {
    let backupData: BackupData;

    beforeEach(() => {
      backupData = {
        version: '1.0.0',
        timestamp: new Date(),
        metadata: {
          transactionCount: 0,
          categoryCount: 0,
          checksum: 'valid-checksum',
        },
        transactions: [],
        categories: [],
      };
    });

    it('should restore data successfully', async () => {
      const options: RestoreOptions = {
        skipDuplicates: true,
        validateIntegrity: false, // Skip integrity check for this test
        createMissingCategories: false,
      };

      const result = await service.restoreFromBackup(backupData, options);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate integrity when option is enabled', async () => {
      const options: RestoreOptions = {
        skipDuplicates: true,
        validateIntegrity: true,
        createMissingCategories: false,
      };

      // Set invalid checksum
      backupData.metadata.checksum = 'invalid';

      const result = await service.restoreFromBackup(backupData, options);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('auto backup functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start auto backup', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.startAutoBackup(60);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Auto backup started with 60 minute interval'
      );

      consoleSpy.mockRestore();
    });

    it('should stop auto backup', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.startAutoBackup(60);
      service.stopAutoBackup();

      expect(consoleSpy).toHaveBeenCalledWith('Auto backup stopped');

      consoleSpy.mockRestore();
    });
  });

  describe('downloadBackup', () => {
    it('should create download link', () => {
      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date('2024-01-01'),
        metadata: { transactionCount: 0, categoryCount: 0, checksum: 'test' },
        transactions: [],
        categories: [],
      };

      service.downloadBackup(backupData);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('accounting_backup_2024-01-01.json');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should use custom filename', () => {
      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date(),
        metadata: { transactionCount: 0, categoryCount: 0, checksum: 'test' },
        transactions: [],
        categories: [],
      };

      service.downloadBackup(backupData, 'custom_backup.json');

      expect(mockLink.download).toBe('custom_backup.json');
    });
  });

  describe('getAutoBackups', () => {
    it('should return empty array when no backups exist', () => {
      Object.defineProperty(localStorage, 'length', { value: 0 });
      Object.keys = jest.fn().mockReturnValue([]);

      const result = service.getAutoBackups();

      expect(result).toEqual([]);
    });

    it('should return parsed backup data', () => {
      const mockBackupData = {
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z',
        metadata: { transactionCount: 1, categoryCount: 1, checksum: 'test' },
        transactions: [
          {
            id: '1',
            date: '2024-01-01T00:00:00.000Z',
            amount: 1000,
            description: 'Test',
            categoryId: 'cat1',
            type: 'income',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        categories: [
          {
            id: 'cat1',
            name: 'Test Category',
            color: '#FF0000',
            type: 'income',
            isDefault: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      Object.keys = jest.fn().mockReturnValue(['auto_backup_1234567890']);
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockBackupData));

      const result = service.getAutoBackups();

      expect(result).toHaveLength(1);
      expect(result[0].timestamp).toBeInstanceOf(Date);
      expect(result[0].transactions[0].date).toBeInstanceOf(Date);
      expect(result[0].categories[0].createdAt).toBeInstanceOf(Date);
    });

    it('should handle parsing errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      Object.keys = jest.fn().mockReturnValue(['auto_backup_1234567890']);
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = service.getAutoBackups();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('calculateChecksum', () => {
    it('should generate consistent checksum for same data', async () => {
      const transactions: any[] = [];
      const categories: any[] = [];

      const checksum1 = await (service as any).calculateChecksum(
        transactions,
        categories
      );
      const checksum2 = await (service as any).calculateChecksum(
        transactions,
        categories
      );

      expect(checksum1).toBe(checksum2);
      expect(typeof checksum1).toBe('string');
      expect(checksum1.length).toBeGreaterThan(0);
    });

    it('should generate different checksums for different data', async () => {
      const transactions1: any[] = [];
      const transactions2: any[] = [{ id: '1', amount: 1000 }];
      const categories: any[] = [];

      const checksum1 = await (service as any).calculateChecksum(
        transactions1,
        categories
      );
      const checksum2 = await (service as any).calculateChecksum(
        transactions2,
        categories
      );

      expect(checksum1).not.toBe(checksum2);
    });
  });
});
