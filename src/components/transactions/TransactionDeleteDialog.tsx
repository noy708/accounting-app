import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Warning as WarningIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
} from '@mui/icons-material';

import { Transaction, Category } from '../../types';
import { useDeleteTransactionMutation } from '../../store/api';
import { ErrorDisplay } from '../common';

interface TransactionDeleteDialogProps {
  open: boolean;
  transaction: Transaction | null;
  category?: Category;
  onClose: () => void;
  onSuccess?: () => void;
}

const TransactionDeleteDialog: React.FC<TransactionDeleteDialogProps> = ({
  open,
  transaction,
  category,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const [deleteTransaction, { isLoading: isDeleting, error: deleteError }] =
    useDeleteTransactionMutation();

  if (!transaction) {
    return null;
  }

  const formatAmount = (amount: number, type: 'income' | 'expense') => {
    const absAmount = Math.abs(amount);
    const formattedAmount = new Intl.NumberFormat('ja-JP').format(absAmount);
    const prefix = type === 'income' ? '+' : '-';
    return `${prefix}¥${formattedAmount}`;
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[d.getDay()];
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} (${weekday})`;
  };

  const handleDelete = async () => {
    try {
      await deleteTransaction(transaction.id).unwrap();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon sx={{ color: theme.palette.warning.main }} />
          <Typography variant="h6">取引を削除</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <>
          <Typography variant="body1" gutterBottom>
            以下の取引を削除してもよろしいですか？この操作は取り消すことができません。
          </Typography>

          {/* Transaction Details */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: theme.palette.grey[50],
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {transaction.type === 'income' ? (
                <IncomeIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
              ) : (
                <ExpenseIcon sx={{ color: theme.palette.error.main, mr: 1 }} />
              )}
              <Typography variant="h6" component="span">
                {transaction.description}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  日付:
                </Typography>
                <Typography variant="body2">
                  {formatDate(transaction.date)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  金額:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color:
                      transaction.type === 'income'
                        ? theme.palette.success.main
                        : theme.palette.error.main,
                    fontWeight: 'bold',
                  }}
                >
                  {formatAmount(transaction.amount, transaction.type)}
                </Typography>
              </Box>

              {category && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    カテゴリ:
                  </Typography>
                  <Chip
                    label={category.name}
                    size="small"
                    sx={{
                      backgroundColor: category.color,
                      color: theme.palette.getContrastText(category.color),
                      fontSize: '0.75rem',
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>

          {/* Error Display */}
          {deleteError && (
            <Box sx={{ mt: 2 }}>
              <ErrorDisplay
                error={{
                  message: '取引の削除に失敗しました',
                  type: 'database' as const,
                  retryable: true,
                }}
              />
            </Box>
          )}
        </>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleCancel} disabled={isDeleting}>
          キャンセル
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={20} /> : undefined}
        >
          {isDeleting ? '削除中...' : '削除'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionDeleteDialog;
