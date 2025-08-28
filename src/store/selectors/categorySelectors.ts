import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { Category } from '../../types';

// Base selectors
export const selectCategoryState = (state: RootState) => state.categories;
export const selectCategories = (state: RootState) => state.categories.categories;
export const selectCurrentCategory = (state: RootState) => state.categories.currentCategory;
export const selectCategoryLoading = (state: RootState) => state.categories.loading;

// Memoized selectors
export const selectCategoriesByType = createSelector(
  [selectCategories],
  (categories) => ({
    income: categories.filter(c => c.type === 'income' || c.type === 'both'),
    expense: categories.filter(c => c.type === 'expense' || c.type === 'both'),
    both: categories.filter(c => c.type === 'both'),
  })
);

export const selectIncomeCategories = createSelector(
  [selectCategories],
  (categories) => categories.filter(c => c.type === 'income' || c.type === 'both')
);

export const selectExpenseCategories = createSelector(
  [selectCategories],
  (categories) => categories.filter(c => c.type === 'expense' || c.type === 'both')
);

export const selectDefaultCategories = createSelector(
  [selectCategories],
  (categories) => categories.filter(c => c.isDefault)
);

export const selectCustomCategories = createSelector(
  [selectCategories],
  (categories) => categories.filter(c => !c.isDefault)
);

export const selectSortedCategories = createSelector(
  [selectCategories],
  (categories) => {
    return [...categories].sort((a, b) => {
      // Sort by: default categories first, then by name
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
  }
);

export const selectCategoryById = (id: string) =>
  createSelector(
    [selectCategories],
    (categories) => categories.find(c => c.id === id)
  );

export const selectCategoryOptions = createSelector(
  [selectSortedCategories],
  (categories) => categories.map(c => ({
    value: c.id,
    label: c.name,
    color: c.color,
    type: c.type,
  }))
);

export const selectCategoryStats = createSelector(
  [selectCategories],
  (categories) => ({
    total: categories.length,
    income: categories.filter(c => c.type === 'income').length,
    expense: categories.filter(c => c.type === 'expense').length,
    both: categories.filter(c => c.type === 'both').length,
    default: categories.filter(c => c.isDefault).length,
    custom: categories.filter(c => !c.isDefault).length,
  })
);