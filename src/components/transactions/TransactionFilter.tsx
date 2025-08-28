import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Collapse,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { DatePicker, CategorySelector, AmountInput } from '../common';
import { TransactionFilter } from '../../types';
import { useGetCategoriesQuery } from '../../store/api/categoryApi';

interface TransactionFilterComponentProps {
  filter?: TransactionFilter;
  onFilterChange: (filter: TransactionFilter | undefined) => void;
}

const TransactionFilterComponent: React.FC<TransactionFilterComponentProps> = ({
  filter,
  onFilterChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilter, setLocalFilter] = useState<TransactionFilter>(
    filter || {}
  );

  const { data: categories = [] } = useGetCategoriesQuery();

  // Handle individual filter field changes
  const handleStartDateChange = useCallback((date: Date | null) => {
    setLocalFilter((prev) => ({
      ...prev,
      startDate: date || undefined,
    }));
  }, []);

  const handleEndDateChange = useCallback((date: Date | null) => {
    setLocalFilter((prev) => ({
      ...prev,
      endDate: date || undefined,
    }));
  }, []);

  const handleCategoryChange = useCallback((categoryId: string | null) => {
    setLocalFilter((prev) => ({
      ...prev,
      categoryId: categoryId || undefined,
    }));
  }, []);

  const handleTypeChange = useCallback((type: 'income' | 'expense' | '') => {
    setLocalFilter((prev) => ({
      ...prev,
      type: type || undefined,
    }));
  }, []);

  const handleMinAmountChange = useCallback((amount: number | null) => {
    setLocalFilter((prev) => ({
      ...prev,
      minAmount: amount || undefined,
    }));
  }, []);

  const handleMaxAmountChange = useCallback((amount: number | null) => {
    setLocalFilter((prev) => ({
      ...prev,
      maxAmount: amount || undefined,
    }));
  }, []);

  const handleDescriptionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value.trim();
      setLocalFilter((prev) => ({
        ...prev,
        description: value || undefined,
      }));
    },
    []
  );

  // Apply filters
  const handleApplyFilter = useCallback(() => {
    // Remove undefined values from filter
    const cleanFilter = Object.entries(localFilter).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key as keyof TransactionFilter] = value;
        }
        return acc;
      },
      {} as TransactionFilter
    );

    // If no filters are set, pass undefined
    const hasFilters = Object.keys(cleanFilter).length > 0;
    onFilterChange(hasFilters ? cleanFilter : undefined);
    setIsExpanded(false);
  }, [localFilter, onFilterChange]);

  // Clear all filters
  const handleClearFilter = useCallback(() => {
    setLocalFilter({});
    onFilterChange(undefined);
  }, [onFilterChange]);

  // Reset local filter to current applied filter
  const handleReset = useCallback(() => {
    setLocalFilter(filter || {});
  }, [filter]);

  // Toggle expanded state
  const handleToggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Get active filter count
  const activeFilterCount = filter ? Object.keys(filter).length : 0;

  // Get filter summary chips
  const getFilterChips = useCallback(() => {
    if (!filter) return [];

    const chips: { label: string; onDelete: () => void }[] = [];

    if (filter.startDate || filter.endDate) {
      const startStr = filter.startDate
        ? filter.startDate.toLocaleDateString('ja-JP')
        : '';
      const endStr = filter.endDate
        ? filter.endDate.toLocaleDateString('ja-JP')
        : '';
      const dateLabel =
        filter.startDate && filter.endDate
          ? `${startStr} - ${endStr}`
          : filter.startDate
            ? `${startStr}以降`
            : `${endStr}以前`;

      chips.push({
        label: `期間: ${dateLabel}`,
        onDelete: () => {
          const newFilter = { ...filter };
          delete newFilter.startDate;
          delete newFilter.endDate;
          onFilterChange(
            Object.keys(newFilter).length > 0 ? newFilter : undefined
          );
        },
      });
    }

    if (filter.categoryId) {
      const category = categories.find((c) => c.id === filter.categoryId);
      chips.push({
        label: `カテゴリ: ${category?.name || '不明'}`,
        onDelete: () => {
          const newFilter = { ...filter };
          delete newFilter.categoryId;
          onFilterChange(
            Object.keys(newFilter).length > 0 ? newFilter : undefined
          );
        },
      });
    }

    if (filter.type) {
      chips.push({
        label: `種別: ${filter.type === 'income' ? '収入' : '支出'}`,
        onDelete: () => {
          const newFilter = { ...filter };
          delete newFilter.type;
          onFilterChange(
            Object.keys(newFilter).length > 0 ? newFilter : undefined
          );
        },
      });
    }

    if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
      const minStr =
        filter.minAmount !== undefined ? filter.minAmount.toLocaleString() : '';
      const maxStr =
        filter.maxAmount !== undefined ? filter.maxAmount.toLocaleString() : '';
      const amountLabel =
        filter.minAmount !== undefined && filter.maxAmount !== undefined
          ? `${minStr}円 - ${maxStr}円`
          : filter.minAmount !== undefined
            ? `${minStr}円以上`
            : `${maxStr}円以下`;

      chips.push({
        label: `金額: ${amountLabel}`,
        onDelete: () => {
          const newFilter = { ...filter };
          delete newFilter.minAmount;
          delete newFilter.maxAmount;
          onFilterChange(
            Object.keys(newFilter).length > 0 ? newFilter : undefined
          );
        },
      });
    }

    if (filter.description) {
      chips.push({
        label: `説明: "${filter.description}"`,
        onDelete: () => {
          const newFilter = { ...filter };
          delete newFilter.description;
          onFilterChange(
            Object.keys(newFilter).length > 0 ? newFilter : undefined
          );
        },
      });
    }

    return chips;
  }, [filter, categories, onFilterChange]);

  return (
    <Paper sx={{ mb: 2 }}>
      {/* Filter header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          cursor: 'pointer',
        }}
        onClick={handleToggleExpanded}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon />
          <Typography variant="h6">
            フィルター
            {activeFilterCount > 0 && (
              <Chip
                label={activeFilterCount}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {activeFilterCount > 0 && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={(e) => {
                e.stopPropagation();
                handleClearFilter();
              }}
            >
              クリア
            </Button>
          )}
          <IconButton>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <Box sx={{ px: 2, pb: isExpanded ? 1 : 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {getFilterChips().map((chip, index) => (
              <Chip
                key={index}
                label={chip.label}
                onDelete={chip.onDelete}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Filter form */}
      <Collapse in={isExpanded}>
        <Box
          sx={{
            p: 2,
            pt: activeFilterCount > 0 ? 1 : 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Grid container spacing={2}>
            {/* Date range */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="開始日"
                value={localFilter.startDate || null}
                onChange={handleStartDateChange}
                maxDate={localFilter.endDate || undefined}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="終了日"
                value={localFilter.endDate || null}
                onChange={handleEndDateChange}
                minDate={localFilter.startDate || undefined}
              />
            </Grid>

            {/* Category filter */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <CategorySelector
                label="カテゴリ"
                value={localFilter.categoryId || ''}
                onChange={handleCategoryChange}
                categories={categories}
                allowEmpty
                emptyLabel="すべてのカテゴリ"
              />
            </Grid>

            {/* Transaction type */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="取引種別"
                value={localFilter.type || ''}
                onChange={(e) =>
                  handleTypeChange(e.target.value as 'income' | 'expense' | '')
                }
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">すべて</option>
                <option value="income">収入</option>
                <option value="expense">支出</option>
              </TextField>
            </Grid>

            {/* Amount range */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <AmountInput
                label="最小金額"
                value={localFilter.minAmount || null}
                onChange={handleMinAmountChange}
                allowZero
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AmountInput
                label="最大金額"
                value={localFilter.maxAmount || null}
                onChange={handleMaxAmountChange}
                allowZero
              />
            </Grid>

            {/* Description search */}
            <Grid size={12}>
              <TextField
                fullWidth
                label="説明文検索"
                value={localFilter.description || ''}
                onChange={handleDescriptionChange}
                placeholder="説明文の一部を入力"
                helperText="説明文に含まれる文字列で検索します"
              />
            </Grid>
          </Grid>

          {/* Action buttons */}
          <Box
            sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}
          >
            <Button onClick={handleReset}>リセット</Button>
            <Button
              variant="contained"
              onClick={handleApplyFilter}
              startIcon={<FilterIcon />}
            >
              フィルター適用
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default TransactionFilterComponent;
