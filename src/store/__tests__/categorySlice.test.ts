import categoryReducer, {
  addCategory,
  updateCategory,
  removeCategory,
  setCategories,
  setCurrentCategory,
  sortCategories,
  setLoading,
  resetCategoryState,
} from '../slices/categorySlice';
import { Category } from '../../types';

const mockCategory: Category = {
  id: '1',
  name: 'Food',
  color: '#FF5722',
  type: 'expense',
  isDefault: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const initialState = {
  categories: [],
  currentCategory: null,
  loading: {
    isLoading: false,
  },
  lastUpdated: null,
};

describe('categorySlice', () => {
  it('should return the initial state', () => {
    expect(categoryReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle addCategory', () => {
    const actual = categoryReducer(initialState, addCategory(mockCategory));
    expect(actual.categories).toHaveLength(1);
    expect(actual.categories[0]).toEqual(mockCategory);
    expect(actual.lastUpdated).toBeTruthy();
  });

  it('should handle updateCategory', () => {
    const stateWithCategory = {
      ...initialState,
      categories: [mockCategory],
    };
    
    const updatedCategory = { ...mockCategory, name: 'Updated Food' };
    const actual = categoryReducer(stateWithCategory, updateCategory(updatedCategory));
    
    expect(actual.categories[0].name).toBe('Updated Food');
    expect(actual.lastUpdated).toBeTruthy();
  });

  it('should handle removeCategory', () => {
    const stateWithCategory = {
      ...initialState,
      categories: [mockCategory],
    };
    
    const actual = categoryReducer(stateWithCategory, removeCategory('1'));
    
    expect(actual.categories).toHaveLength(0);
    expect(actual.lastUpdated).toBeTruthy();
  });

  it('should handle setCategories', () => {
    const categories = [mockCategory, { ...mockCategory, id: '2', name: 'Transport' }];
    const actual = categoryReducer(initialState, setCategories(categories));
    
    expect(actual.categories).toHaveLength(2);
    expect(actual.lastUpdated).toBeTruthy();
  });

  it('should handle setCurrentCategory', () => {
    const actual = categoryReducer(initialState, setCurrentCategory(mockCategory));
    expect(actual.currentCategory).toEqual(mockCategory);
  });

  it('should handle sortCategories by name', () => {
    const categories = [
      { ...mockCategory, id: '1', name: 'Zebra' },
      { ...mockCategory, id: '2', name: 'Apple' },
      { ...mockCategory, id: '3', name: 'Banana' },
    ];
    
    const stateWithCategories = {
      ...initialState,
      categories,
    };
    
    const actual = categoryReducer(stateWithCategories, sortCategories('name'));
    
    expect(actual.categories[0].name).toBe('Apple');
    expect(actual.categories[1].name).toBe('Banana');
    expect(actual.categories[2].name).toBe('Zebra');
  });

  it('should handle sortCategories by type', () => {
    const categories = [
      { ...mockCategory, id: '1', type: 'income' as const },
      { ...mockCategory, id: '2', type: 'expense' as const },
      { ...mockCategory, id: '3', type: 'both' as const },
    ];
    
    const stateWithCategories = {
      ...initialState,
      categories,
    };
    
    const actual = categoryReducer(stateWithCategories, sortCategories('type'));
    
    expect(actual.categories[0].type).toBe('both');
    expect(actual.categories[1].type).toBe('expense');
    expect(actual.categories[2].type).toBe('income');
  });

  it('should handle setLoading', () => {
    const actual = categoryReducer(initialState, setLoading({ isLoading: true, operation: 'create' }));
    expect(actual.loading.isLoading).toBe(true);
    expect(actual.loading.operation).toBe('create');
  });

  it('should handle resetCategoryState', () => {
    const modifiedState = {
      ...initialState,
      categories: [mockCategory],
      currentCategory: mockCategory,
    };
    
    const actual = categoryReducer(modifiedState, resetCategoryState());
    expect(actual).toEqual(initialState);
  });
});