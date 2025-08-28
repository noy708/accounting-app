import React, { useState, useCallback } from 'react';
import {
  Box,
  List,
  Paper,
  Typography,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { Transaction, Category, TransactionFilter } from '../../types';
import { useGetTransactionsQuery } from '../../store/api/transactionApi';
import { useGetCategoriesQuery } from '../../store/api/categoryApi';
import TransactionItem from './TransactionItem';
import TransactionFilterComponent from './TransactionFilter';
import TransactionEditModal from './TransactionEditModal';
import TransactionDeleteDialog from './TransactionDeleteDialog';
import { LoadingDisplay, ErrorDisplay } from '../common';

interface TransactionListProps {
  initialFilter?: TransactionFilter;
  pageSize?: number;
  showFilter?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({
  initialFilter,
  pageSize = 10,
  showFilter = true,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [currentFilter, setCurrentFilter] = useState<
    TransactionFilter | undefined
  >(initialFilter);

  // API hooks
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useGetTransactionsQuery(currentFilter);

  const { data: categories = [], isLoading: categoriesLoading } =
    useGetCategoriesQuery();

  // Sort transactions by date
  const sortedTransactions = React.useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    return sorted;
  }, [transactions, sortOrder]);

  // Pagination logic
  const totalPages = Math.ceil(sortedTransactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTransactions = sortedTransactions.slice(
    startIndex,
    startIndex + pageSize
  );

  // Create category lookup map
  const categoryMap = React.useMemo(() => {
    return categories.reduce(
      (map, category) => {
        map[category.id] = category;
        return map;
      },
      {} as Record<string, Category>
    );
  }, [categories]);

  const handlePageChange = useCallback(
    (_: React.ChangeEvent<unknown>, page: number) => {
      setCurrentPage(page);
    },
    []
  );

  const handleSortOrderChange = useCallback(
    (event: SelectChangeEvent<'asc' | 'desc'>) => {
      setSortOrder(event.target.value as 'asc' | 'desc');
      setCurrentPage(1); // Reset to first page when sorting changes
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
    // Modal will close automatically, just reset state
    setEditModalOpen(false);
    setSelectedTransaction(null);
  }, []);

  const handleDeleteSuccess = useCallback(() => {
    // Dialog will close automatically, just reset state and adjust pagination
    setDeleteDialogOpen(false);
    setSelectedTransaction(null);

    // Adjust current page if necessary
    const newTotalPages = Math.ceil((sortedTransactions.length - 1) / pageSize);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  }, [sortedTransactions.length, pageSize, currentPage]);

  const handleFilterChange = useCallback(
    (filter: TransactionFilter | undefined) => {
      setCurrentFilter(filter);
      setCurrentPage(1); // Reset to first page when filter changes
    },
    []
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

      {/* Transaction list */}
      <Paper>
        <List disablePadding>
          {paginatedTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              category={categoryMap[transaction.categoryId]}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteClick}
            />
          ))}
        </List>
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

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
};

export default TransactionList;
