import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../components/dashboard/Dashboard';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionList from '../components/transactions/TransactionList';
import CategoryManager from '../components/categories/CategoryManager';
import MonthlyReport from '../components/reports/MonthlyReport';
import CategoryReport from '../components/reports/CategoryReport';
import YearlyReport from '../components/reports/YearlyReport';
import DataExport from '../components/data/DataExport';
import DataImport from '../components/data/DataImport';
import SettingsPage from '../pages/SettingsPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ダッシュボード */}
      <Route path="/" element={<Dashboard />} />
      
      {/* 取引管理 */}
      <Route path="/transactions" element={<TransactionList />} />
      <Route path="/transactions/new" element={<TransactionForm />} />
      <Route path="/transactions/new/:type" element={<TransactionForm />} />
      
      {/* カテゴリ管理 */}
      <Route path="/categories" element={<CategoryManager />} />
      
      {/* レポート */}
      <Route path="/reports/monthly" element={<MonthlyReport />} />
      <Route path="/reports/category" element={<CategoryReport />} />
      <Route path="/reports/yearly" element={<YearlyReport />} />
      
      {/* データ管理 */}
      <Route path="/data/export" element={<DataExport />} />
      <Route path="/data/import" element={<DataImport />} />
      
      {/* 設定 */}
      <Route path="/settings" element={<SettingsPage />} />
      
      {/* 404 - 存在しないパスは / にリダイレクト */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;