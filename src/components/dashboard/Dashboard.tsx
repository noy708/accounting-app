import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Add,
  Receipt,
  Category,
  Assessment,
  ArrowForward,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useGetTransactionsQuery } from '../../store/api/transactionApi';
import { useGetMonthlyReportQuery } from '../../store/api/reportApi';
import { useGetCategoriesQuery } from '../../store/api/categoryApi';
import LoadingDisplay from '../common/LoadingDisplay';
import ErrorDisplay from '../common/ErrorDisplay';
import { Transaction } from '../../types';

const Dashboard: React.FC = React.memo(() => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Get recent transactions (last 5)
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useGetTransactionsQuery();

  // Get current month stats
  const {
    data: monthlyReport,
    isLoading: monthlyLoading,
    error: monthlyError,
  } = useGetMonthlyReportQuery({ year: currentYear, month: currentMonth });

  // Get categories for quick actions
  const { data: categories = [], isLoading: categoriesLoading } =
    useGetCategoriesQuery();

  // Calculate overall stats from transactions
  const overallStats = React.useMemo(() => {
    if (!transactions.length)
      return { count: 0, totalIncome: 0, totalExpense: 0, balance: 0 };

    const stats = transactions.reduce(
      (acc, transaction) => {
        acc.count += 1;
        if (transaction.type === 'income') {
          acc.totalIncome += Math.abs(transaction.amount);
        } else {
          acc.totalExpense += Math.abs(transaction.amount);
        }
        return acc;
      },
      { count: 0, totalIncome: 0, totalExpense: 0, balance: 0 }
    );

    stats.balance = stats.totalIncome - stats.totalExpense;
    return stats;
  }, [transactions]);

  const recentTransactions = React.useMemo(() => 
    transactions.slice(0, 5), [transactions]
  );

  const formatCurrency = React.useCallback((amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  }, []);

  const formatDate = React.useCallback((date: Date) => {
    return format(new Date(date), 'MM/dd');
  }, []);

  const getTransactionIcon = React.useCallback((type: 'income' | 'expense') => {
    return type === 'income' ? (
      <TrendingUp color="success" />
    ) : (
      <TrendingDown color="error" />
    );
  }, []);

  const getAmountColor = React.useCallback((amount: number) => {
    return amount >= 0 ? 'success.main' : 'error.main';
  }, []);

  if (transactionsLoading || monthlyLoading || categoriesLoading) {
    return (
      <LoadingDisplay loading={true} message="ダッシュボードを読み込み中..." />
    );
  }

  if (transactionsError || monthlyError) {
    const errorState = {
      message: 'ダッシュボードの読み込みに失敗しました',
      type: 'database' as const,
      retryable: true,
    };
    return <ErrorDisplay error={errorState} />;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        ダッシュボード
      </Typography>

      <Grid container spacing={3}>
        {/* 主要指標カード */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUp color="success" />
                <Typography variant="h6" component="h2" ml={1}>
                  今月の収入
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {formatCurrency(monthlyReport?.totalIncome || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {monthlyReport?.transactionCount || 0}件の取引
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingDown color="error" />
                <Typography variant="h6" component="h2" ml={1}>
                  今月の支出
                </Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                {formatCurrency(Math.abs(monthlyReport?.totalExpense || 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {format(currentDate, 'yyyy年MM月')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AccountBalance color="primary" />
                <Typography variant="h6" component="h2" ml={1}>
                  今月の収支
                </Typography>
              </Box>
              <Typography
                variant="h4"
                color={getAmountColor(monthlyReport?.balance || 0)}
              >
                {formatCurrency(monthlyReport?.balance || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                全体残高: {formatCurrency(overallStats?.balance || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* クイックアクション */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              クイックアクション
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={<Add />}
                  sx={{ mb: 1 }}
                >
                  収入を追加
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  startIcon={<Add />}
                  sx={{ mb: 1 }}
                >
                  支出を追加
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Receipt />}
                  sx={{ mb: 1 }}
                >
                  取引一覧
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Category />}
                  sx={{ mb: 1 }}
                >
                  カテゴリ管理
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" fullWidth startIcon={<Assessment />}>
                  レポート表示
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 最近の取引 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" component="h2">
                最近の取引
              </Typography>
              <IconButton size="small">
                <ArrowForward />
              </IconButton>
            </Box>
            {recentTransactions.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                py={2}
              >
                取引がありません
              </Typography>
            ) : (
              <List dense>
                {recentTransactions.map(
                  (transaction: Transaction, index: number) => {
                    const category = categories.find(
                      (c) => c.id === transaction.categoryId
                    );
                    return (
                      <React.Fragment key={transaction.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            {getTransactionIcon(transaction.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography variant="body2">
                                  {transaction.description}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color={getAmountColor(transaction.amount)}
                                  fontWeight="bold"
                                >
                                  {formatCurrency(Math.abs(transaction.amount))}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                mt={0.5}
                              >
                                <Chip
                                  label={category?.name || '未分類'}
                                  size="small"
                                  sx={{
                                    backgroundColor: category?.color || '#gray',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {formatDate(transaction.date)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < recentTransactions.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  }
                )}
              </List>
            )}
          </Paper>
        </Grid>

        {/* 概要情報 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              概要情報
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {overallStats?.count || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    総取引数
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {formatCurrency(overallStats?.totalIncome || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    総収入
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="error.main">
                    {formatCurrency(Math.abs(overallStats?.totalExpense || 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    総支出
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center">
                  <Typography
                    variant="h4"
                    color={getAmountColor(overallStats?.balance || 0)}
                  >
                    {formatCurrency(overallStats?.balance || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    純資産
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
});

export default Dashboard;
