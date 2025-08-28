import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
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
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Add,
  Assessment,
  Category,
  Receipt,
  AttachMoney,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAppSelector } from '../../store/hooks';
import { selectRecentTransactions } from '../../store/selectors/transactionSelectors';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const recentTransactions = useAppSelector(selectRecentTransactions);

  // Mock data for demonstration
  const monthlyReport = {
    totalIncome: 350000,
    totalExpense: -280000,
    balance: 70000,
    transactionCount: 45,
  };

  const overallStats = {
    balance: 1250000,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const getAmountColor = (amount: number) => {
    if (amount > 0) return 'success.main';
    if (amount < 0) return 'error.main';
    return 'text.primary';
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        ダッシュボード
      </Typography>

      {/* 主要指標カード */}
      <Box display="flex" flexWrap="wrap" gap={3} mb={4}>
        <Box flex="1 1 300px" minWidth="300px">
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
        </Box>

        <Box flex="1 1 300px" minWidth="300px">
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
                {format(currentDate, 'yyyy年MM月', { locale: ja })}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box flex="1 1 300px" minWidth="300px">
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
        </Box>
      </Box>

      {/* メインコンテンツ */}
      <Box display="flex" flexWrap="wrap" gap={3}>
        {/* クイックアクション */}
        <Box flex="1 1 400px" minWidth="400px">
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              クイックアクション
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Button
                variant="contained"
                startIcon={<Add />}
                sx={{ flex: '1 1 150px' }}
                onClick={() => navigate('/transactions/new/income')}
              >
                収入を追加
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                sx={{ flex: '1 1 150px' }}
                onClick={() => navigate('/transactions/new/expense')}
              >
                支出を追加
              </Button>
              <Button
                variant="outlined"
                startIcon={<Category />}
                sx={{ flex: '1 1 150px' }}
                onClick={() => navigate('/categories')}
              >
                カテゴリ管理
              </Button>
              <Button
                variant="outlined"
                startIcon={<Receipt />}
                sx={{ flex: '1 1 150px' }}
                onClick={() => navigate('/transactions')}
              >
                取引履歴
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Assessment />}
                sx={{ flex: '1 1 100%' }}
                onClick={() => navigate('/reports/monthly')}
              >
                レポート表示
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* 最近の取引 */}
        <Box flex="1 1 400px" minWidth="400px">
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
              <Button
                size="small"
                color="primary"
                onClick={() => navigate('/transactions')}
              >
                すべて表示
              </Button>
            </Box>
            <List>
              {recentTransactions.slice(0, 5).map((transaction, index) => (
                <React.Fragment key={transaction.id}>
                  <ListItem>
                    <ListItemIcon>
                      <AttachMoney />
                    </ListItemIcon>
                    <ListItemText
                      primary={transaction.description}
                      secondary={format(
                        new Date(transaction.date),
                        'MM/dd HH:mm',
                        { locale: ja }
                      )}
                    />
                    <Chip
                      label={formatCurrency(transaction.amount)}
                      color={transaction.amount > 0 ? 'success' : 'error'}
                      variant="outlined"
                      size="small"
                    />
                  </ListItem>
                  {index < recentTransactions.slice(0, 5).length - 1 && (
                    <Divider />
                  )}
                </React.Fragment>
              ))}
              {recentTransactions.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="取引がありません"
                    secondary="新しい取引を追加してください"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Box>
      </Box>

      {/* 概要情報 */}
      <Box mt={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            月次概要
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box flex="1 1 200px" textAlign="center">
              <Typography variant="h4" color="primary">
                {monthlyReport?.transactionCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                今月の取引数
              </Typography>
            </Box>
            <Box flex="1 1 200px" textAlign="center">
              <Typography variant="h4" color="success.main">
                {formatCurrency(monthlyReport?.totalIncome || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                今月の収入
              </Typography>
            </Box>
            <Box flex="1 1 200px" textAlign="center">
              <Typography variant="h4" color="error.main">
                {formatCurrency(Math.abs(monthlyReport?.totalExpense || 0))}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                今月の支出
              </Typography>
            </Box>
            <Box flex="1 1 200px" textAlign="center">
              <Typography
                variant="h4"
                color={getAmountColor(monthlyReport?.balance || 0)}
              >
                {formatCurrency(monthlyReport?.balance || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                今月の収支
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;