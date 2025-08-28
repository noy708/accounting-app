import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import { Formik, Form, FormikHelpers } from 'formik';
import * as Yup from 'yup';

import { CreateTransactionDto } from '../../types';
import {
  useCreateTransactionMutation,
  useGetCategoriesByTypeQuery,
} from '../../store/api';
import AmountInput from '../common/AmountInput';
import CategorySelector from '../common/CategorySelector';
import DatePicker from '../common/DatePicker';
import { LoadingDisplay } from '../common';

interface TransactionFormProps {
  onSuccess?: (transaction: any) => void;
  onCancel?: () => void;
  initialValues?: Partial<CreateTransactionDto>;
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

const TransactionForm: React.FC<TransactionFormProps> = ({
  onSuccess,
  onCancel,
  initialValues = {},
}) => {
  const { type: urlType } = useParams<{ type?: 'income' | 'expense' }>();
  const [createTransaction, { isLoading: isCreating }] =
    useCreateTransactionMutation();

  const defaultValues: FormValues = {
    type: urlType || 'expense',
    amount: null,
    description: '',
    categoryId: null,
    date: new Date(),
    ...initialValues,
  };

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm }: FormikHelpers<FormValues>
  ) => {
    try {
      if (!values.amount || !values.categoryId || !values.date) {
        return;
      }

      const transactionDto: CreateTransactionDto = {
        type: values.type,
        amount: values.amount,
        description: values.description.trim(),
        categoryId: values.categoryId,
        date: values.date,
      };

      const result = await createTransaction(transactionDto).unwrap();

      resetForm();
      onSuccess?.(result);
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        取引を追加
      </Typography>

      <Formik
        initialValues={defaultValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue, isSubmitting }) => (
          <Form>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  取引種別 *
                </Typography>
                <ToggleButtonGroup
                  value={values.type}
                  exclusive
                  onChange={(_, newType) => {
                    if (newType) {
                      setFieldValue('type', newType);
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
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 300px', minWidth: 200 }}>
                  <AmountInput
                    value={values.amount}
                    onChange={(amount) => setFieldValue('amount', amount)}
                    label="金額 *"
                    error={!!(errors.amount && touched.amount)}
                    helperText={
                      errors.amount && touched.amount ? errors.amount : undefined
                    }
                    fullWidth
                    maxAmount={999999999}
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: 200 }}>
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
                </Box>
              </Box>
              
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
              
              <TextField
                value={values.description}
                onChange={(e) => setFieldValue('description', e.target.value)}
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
                slotProps={{ htmlInput: { maxLength: 200 } }}
              />
              
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {onCancel && (
                  <Button
                    variant="outlined"
                    onClick={onCancel}
                    disabled={isSubmitting || isCreating}
                  >
                    キャンセル
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || isCreating}
                  startIcon={
                    isCreating ? <CircularProgress size={20} /> : undefined
                  }
                >
                  {isCreating ? '保存中...' : '保存'}
                </Button>
              </Box>
            </Box>
          </Form>
        )}
      </Formik>
    </Paper>
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
    return (
      <Alert severity="error">
        カテゴリの読み込みに失敗しました。
      </Alert>
    );
  }

  if (categories.length === 0) {
    return (
      <Alert severity="warning">
        {filterByType === 'income' ? '収入' : '支出'}カテゴリが見つかりません。
        先にカテゴリを作成してください。
      </Alert>
    );
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

export default TransactionForm;