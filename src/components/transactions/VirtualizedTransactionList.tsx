import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { FixedSizeList as List } from 'react-window';
import { Transaction, Category, TransactionFilter } from '../../types';
import { useGetTransactionsQuery } from '../../store/api/transactionApi';
import { useGetCategoriesQuery } from '../../store/api/categoryApi';
import TransactionItem from './TransactionItem';
import TransactionFilterComponent from './TransactionFilter';
import TransactionEditModal from './TransactionEditModal';
import TransactionDeleteDialog from './TransactionDeleteDialog';
import { LoadingDisplay, ErrorDisplay } from '../common';

interface VirtualizedTransactionListProps {
  initialFilter?: TransactionFilter;
  height?: number;
  itemHeight?: number;
  showFilter?: boolean;
}

const VirtualizedTransactionList: React.FC<VirtualizedTransactionListProps> = React.memo(({
  initialFilter,
  height = 600,
  itemHeight = 80,
  showFilter = true,
}) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentFilter, setCurrentFilter] = useState<TransactionFilter | undefined>(initialFilter);

  // API hooks
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useGetTransactionsQuery(currentFilter);

  const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();

  // Sort transactions by date
  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    return sorted;
  }, [transactions, sortOrder]);

  // Create category lookup map
  const categoryMap = useMemo(() => {
    return categories.reduce(
      (map, category) => {
        map[category.id] = category;
        return map;
      },
      {} as Record<string, Category>
    );
  }, [categories]);

  const handleSortOrderChange = useCallback(
    (event: SelectChangeEvent<'asc' | 'desc'>) => {
      setSortOrder(event.target.value as 'asc' | 'desc');
    },
    []
  );

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  }, []);

  const handleEditModalClose = useCallback(() => {
    setEditModalOpen(false);
    setSelectedTransaction(null);
  }, []);

  const handleDeleteDialogClose = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedTransaction(null);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setEditModalOpen(false);
    setSelectedTransaction(null);
  }, []);

  const handleDeleteSuccess = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedTransaction(null);
  }, []);

  const handleFilterChange = useCallback(
    (filter: TransactionFilter | undefined) => {
      setCurrentFilter(filter);
    },
    []
  );

  // Virtualized row renderer
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const transaction = sortedTransactions[index];
      const category = categoryMap[transaction.categoryId];

      return (
        <div style={style}>
          <TransactionItem
            transaction={transaction}
            category={category}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteClick}
          />
        </div>
      );
    },
    [sortedTransactions, categoryMap, handleEditTransaction, handleDeleteClick]
  );

  // Loading state
  if (transactionsLoading || categoriesLoading) {
    return (
      <LoadingDisplay loading={true} message="取引データを読み込み中..." />
    );
  }

  // Error state
  if (transactionsError) {
    const errorState = {
      message: '取引データの読み込みに失敗しました',
      type: 'database' as const,
      retryable: true,
    };
    return (
      <ErrorDisplay
        error={errorState}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Empty state
  if (sortedTransactions.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          取引データがありません
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          新しい取引を追加してください
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Filter component */}
      {showFilter && (
        <TransactionFilterComponent
          filter={currentFilter}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Header with controls */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">
          取引一覧 ({sortedTransactions.length}件)
          {currentFilter && (
            <Typography
              variant="body2"
              color="text.secondary"
              component="span"
              sx={{ ml: 1 }}
            >
              (フィルター適用中)
            </Typography>
          )}
        </Typography>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>並び順</InputLabel>
          <Select
            value={sortOrder}
            label="並び順"
            onChange={handleSortOrderChange}
          >
            <MenuItem value="desc">新しい順</MenuItem>
            <MenuItem value="asc">古い順</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Virtualized Transaction list */}
      <Paper>
        <List
          height={height}
          itemCount={sortedTransactions.length}
          itemSize={itemHeight}
        >
          {Row}
        </List>
      </Paper>

      {/* Edit Modal */}
      <TransactionEditModal
        open={editModalOpen}
        transaction={selectedTransaction}
        onClose={handleEditModalClose}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Dialog */}
      <TransactionDeleteDialog
        open={deleteDialogOpen}
        transaction={selectedTransaction}
        category={
          selectedTransaction
            ? categoryMap[selectedTransaction.categoryId]
            : undefined
        }
        onClose={handleDeleteDialogClose}
        onSuccess={handleDeleteSuccess}
      />
    </Box>
  );
});

export default VirtualizedTransactionList;