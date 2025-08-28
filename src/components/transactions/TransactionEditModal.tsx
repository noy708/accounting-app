import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Formik, Form, FormikHelpers } from 'formik';
import * as Yup from 'yup';

import { Transaction, UpdateTransactionDto } from '../../types';
import {
  useUpdateTransactionMutation,
  useGetCategoriesByTypeQuery,
} from '../../store/api';
import AmountInput from '../common/AmountInput';
import CategorySelector from '../common/CategorySelector';
import DatePicker from '../common/DatePicker';
import { ErrorDisplay } from '../common';
import { LoadingDisplay } from '../common';

interface TransactionEditModalProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSuccess?: (transaction: Transaction) => void;
}

interface FormValues {
  type: 'income' | 'expense';
  amount: number | null;
  description: string;
  categoryId: string | null;
  date: Date | null;
}

const validationSchema = Yup.object({
  type: Yup.string()
    .oneOf(['income', 'expense'], '収入または支出を選択してください')
    .required('取引種別は必須です'),
  amount: Yup.number()
    .positive('金額は正の値で入力してください')
    .max(999999999, '金額が大きすぎます')
    .required('金額は必須です'),
  description: Yup.string()
    .trim()
    .min(1, '説明を入力してください')
    .max(200, '説明は200文字以内で入力してください')
    .required('説明は必須です'),
  categoryId: Yup.string().required('カテゴリは必須です'),
  date: Yup.date()
    .max(new Date(), '未来の日付は入力できません')
    .required('日付は必須です'),
});

const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  open,
  transaction,
  onClose,
  onSuccess,
}) => {
  const [updateTransaction, { isLoading: isUpdating, error: updateError }] =
    useUpdateTransactionMutation();

  if (!transaction) {
    return null;
  }

  const initialValues: FormValues = {
    type: transaction.type,
    amount: Math.abs(transaction.amount),
    description: transaction.description,
    categoryId: transaction.categoryId,
    date: new Date(transaction.date),
  };

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting }: FormikHelpers<FormValues>
  ) => {
    try {
      if (!values.amount || !values.categoryId || !values.date) {
        return;
      }

      const updateDto: UpdateTransactionDto = {
        type: values.type,
        amount: values.amount,
        description: values.description.trim(),
        categoryId: values.categoryId,
        date: values.date,
      };

      const result = await updateTransaction({
        id: transaction.id,
        data: updateDto,
      }).unwrap();

      onSuccess?.(result);
      onClose();
    } catch (error) {
      console.error('Failed to update transaction:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">取引を編集</Typography>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue, isSubmitting }) => (
          <Form>
            <DialogContent>
              <Box>
                <Grid container spacing={3}>
                  {/* Transaction Type Toggle */}
                  <Grid size={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      取引種別 *
                    </Typography>
                    <ToggleButtonGroup
                      value={values.type}
                      exclusive
                      onChange={(_, newType) => {
                        if (newType) {
                          setFieldValue('type', newType);
                          // Reset category when type changes
                          setFieldValue('categoryId', null);
                        }
                      }}
                      aria-label="取引種別"
                      fullWidth
                    >
                      <ToggleButton value="income" aria-label="収入">
                        収入
                      </ToggleButton>
                      <ToggleButton value="expense" aria-label="支出">
                        支出
                      </ToggleButton>
                    </ToggleButtonGroup>
                    {errors.type && touched.type && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ mt: 1, display: 'block' }}
                      >
                        {errors.type}
                      </Typography>
                    )}
                  </Grid>

                  {/* Amount Input */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <AmountInput
                      value={values.amount}
                      onChange={(amount) => setFieldValue('amount', amount)}
                      label="金額 *"
                      error={!!(errors.amount && touched.amount)}
                      helperText={
                        errors.amount && touched.amount
                          ? errors.amount
                          : undefined
                      }
                      fullWidth
                      maxAmount={999999999}
                    />
                  </Grid>

                  {/* Date Picker */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DatePicker
                      value={values.date}
                      onChange={(date) => setFieldValue('date', date)}
                      label="日付 *"
                      error={!!(errors.date && touched.date)}
                      helperText={
                        errors.date && touched.date ? errors.date : undefined
                      }
                      maxDate={new Date()}
                      fullWidth
                    />
                  </Grid>

                  {/* Category Selector */}
                  <Grid size={12}>
                    <CategorySelectorWithData
                      value={values.categoryId}
                      onChange={(categoryId) =>
                        setFieldValue('categoryId', categoryId)
                      }
                      filterByType={values.type}
                      error={!!(errors.categoryId && touched.categoryId)}
                      helperText={
                        errors.categoryId && touched.categoryId
                          ? errors.categoryId
                          : undefined
                      }
                    />
                  </Grid>

                  {/* Description */}
                  <Grid size={12}>
                    <TextField
                      value={values.description}
                      onChange={(e) =>
                        setFieldValue('description', e.target.value)
                      }
                      label="説明 *"
                      error={!!(errors.description && touched.description)}
                      helperText={
                        errors.description && touched.description
                          ? errors.description
                          : undefined
                      }
                      fullWidth
                      multiline
                      rows={2}
                      inputProps={{ maxLength: 200 }}
                    />
                  </Grid>

                  {/* Error Display */}
                  {updateError && (
                    <Grid size={12}>
                      <ErrorDisplay error={updateError} />
                    </Grid>
                  )}
                </Grid>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button
                onClick={handleClose}
                disabled={isSubmitting || isUpdating}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || isUpdating}
                startIcon={
                  isUpdating ? <CircularProgress size={20} /> : undefined
                }
              >
                {isUpdating ? '更新中...' : '更新'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

// Helper component to handle category loading
interface CategorySelectorWithDataProps {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  filterByType: 'income' | 'expense';
  error?: boolean;
  helperText?: string;
}

const CategorySelectorWithData: React.FC<CategorySelectorWithDataProps> = ({
  value,
  onChange,
  filterByType,
  error,
  helperText,
}) => {
  const {
    data: categories = [],
    isLoading,
    error: loadError,
  } = useGetCategoriesByTypeQuery(filterByType);

  if (isLoading) {
    return <LoadingDisplay loading={true} message="カテゴリを読み込み中..." />;
  }

  if (loadError) {
    return <ErrorDisplay error={loadError} />;
  }

  return (
    <CategorySelector
      value={value}
      onChange={onChange}
      categories={categories}
      filterByType={filterByType}
      label="カテゴリ *"
      error={error}
      helperText={helperText}
      fullWidth
    />
  );
};

export default TransactionEditModal;
