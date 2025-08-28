import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Fab,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useGetCategoriesQuery } from '../../store/api/categoryApi';
import { Category } from '../../types';
import { CategoryList } from './CategoryList';
import { CategoryForm } from './CategoryForm';
import { DefaultCategorySetup } from './DefaultCategorySetup';
import { LoadingDisplay } from '../common';
import { ErrorDisplay } from '../common';

export const CategoryManager: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
  } = useGetCategoriesQuery();

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    refetch();
  };

  if (isLoading) {
    return <LoadingDisplay loading={true} message="カテゴリを読み込み中..." />;
  }

  if (error) {
    const errorState = {
      message: 'カテゴリの読み込みに失敗しました',
      type: 'database' as const,
      retryable: true,
    };
    return <ErrorDisplay error={errorState} onRetry={refetch} />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Default Category Setup - shows when no categories exist */}
      <DefaultCategorySetup />

      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            カテゴリ管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateCategory}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            新しいカテゴリ
          </Button>
        </Box>

        {categories.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            カテゴリがありません。上のデフォルトカテゴリを作成するか、新しいカテゴリを手動で作成してください。
          </Alert>
        ) : (
          <CategoryList
            categories={categories}
            onEditCategory={handleEditCategory}
          />
        )}

        {/* Floating Action Button for mobile */}
        <Fab
          color="primary"
          aria-label="add category"
          onClick={handleCreateCategory}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', sm: 'none' },
          }}
        >
          <AddIcon />
        </Fab>

        {/* Category Form Dialog */}
        <Dialog
          open={isFormOpen}
          onClose={handleCloseForm}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { m: 1 },
          }}
        >
          <DialogTitle>
            {editingCategory ? 'カテゴリを編集' : '新しいカテゴリを作成'}
          </DialogTitle>
          <DialogContent>
            <CategoryForm
              category={editingCategory}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseForm}
            />
          </DialogContent>
        </Dialog>
      </Paper>
    </Box>
  );
};
