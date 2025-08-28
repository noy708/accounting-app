import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Alert,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { Category } from '../../types';
import { CategoryDeleteDialog } from './CategoryDeleteDialog';

interface CategoryListProps {
  categories: Category[];
  onEditCategory: (category: Category) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onEditCategory,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    category: Category
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCategory(category);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCategory(null);
  };

  const handleEdit = () => {
    if (selectedCategory) {
      onEditCategory(selectedCategory);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  const getTypeLabel = (type: Category['type']) => {
    switch (type) {
      case 'income':
        return '収入';
      case 'expense':
        return '支出';
      case 'both':
        return '収入・支出';
      default:
        return type;
    }
  };

  const getTypeColor = (type: Category['type']) => {
    switch (type) {
      case 'income':
        return 'success';
      case 'expense':
        return 'error';
      case 'both':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Group categories by type
  const groupedCategories = categories.reduce(
    (acc, category) => {
      const type = category.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(category);
      return acc;
    },
    {} as Record<string, Category[]>
  );

  const typeOrder: Array<Category['type']> = ['income', 'expense', 'both'];

  return (
    <Box>
      {typeOrder.map((type) => {
        const categoriesOfType = groupedCategories[type];
        if (!categoriesOfType || categoriesOfType.length === 0) {
          return null;
        }

        return (
          <Box key={type} sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
              {getTypeLabel(type)}カテゴリ
            </Typography>
            <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
              {categoriesOfType.map((category, index) => (
                <React.Fragment key={category.id}>
                  <ListItem
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <CircleIcon
                        sx={{
                          color: category.color,
                          fontSize: 20,
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <span>{category.name}</span>
                          {category.isDefault && (
                            <Chip
                              label="デフォルト"
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box
                          component="span"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mt: 0.5,
                          }}
                        >
                          <Chip
                            label={getTypeLabel(category.type)}
                            size="small"
                            color={getTypeColor(category.type) as any}
                            variant="outlined"
                          />
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                          >
                            作成日:{' '}
                            {new Date(category.createdAt).toLocaleDateString(
                              'ja-JP'
                            )}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="more options"
                        onClick={(e) => handleMenuOpen(e, category)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < categoriesOfType.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        );
      })}

      {categories.length === 0 && (
        <Alert severity="info">
          カテゴリがありません。新しいカテゴリを作成してください。
        </Alert>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 150 },
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          編集
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          削除
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      {selectedCategory && (
        <CategoryDeleteDialog
          open={deleteDialogOpen}
          category={selectedCategory}
          onClose={handleDeleteDialogClose}
        />
      )}
    </Box>
  );
};
