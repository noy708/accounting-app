import { categoryRepository } from '../../database/repositories/CategoryRepository';
import { Category, CreateCategoryDto } from '../../types';

// Mock the repository
jest.mock('../../database/repositories/CategoryRepository');

const mockCategoryRepository = categoryRepository as jest.Mocked<
  typeof categoryRepository
>;

const mockCategory: Category = {
  id: '1',
  name: 'Food',
  color: '#FF5722',
  type: 'expense',
  isDefault: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('categoryApi integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('repository integration', () => {
    it('should call getCategories', async () => {
      const mockCategories = [mockCategory];
      mockCategoryRepository.getCategories.mockResolvedValue(mockCategories);

      const result = await mockCategoryRepository.getCategories();

      expect(result).toEqual(mockCategories);
      expect(mockCategoryRepository.getCategories).toHaveBeenCalled();
    });

    it('should call getCategoryById with correct ID', async () => {
      mockCategoryRepository.getCategoryById.mockResolvedValue(mockCategory);

      const result = await mockCategoryRepository.getCategoryById('1');

      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepository.getCategoryById).toHaveBeenCalledWith('1');
    });

    it('should call getCategoriesByType with correct type', async () => {
      const mockCategories = [mockCategory];
      mockCategoryRepository.getCategoriesByType.mockResolvedValue(
        mockCategories
      );

      const result =
        await mockCategoryRepository.getCategoriesByType('expense');

      expect(result).toEqual(mockCategories);
      expect(mockCategoryRepository.getCategoriesByType).toHaveBeenCalledWith(
        'expense'
      );
    });

    it('should call createCategory with correct data', async () => {
      const createDto: CreateCategoryDto = {
        name: 'Food',
        color: '#FF5722',
        type: 'expense',
      };

      mockCategoryRepository.createCategory.mockResolvedValue(mockCategory);

      const result = await mockCategoryRepository.createCategory(createDto);

      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepository.createCategory).toHaveBeenCalledWith(
        createDto
      );
    });

    it('should call updateCategory with correct parameters', async () => {
      const updateData = { name: 'Updated Food' };
      const updatedCategory = { ...mockCategory, ...updateData };

      mockCategoryRepository.updateCategory.mockResolvedValue(updatedCategory);

      const result = await mockCategoryRepository.updateCategory(
        '1',
        updateData
      );

      expect(result).toEqual(updatedCategory);
      expect(mockCategoryRepository.updateCategory).toHaveBeenCalledWith(
        '1',
        updateData
      );
    });

    it('should call deleteCategory with correct ID', async () => {
      mockCategoryRepository.deleteCategory.mockResolvedValue();

      await mockCategoryRepository.deleteCategory('1');

      expect(mockCategoryRepository.deleteCategory).toHaveBeenCalledWith('1');
    });

    it('should call isCategoryInUse with correct ID', async () => {
      mockCategoryRepository.isCategoryInUse.mockResolvedValue(true);

      const result = await mockCategoryRepository.isCategoryInUse('1');

      expect(result).toBe(true);
      expect(mockCategoryRepository.isCategoryInUse).toHaveBeenCalledWith('1');
    });

    it('should call createDefaultCategories', async () => {
      mockCategoryRepository.createDefaultCategories.mockResolvedValue();

      await mockCategoryRepository.createDefaultCategories();

      expect(mockCategoryRepository.createDefaultCategories).toHaveBeenCalled();
    });
  });
});
