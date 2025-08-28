import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Box,
  SelectProps,
} from '@mui/material';
import { Category } from '../../types';

interface CategorySelectorProps
  extends Omit<SelectProps, 'value' | 'onChange'> {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  categories: Category[];
  filterByType?: 'income' | 'expense' | 'both';
  showColors?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
  groupByType?: boolean;
  helperText?: React.ReactNode;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  categories,
  filterByType,
  showColors = true,
  allowEmpty = false,
  emptyLabel = '選択してください',
  groupByType = false,
  label = 'カテゴリ',
  error,
  helperText,
  ...selectProps
}) => {
  // Filter categories based on type
  const filteredCategories = React.useMemo(() => {
    if (!filterByType || filterByType === 'both') {
      return categories;
    }

    return categories.filter(
      (category) => category.type === filterByType || category.type === 'both'
    );
  }, [categories, filterByType]);

  // Group categories by type if requested
  const groupedCategories = React.useMemo(() => {
    if (!groupByType) {
      return { all: filteredCategories };
    }

    const groups: { [key: string]: Category[] } = {
      income: [],
      expense: [],
      both: [],
    };

    filteredCategories.forEach((category) => {
      groups[category.type].push(category);
    });

    return groups;
  }, [filteredCategories, groupByType]);

  const handleChange = (event: any) => {
    const selectedValue = event.target.value;
    onChange(selectedValue === '' ? null : selectedValue);
  };

  const renderCategoryItem = (category: Category) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {showColors && (
        <Box
          sx={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: category.color,
            border: '1px solid',
            borderColor: 'divider',
          }}
        />
      )}
      <span>{category.name}</span>
      {category.isDefault && (
        <Chip
          label="デフォルト"
          size="small"
          variant="outlined"
          sx={{ ml: 'auto', fontSize: '0.7rem', height: 20 }}
        />
      )}
    </Box>
  );

  const renderMenuItems = () => {
    const items: React.ReactNode[] = [];

    // Add empty option if allowed
    if (allowEmpty) {
      items.push(
        <MenuItem key="empty" value="">
          <em>{emptyLabel}</em>
        </MenuItem>
      );
    }

    if (groupByType) {
      // Render grouped categories
      Object.entries(groupedCategories).forEach(([type, categoryList]) => {
        if (categoryList.length === 0) return;

        // Add group header
        const typeLabels = {
          income: '収入',
          expense: '支出',
          both: '共通',
        };

        items.push(
          <MenuItem key={`header-${type}`} disabled sx={{ fontWeight: 'bold' }}>
            {typeLabels[type as keyof typeof typeLabels]}
          </MenuItem>
        );

        // Add categories in this group
        categoryList.forEach((category) => {
          items.push(
            <MenuItem key={category.id} value={category.id}>
              {renderCategoryItem(category)}
            </MenuItem>
          );
        });
      });
    } else {
      // Render flat list
      filteredCategories.forEach((category) => {
        items.push(
          <MenuItem key={category.id} value={category.id}>
            {renderCategoryItem(category)}
          </MenuItem>
        );
      });
    }

    return items;
  };

  return (
    <FormControl fullWidth error={error}>
      <InputLabel id={`category-selector-${selectProps.id || 'default'}`}>
        {label}
      </InputLabel>
      <Select
        {...selectProps}
        labelId={`category-selector-${selectProps.id || 'default'}`}
        value={value || ''}
        onChange={handleChange}
        label={label}
        renderValue={(selected) => {
          if (!selected) return emptyLabel;

          const category = categories.find((cat) => cat.id === selected);
          if (!category) return selected as string;

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {showColors && (
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: category.color,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              )}
              {category.name}
            </Box>
          );
        }}
      >
        {renderMenuItems()}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default CategorySelector;
