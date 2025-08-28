import { DefaultCategoryService, defaultCategoryService } from '../DefaultCategoryService';
import { categoryRepository } from '../../repositories/CategoryRepository';
import { Category } from '../../../types';

// Mock the category repository
jest.mock('../../repositories/CategoryRepository', () => ({
  categoryRepository: {
    getCategories: jest.fn(),
    createDefaultCategories: jest.fn(),
  },
}));

const mockCategoryRepository = categoryRepository as jest.Mocked<typeof categoryRepository>;

describe('DefaultCategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton state
    defaultCategoryService.resetInitializationState();
  });

  describe('initializeDefaultCategories', () => {
    it('creates default categories when none exist', async () => {
      mockCategoryRepository.getCategories.mockResolvedValue([]);
      mockCategoryRepository.createDefaultCategories.mockResolvedValue();

      await defaultCategoryService.initializeDefaultCategories();

      expect(mockCategoryRepository.getCategories).toHaveBeenCalled();
      expect(mockCategoryRepository.createDefaultCategories).toHaveBeenCalled();
      expect(defaultCategoryService.isDefaultCategoriesInitialized()).toBe(true);
    });

    it('skips creation when categories already exist', async () => {
      const existingCategories: Category[] = [
        {
          id: '1',
          name: '食費',
          color: '#ff5722',
          type: 'expense',
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCategoryRepository.getCategories.mockResolvedValue(existingCategories);

      await defaultCategoryService.initializeDefaultCategories();

      expect(mockCategoryRepository.getCategories).toHaveBeenCalled();
      expect(mockCategoryRepository.createDefaultCategories).not.toHaveBeenCalled();
      expect(defaultCategoryService.isDefaultCategoriesInitialized()).toBe(true);
    });

    it('handles errors gracefully without throwing', async () => {
      mockCategoryRepository.getCategories.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(defaultCategoryService.initializeDefaultCategories()).resolves.toBeUndefined();

      expect(mockCategoryRepository.createDefaultCategories).not.toHaveBeenCalled();
    });

    it('only initializes once', async () => {
      // Create a fresh instance for this test to avoid state pollution
      const freshService = DefaultCategoryService.getInstance();
      freshService.resetInitializationState();
      
      mockCategoryRepository.getCategories.mockResolvedValue([]);
      mockCategoryRepository.createDefaultCategories.mockResolvedValue();

      // Call twice
      await freshService.initializeDefaultCategories();
      await freshService.initializeDefaultCategories();

      // Should only call repository methods once (the second call should be skipped)
      expect(mockCategoryRepository.getCategories).toHaveBeenCalledTimes(1);
      expect(mockCategoryRepository.createDefaultCategories).toHaveBeenCalledTimes(1);
    });
  });

  describe('forceCreateDefaultCategories', () => {
    it('creates default categories regardless of existing ones', async () => {
      mockCategoryRepository.createDefaultCategories.mockResolvedValue();
      mockCategoryRepository.getCategories.mockResolvedValue([]);

      await defaultCategoryService.forceCreateDefaultCategories();

      expect(mockCategoryRepository.createDefaultCategories).toHaveBeenCalled();
      expect(mockCategoryRepository.getCategories).toHaveBeenCalled();
    });

    it('throws error when creation fails', async () => {
      mockCategoryRepository.createDefaultCategories.mockRejectedValue(new Error('Creation failed'));

      await expect(defaultCategoryService.forceCreateDefaultCategories()).rejects.toThrow(
        'デフォルトカテゴリの強制作成に失敗しました'
      );
    });
  });

  describe('getDefaultCategoryTemplates', () => {
    it('returns expense and income category templates', () => {
      const templates = defaultCategoryService.getDefaultCategoryTemplates();

      expect(templates).toHaveProperty('expense');
      expect(templates).toHaveProperty('income');
      expect(Array.isArray(templates.expense)).toBe(true);
      expect(Array.isArray(templates.income)).toBe(true);
      expect(templates.expense.length).toBeGreaterThan(0);
      expect(templates.income.length).toBeGreaterThan(0);
    });

    it('returns templates with required properties', () => {
      const templates = defaultCategoryService.getDefaultCategoryTemplates();

      templates.expense.forEach(template => {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('color');
        expect(template).toHaveProperty('description');
        expect(typeof template.name).toBe('string');
        expect(typeof template.color).toBe('string');
        expect(typeof template.description).toBe('string');
        expect(template.color).toMatch(/^#[0-9A-F]{6}$/i);
      });

      templates.income.forEach(template => {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('color');
        expect(template).toHaveProperty('description');
        expect(typeof template.name).toBe('string');
        expect(typeof template.color).toBe('string');
        expect(typeof template.description).toBe('string');
        expect(template.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('singleton behavior', () => {
    it('returns the same instance', () => {
      const instance1 = DefaultCategoryService.getInstance();
      const instance2 = DefaultCategoryService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('state management', () => {
    it('tracks initialization state correctly', async () => {
      expect(defaultCategoryService.isDefaultCategoriesInitialized()).toBe(false);

      mockCategoryRepository.getCategories.mockResolvedValue([]);
      mockCategoryRepository.createDefaultCategories.mockResolvedValue();

      await defaultCategoryService.initializeDefaultCategories();

      expect(defaultCategoryService.isDefaultCategoriesInitialized()).toBe(true);
    });

    it('can reset initialization state', async () => {
      mockCategoryRepository.getCategories.mockResolvedValue([]);
      mockCategoryRepository.createDefaultCategories.mockResolvedValue();

      await defaultCategoryService.initializeDefaultCategories();
      expect(defaultCategoryService.isDefaultCategoriesInitialized()).toBe(true);

      defaultCategoryService.resetInitializationState();
      expect(defaultCategoryService.isDefaultCategoriesInitialized()).toBe(false);
    });
  });

  describe('template content validation', () => {
    it('includes expected expense categories', () => {
      const templates = defaultCategoryService.getDefaultCategoryTemplates();
      const expenseNames = templates.expense.map(t => t.name);

      expect(expenseNames).toContain('食費');
      expect(expenseNames).toContain('交通費');
      expect(expenseNames).toContain('光熱費');
      expect(expenseNames).toContain('通信費');
    });

    it('includes expected income categories', () => {
      const templates = defaultCategoryService.getDefaultCategoryTemplates();
      const incomeNames = templates.income.map(t => t.name);

      expect(incomeNames).toContain('給与');
      expect(incomeNames).toContain('副業');
      expect(incomeNames).toContain('投資');
    });
  });
});