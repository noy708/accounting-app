import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Category, CreateCategoryDto, UpdateCategoryDto, LoadingState } from '../../types';

interface CategoryState {
  categories: Category[];
  currentCategory: Category | null;
  loading: LoadingState;
  lastUpdated: string | null;
}

const initialState: CategoryState = {
  categories: [],
  currentCategory: null,
  loading: {
    isLoading: false,
  },
  lastUpdated: null,
};

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    // Loading states
    setCategoryLoading: (state, action: PayloadAction<{ isLoading: boolean; operation?: string }>) => {
      state.loading = action.payload;
    },
    
    // Category CRUD operations (sync)
    addCategory: (state, action: PayloadAction<Category>) => {
      state.categories.push(action.payload);
      state.lastUpdated = new Date().toISOString();
    },
    
    updateCategory: (state, action: PayloadAction<Category>) => {
      const index = state.categories.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = action.payload;
        state.lastUpdated = new Date().toISOString();
      }
    },
    
    removeCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(c => c.id !== action.payload);
      state.lastUpdated = new Date().toISOString();
    },
    
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    
    // Current category management
    setCurrentCategory: (state, action: PayloadAction<Category | null>) => {
      state.currentCategory = action.payload;
    },
    
    // Utility actions
    sortCategories: (state, action: PayloadAction<'name' | 'type' | 'createdAt'>) => {
      const sortBy = action.payload;
      state.categories.sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'type') {
          return a.type.localeCompare(b.type);
        } else if (sortBy === 'createdAt') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return 0;
      });
    },
    
    // Filter categories by type
    getCategoriesByType: (state, action: PayloadAction<'income' | 'expense' | 'both'>) => {
      // This is a selector-like action, but we'll implement proper selectors separately
      // For now, this just marks the intent
    },
    
    // Reset state
    resetCategoryState: (state) => {
      return initialState;
    },
  },
});

export const {
  setCategoryLoading,
  addCategory,
  updateCategory,
  removeCategory,
  setCategories,
  setCurrentCategory,
  sortCategories,
  getCategoriesByType,
  resetCategoryState,
} = categorySlice.actions;

export default categorySlice.reducer;