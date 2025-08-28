import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import { Category } from '../../types';
import {
  useDeleteCategoryMutation,
  useIsCategoryInUseQuery,
  useGetCategoriesQuery,
} from '../../store/api/categoryApi';
import { useGetTransactionsQuery } from '../../store/api/transactionApi';

interface CategoryDeleteDialogProps {
  open: boolean;
  category: Category;
  onClose: () => void;
}

export const CategoryDeleteDialog: React.FC<CategoryDeleteDialogProps> = ({
  open,
  category,
  onClose,
}) => {
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteCategoryMutation();
  const [replacementCategoryId, setReplacementCategoryId] =
    useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const {
    data: isInUse,
    isLoading: isCheckingUsage,
    error: usageCheckError,
  } = useIsCategoryInUseQuery(category.id, {
    skip: !open,
  });

  const { data: allCategories = [], isLoading: isCategoriesLoading } =
    useGetCategoriesQuery(undefined, {
      skip: !open || !isInUse,
    });

  const { data: relatedTransactions = [], isLoading: isTransactionsLoading } =
    useGetTransactionsQuery(
      { categoryId: category.id },
      {
        skip: !open || !isInUse,
      }
    );

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setReplacementCategoryId('');
      setDeleteError(null);
    }
  }, [open]);

  // Get available replacement categories (same type, different from current)
  const availableReplacements = allCategories.filter(
    (cat) =>
      cat.id !== category.id &&
      (cat.type === category.type ||
        cat.type === 'both' ||
        category.type === 'both')
  );

  const handleDelete = async () => {
    try {
      setDeleteError(null);

      // If category is in use, show warning and prevent deletion
      if (isInUse) {
        setDeleteError(
          `このカテゴリは${relatedTransactions.length}件の取引で使用されているため削除できません。` +
            '先に関連する取引を削除するか、別のカテゴリに変更してください。'
        );
        return;
      }

      await deleteCategory(category.id).unwrap();
      onClose();
    } catch (error: any) {
      console.error('Category deletion error:', error);
      setDeleteError(
        error?.data?.message || error?.message || 'カテゴリの削除に失敗しました'
      );
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  if (isCheckingUsage || isCategoriesLoading) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>カテゴリの使用状況を確認中...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (usageCheckError) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>エラー</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            カテゴリの使用状況の確認に失敗しました。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>閉じる</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>カテゴリを削除</DialogTitle>
      <DialogContent>
        {deleteError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {deleteError}
          </Alert>
        )}

        <Typography variant="body1" sx={{ mb: 2 }}>
          「{category.name}」カテゴリを削除しますか？
        </Typography>

        {isInUse ? (
          <Box>
            <Alert severity="error" sx={{ mb: 2 }}>
              このカテゴリは{' '}
              <strong>
                {relatedTransactions.length}件の取引で使用されています
              </strong>
              。削除する前に、関連する取引を別のカテゴリに変更するか削除してください。
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                関連する取引の処理方法:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 取引一覧から該当する取引を個別に編集してカテゴリを変更
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • 取引一覧から該当する取引を削除
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • すべての関連取引を処理した後、再度カテゴリの削除を試行
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Button
                variant="text"
                size="small"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                sx={{ mb: 1 }}
              >
                {showAdvancedOptions ? '詳細を隠す' : '関連取引の詳細を表示'}
              </Button>

              {showAdvancedOptions && (
                <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: 'medium' }}
                  >
                    関連取引 ({relatedTransactions.length}件):
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {relatedTransactions.slice(0, 10).map((transaction) => (
                      <Box
                        key={transaction.id}
                        sx={{
                          mb: 1,
                          p: 1,
                          bgcolor: 'white',
                          borderRadius: 0.5,
                        }}
                      >
                        <Typography variant="caption" display="block">
                          {new Date(transaction.date).toLocaleDateString(
                            'ja-JP'
                          )}{' '}
                          - {transaction.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {transaction.type === 'income' ? '+' : '-'}¥
                          {Math.abs(transaction.amount).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                    {relatedTransactions.length > 10 && (
                      <Typography variant="caption" color="text.secondary">
                        ...他 {relatedTransactions.length - 10} 件
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>

            {availableReplacements.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>将来の機能:</strong>{' '}
                    一括でカテゴリを移行する機能を実装予定です。
                    現在は手動で各取引のカテゴリを変更してください。
                  </Typography>
                </Alert>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  移行先候補のカテゴリ:
                </Typography>
                <FormControl fullWidth disabled>
                  <InputLabel>代替カテゴリ（参考）</InputLabel>
                  <Select
                    value={replacementCategoryId}
                    label="代替カテゴリ（参考）"
                    onChange={(e) => setReplacementCategoryId(e.target.value)}
                  >
                    {availableReplacements.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name} (
                        {cat.type === 'income'
                          ? '収入'
                          : cat.type === 'expense'
                            ? '支出'
                            : '収入・支出'}
                        )
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            このカテゴリは取引で使用されていないため、安全に削除できます。
          </Alert>
        )}

        {category.isDefault && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            これはデフォルトカテゴリです。削除すると復元できません。
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isDeleting}>
          キャンセル
        </Button>
        <Button
          onClick={handleDelete}
          color="error"
          variant="contained"
          disabled={isDeleting || isInUse} // Disable if in use or deleting
        >
          {isDeleting ? '削除中...' : '削除'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
