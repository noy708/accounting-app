import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Typography,
  Paper,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../types';
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from '../../store/api/categoryApi';
import { ColorPicker } from './ColorPicker';

interface CategoryFormProps {
  category?: Category | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const validationSchema = Yup.object({
  name: Yup.string()
    .required('カテゴリ名は必須です')
    .min(1, 'カテゴリ名は1文字以上で入力してください')
    .max(50, 'カテゴリ名は50文字以内で入力してください'),
  type: Yup.string()
    .oneOf(['income', 'expense', 'both'], '有効なタイプを選択してください')
    .required('タイプは必須です'),
  color: Yup.string()
    .required('色は必須です')
    .matches(/^#[0-9A-F]{6}$/i, '有効な色コードを選択してください'),
});

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSuccess,
  onCancel,
}) => {
  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = Boolean(category);
  const isLoading = isCreating || isUpdating;

  const formik = useFormik({
    initialValues: {
      name: category?.name || '',
      type: category?.type || ('expense' as const),
      color: category?.color || '#1976d2',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitError(null);

        if (isEditing && category) {
          const updateData: UpdateCategoryDto = {
            name: values.name,
            type: values.type,
            color: values.color,
          };
          await updateCategory({ id: category.id, data: updateData }).unwrap();
        } else {
          const createData: CreateCategoryDto = {
            name: values.name,
            type: values.type,
            color: values.color,
          };
          await createCategory(createData).unwrap();
        }

        onSuccess();
      } catch (error: any) {
        console.error('Category form submission error:', error);
        setSubmitError(
          error?.data?.message ||
            error?.message ||
            'カテゴリの保存に失敗しました'
        );
      }
    },
  });

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      formik.setValues({
        name: category.name,
        type: category.type,
        color: category.color,
      });
    } else {
      formik.resetForm();
    }
  }, [category, formik]);

  const handleColorChange = (color: string) => {
    formik.setFieldValue('color', color);
  };

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={12}>
          <TextField
            fullWidth
            id="name"
            name="name"
            label="カテゴリ名"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            disabled={isLoading}
            placeholder="例: 食費、交通費、給与など"
          />
        </Grid>

        <Grid size={12}>
          <FormControl
            fullWidth
            error={formik.touched.type && Boolean(formik.errors.type)}
          >
            <InputLabel id="type-label">タイプ</InputLabel>
            <Select
              labelId="type-label"
              id="type"
              name="type"
              value={formik.values.type}
              label="タイプ"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isLoading}
            >
              <MenuItem value="income">収入</MenuItem>
              <MenuItem value="expense">支出</MenuItem>
              <MenuItem value="both">収入・支出</MenuItem>
            </Select>
            {formik.touched.type && formik.errors.type && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.5, ml: 1.5 }}
              >
                {formik.errors.type}
              </Typography>
            )}
          </FormControl>
        </Grid>

        <Grid size={12}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            カテゴリの色
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <ColorPicker
              value={formik.values.color}
              onChange={handleColorChange}
              disabled={isLoading}
            />
            {formik.touched.color && formik.errors.color && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 1, display: 'block' }}
              >
                {formik.errors.color}
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid size={12}>
          <Box
            sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}
          >
            <Button variant="outlined" onClick={onCancel} disabled={isLoading}>
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !formik.isValid}
            >
              {isLoading ? '保存中...' : isEditing ? '更新' : '作成'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
