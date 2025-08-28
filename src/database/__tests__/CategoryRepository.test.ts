// Unit tests for CategoryRepository
import { CategoryRepository } from '../repositories/CategoryRepository';
import { db } from '../schema';
import { DatabaseError } from '../connection';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../types';

// Mock the database
jest.mock('../schema', () => ({
  db: {
    categories: {
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
      orderBy: jest.fn(),
      where: jest.fn(),
      bulkAdd: jest.fn(),
    },
    transactions: {
      where: jest.fn(),
    },
  },
}));

describe('CategoryRepository', () => {
  let categoryRepository: CategoryRepository;
  let mockDb: any;

  beforeEach(() => {
    categoryRepository = new CategoryRepository();
    mockDb = db as any;
    jest.clearAllMocks();

    // Setup default mock chains
    mockDb.categories.orderBy.mockReturnValue({
      toArray: jest.fn(),
    });

    mockDb.categories.where.mockReturnValue({
      equals: jest.fn().mockReturnValue({
        toArray: jest.fn(),
        count: jest.fn(),
      }),
      equalsIgnoreCase: jest.fn().mockReturnValue({
        first: jest.fn(),
      }),
      anyOf: jest.fn().mockReturnValue({
        sortBy: jest.fn(),
      }),
    });

    mockDb.transactions.where.mockReturnValue({
      equals: jest.fn().mockReturnValue({
        count: jest.fn(),
      }),
    });
  });

  describe('createCategory', () => {
    const validCategoryDto: CreateCategoryDto = {
      name: 'テストカテゴリ',
      color: '#FF6B6B',
      type: 'expense',
    };

    it('should create a category successfully', async () => {
      // Setup
      mockDb.categories.where().equalsIgnoreCase().first.mockResolvedValue(null);
      mockDb.categories.add.mockResolvedValue('test-id');

      // Execute
      const result = await categoryRepository.createCategory(validCategoryDto);

      // Verify
      expect(result).toMatchObject({
        name: validCategoryDto.name,
        color: validCategoryDto.color,
        type: validCategoryDto.type,
        isDefault: false,
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(mockDb.categories.add).toHaveBeenCalledWith(
        expect.objectContaining(validCategoryDto)
      );
    });

    it('should throw validation error for missing name', async () => {
      // Setup
      const invalidDto = { ...validCategoryDto, name: '' };

      // Execute & Verify
      await expect(categoryRepository.createCategory(invalidDto)).rejects.toThrow(
        DatabaseError
      );
      await expect(categoryRepository.createCategory(invalidDto)).rejects.toThrow(
        'カテゴリ名は必須です'
      );
    });

    it('should throw validation error for invalid color format', async () => {
      // Setup
      const invalidDto = { ...validCategoryDto, color: 'invalid-color' };

      // Execute & Verify
      await expect(categoryRepository.createCategory(invalidDto)).rejects.toThrow(
        DatabaseError
      );
      await expect(categoryRepository.createCategory(invalidDto)).rejects.toThrow(
        'カラーは有効なHEX形式'
      );
    });

    it('should throw validation error for invalid type', async () => {
      // Setup
      const invalidDto = { ...validCategoryDto, type: 'invalid' as any };

      // Execute & Verify
      await expect(categoryRepository.createCategory(invalidDto)).rejects.toThrow(
        DatabaseError
      );
      await expect(categoryRepository.createCategory(invalidDto)).rejects.toThrow(
        'カテゴリタイプは収入、支出、または両方である必要があります'
      );
    });

    it('should throw error for duplicate category name', async () => {
      // Setup
      const existingCategory = { id: 'existing-id', name: validCategoryDto.name };
      mockDb.categories.where().equalsIgnoreCase().first.mockResolvedValue(existingCategory);

      // Execute & Verify
      await expect(categoryRepository.createCategory(validCategoryDto)).rejects.toThrow(
        DatabaseError
      );
      await expect(categoryRepository.createCategory(validCategoryDto)).rejects.toThrow(
        '同じ名前のカテゴリが既に存在します'
      );
    });

    it('should throw error for name longer than 50 characters', async () => {
      // Setup
      const longName = 'a'.repeat(51);
      const invalidDto = { ...validCategoryDto, name: longName };

      // Execute & Verify
      await expect(categoryRepository.createCategory(invalidDto)).rejects.toThrow(
        DatabaseError
      );
      await expect(categoryRepository.createCategory(invalidDto)).rejects.toThrow(
        'カテゴリ名は50文字以内で入力してください'
      );
    });
  });

  describe('updateCategory', () => {
    const existingCategory: Category = {
      id: 'test-id',
      name: '既存カテゴリ',
      color: '#FF6B6B',
      type: 'expense',
      isDefault: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    };

    const updateDto: UpdateCategoryDto = {
      name: '更新されたカテゴリ',
      color: '#00FF00',
    };

    it('should update a category successfully', async () => {
      // Setup
      mockDb.categories.get.mockResolvedValue(existingCategory);
      mockDb.categories.where().equalsIgnoreCase().first.mockResolvedValue(null);
      mockDb.categories.update.mockResolvedValue(1);

      const updatedCategory = { ...existingCategory, ...updateDto };
      mockDb.categories.get.mockResolvedValueOnce(existingCategory)
        .mockResolvedValueOnce(updatedCategory);

      // Execute
      const result = await categoryRepository.updateCategory('test-id', updateDto);

      // Verify
      expect(result.name).toBe(updateDto.name);
      expect(result.color).toBe(updateDto.color);
      expect(mockDb.categories.update).toHaveBeenCalledWith(
        'test-id',
        expect.objectContaining({
          ...updateDto,
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should throw error when category not found', async () => {
      // Setup
      mockDb.categories.get.mockResolvedValue(null);

      // Execute & Verify
      await expect(
        categoryRepository.updateCategory('non-existent-id', updateDto)
      ).rejects.toThrow(DatabaseError);
      await expect(
        categoryRepository.updateCategory('non-existent-id', updateDto)
      ).rejects.toThrow('カテゴリが見つかりません');
    });

    it('should throw error for duplicate name when updating', async () => {
      // Setup
      mockDb.categories.get.mockResolvedValue(existingCategory);
      const duplicateCategory = { id: 'other-id', name: updateDto.name };
      mockDb.categories.where().equalsIgnoreCase().first.mockResolvedValue(duplicateCategory);

      // Execute & Verify
      await expect(
        categoryRepository.updateCategory('test-id', updateDto)
      ).rejects.toThrow(DatabaseError);
      await expect(
        categoryRepository.updateCategory('test-id', updateDto)
      ).rejects.toThrow('同じ名前のカテゴリが既に存在します');
    });

    it('should allow updating with same name', async () => {
      // Setup
      const sameNameUpdate = { ...updateDto, name: existingCategory.name };
      mockDb.categories.get.mockResolvedValue(existingCategory);
      mockDb.categories.update.mockResolvedValue(1);

      const updatedCategory = { ...existingCategory, ...sameNameUpdate };
      mockDb.categories.get.mockResolvedValueOnce(existingCategory)
        .mockResolvedValueOnce(updatedCategory);

      // Execute
      const result = await categoryRepository.updateCategory('test-id', sameNameUpdate);

      // Verify
      expect(result).toBeDefined();
      expect(mockDb.categories.update).toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    const existingCategory: Category = {
      id: 'test-id',
      name: 'テストカテゴリ',
      color: '#FF6B6B',
      type: 'expense',
      isDefault: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    };

    it('should delete a category successfully', async () => {
      // Setup
      mockDb.categories.get.mockResolvedValue(existingCategory);
      mockDb.transactions.where().equals().count.mockResolvedValue(0);
      mockDb.categories.delete.mockResolvedValue(1);

      // Execute
      await categoryRepository.deleteCategory('test-id');

      // Verify
      expect(mockDb.categories.delete).toHaveBeenCalledWith('test-id');
    });

    it('should throw error when category not found', async () => {
      // Setup
      mockDb.categories.get.mockResolvedValue(null);

      // Execute & Verify
      await expect(categoryRepository.deleteCategory('non-existent-id')).rejects.toThrow(
        DatabaseError
      );
      await expect(categoryRepository.deleteCategory('non-existent-id')).rejects.toThrow(
        'カテゴリが見つかりません'
      );
    });

    it('should throw error when category is in use', async () => {
      // Setup
      mockDb.categories.get.mockResolvedValue(existingCategory);
      mockDb.transactions.where().equals().count.mockResolvedValue(5); // 5 transactions using this category

      // Execute & Verify
      await expect(categoryRepository.deleteCategory('test-id')).rejects.toThrow(
        DatabaseError
      );
      await expect(categoryRepository.deleteCategory('test-id')).rejects.toThrow(
        'このカテゴリは取引で使用されているため削除できません'
      );
    });

    it('should throw error when trying to delete default category', async () => {
      // Setup
      const defaultCategory = { ...existingCategory, isDefault: true };
      mockDb.categories.get.mockResolvedValue(defaultCategory);
      mockDb.transactions.where().equals().count.mockResolvedValue(0);

      // Execute & Verify
      await expect(categoryRepository.deleteCategory('test-id')).rejects.toThrow(
        DatabaseError
      );
      await expect(categoryRepository.deleteCategory('test-id')).rejects.toThrow(
        'デフォルトカテゴリは削除できません'
      );
    });
  });

  describe('getCategories', () => {
    const mockCategories = [
      {
        id: '1',
        name: 'カテゴリA',
        color: '#FF6B6B',
        type: 'expense',
        isDefault: false,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        name: 'カテゴリB',
        color: '#00FF00',
        type: 'income',
        isDefault: true,
        createdAt: '2023-01-02T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z',
      },
    ];

    it('should return all categories sorted by name', async () => {
      // Setup
      mockDb.categories.orderBy().toArray.mockResolvedValue(mockCategories);

      // Execute
      const result = await categoryRepository.getCategories();

      // Verify
      expect(result).toHaveLength(2);
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
      expect(mockDb.categories.orderBy).toHaveBeenCalledWith('name');
    });

    it('should return empty array when no categories exist', async () => {
      // Setup
      mockDb.categories.orderBy().toArray.mockResolvedValue([]);

      // Execute
      const result = await categoryRepository.getCategories();

      // Verify
      expect(result).toEqual([]);
    });
  });

  describe('getCategoryById', () => {
    const mockCategory = {
      id: 'test-id',
      name: 'テストカテゴリ',
      color: '#FF6B6B',
      type: 'expense',
      isDefault: false,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };

    it('should return category by ID', async () => {
      // Setup
      mockDb.categories.get.mockResolvedValue(mockCategory);

      // Execute
      const result = await categoryRepository.getCategoryById('test-id');

      // Verify
      expect(result.id).toBe('test-id');
      expect(result.name).toBe('テストカテゴリ');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when category not found', async () => {
      // Setup
      mockDb.categories.get.mockResolvedValue(null);

      // Execute & Verify
      await expect(categoryRepository.getCategoryById('non-existent-id')).rejects.toThrow(
        DatabaseError
      );
      await expect(categoryRepository.getCategoryById('non-existent-id')).rejects.toThrow(
        'カテゴリが見つかりません'
      );
    });
  });

  describe('createDefaultCategories', () => {
    it('should create default categories when none exist', async () => {
      // Setup
      mockDb.categories.where().equals().toArray.mockResolvedValue([]);
      mockDb.categories.bulkAdd.mockResolvedValue(undefined);

      // Execute
      await categoryRepository.createDefaultCategories();

      // Verify
      expect(mockDb.categories.bulkAdd).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: '食費',
            color: '#FF6B6B',
            type: 'expense',
            isDefault: true,
          }),
          expect.objectContaining({
            name: '給与',
            color: '#2ECC71',
            type: 'income',
            isDefault: true,
          }),
        ])
      );
    });

    it('should skip creation when default categories already exist', async () => {
      // Setup
      const existingDefaultCategory = {
        id: 'existing-id',
        name: '既存デフォルト',
        isDefault: true,
      };
      mockDb.categories.where().equals().toArray.mockResolvedValue([existingDefaultCategory]);

      // Execute
      await categoryRepository.createDefaultCategories();

      // Verify
      expect(mockDb.categories.bulkAdd).not.toHaveBeenCalled();
    });
  });

  describe('isCategoryInUse', () => {
    it('should return true when category is in use', async () => {
      // Setup
      mockDb.transactions.where().equals().count.mockResolvedValue(3);

      // Execute
      const result = await categoryRepository.isCategoryInUse('test-id');

      // Verify
      expect(result).toBe(true);
      expect(mockDb.transactions.where).toHaveBeenCalledWith('categoryId');
    });

    it('should return false when category is not in use', async () => {
      // Setup
      mockDb.transactions.where().equals().count.mockResolvedValue(0);

      // Execute
      const result = await categoryRepository.isCategoryInUse('test-id');

      // Verify
      expect(result).toBe(false);
    });
  });

  describe('getCategoriesByType', () => {
    const mockCategories = [
      {
        id: '1',
        name: 'カテゴリA',
        color: '#FF6B6B',
        type: 'expense',
        isDefault: false,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        name: 'カテゴリB',
        color: '#00FF00',
        type: 'both',
        isDefault: true,
        createdAt: '2023-01-02T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z',
      },
    ];

    it('should return categories by type including "both"', async () => {
      // Setup
      mockDb.categories.where().anyOf().sortBy.mockResolvedValue(mockCategories);

      // Execute
      const result = await categoryRepository.getCategoriesByType('expense');

      // Verify
      expect(result).toHaveLength(2);
      expect(mockDb.categories.where().anyOf).toHaveBeenCalledWith(['expense', 'both']);
    });
  });

  describe('validation methods', () => {
    it('should validate category DTO with all required fields', () => {
      const validDto: CreateCategoryDto = {
        name: 'テストカテゴリ',
        color: '#FF6B6B',
        type: 'expense',
      };

      // This should not throw
      expect(() => {
        (categoryRepository as any).validateCategoryDto(validDto);
      }).not.toThrow();
    });

    it('should validate partial category DTO for updates', () => {
      const validPartialDto: UpdateCategoryDto = {
        name: '更新されたカテゴリ',
      };

      // This should not throw
      expect(() => {
        (categoryRepository as any).validatePartialCategoryDto(validPartialDto);
      }).not.toThrow();
    });

    it('should normalize category dates correctly', () => {
      const rawCategory = {
        id: 'test-id',
        name: 'テスト',
        color: '#FF6B6B',
        type: 'expense',
        isDefault: false,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      };

      const normalized = (categoryRepository as any).normalizeCategory(rawCategory);

      expect(normalized.createdAt).toBeInstanceOf(Date);
      expect(normalized.updatedAt).toBeInstanceOf(Date);
    });
  });
});