import React from 'react';
import {
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
} from '@mui/icons-material';
import { Transaction, Category } from '../../types';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = React.memo(
  ({ transaction, category, onEdit, onDelete }) => {
    const theme = useTheme();

    const formatAmount = (amount: number, type: 'income' | 'expense') => {
      const absAmount = Math.abs(amount);
      const formattedAmount = new Intl.NumberFormat('ja-JP').format(absAmount);
      const prefix = type === 'income' ? '+' : '-';

      return `${prefix}¥${formattedAmount}`;
    };

    const getAmountColor = (type: 'income' | 'expense') => {
      return type === 'income'
        ? theme.palette.success.main
        : theme.palette.error.main;
    };

    const formatDate = (date: Date) => {
      const d = new Date(date);
      const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
      const weekday = weekdays[d.getDay()];
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} (${weekday})`;
    };

    const handleEdit = React.useCallback(() => {
      onEdit?.(transaction);
    }, [onEdit, transaction]);

    const handleDelete = React.useCallback(() => {
      onDelete?.(transaction);
    }, [onDelete, transaction]);

    return (
      <ListItem
        divider
        sx={{
          py: 2,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          {transaction.type === 'income' ? (
            <IncomeIcon sx={{ color: theme.palette.success.main }} />
          ) : (
            <ExpenseIcon sx={{ color: theme.palette.error.main }} />
          )}
        </Box>

        <ListItemText
          primary={transaction.description}
          secondary={`${formatDate(transaction.date)} - ${formatAmount(transaction.amount, transaction.type)}`}
        />

        {category && (
          <Chip
            label={category.name}
            size="small"
            sx={{
              backgroundColor: category.color,
              color: theme.palette.getContrastText(category.color),
              fontSize: '0.75rem',
              mr: 1,
            }}
          />
        )}

        <ListItemSecondaryAction>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onEdit && (
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={handleEdit}
                size="small"
              >
                <EditIcon />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={handleDelete}
                size="small"
                sx={{ color: theme.palette.error.main }}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </ListItemSecondaryAction>
      </ListItem>
    );
  }
);

export default TransactionItem;
