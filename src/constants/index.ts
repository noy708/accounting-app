// Application constants

export const DEFAULT_CATEGORIES = [
  // 支出カテゴリ
  { name: '食費', color: '#FF6B6B', type: 'expense' as const },
  { name: '交通費', color: '#4ECDC4', type: 'expense' as const },
  { name: '光熱費', color: '#45B7D1', type: 'expense' as const },
  { name: '住居費', color: '#96CEB4', type: 'expense' as const },
  { name: '医療費', color: '#FFEAA7', type: 'expense' as const },
  { name: '娯楽費', color: '#DDA0DD', type: 'expense' as const },
  { name: '衣服費', color: '#98D8C8', type: 'expense' as const },
  { name: 'その他支出', color: '#F7DC6F', type: 'expense' as const },

  // 収入カテゴリ
  { name: '給与', color: '#58D68D', type: 'income' as const },
  { name: '副業', color: '#85C1E9', type: 'income' as const },
  { name: '投資', color: '#F8C471', type: 'income' as const },
  { name: 'その他収入', color: '#BB8FCE', type: 'income' as const },
];

export const APP_CONFIG = {
  DATABASE_NAME: 'AccountingAppDB',
  DATABASE_VERSION: 1,
  PAGINATION_SIZE: 20,
  CHART_COLORS: [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#58D68D',
    '#85C1E9',
    '#F8C471',
    '#BB8FCE',
  ],
};

export const DATE_FORMATS = {
  DISPLAY: 'yyyy/MM/dd',
  INPUT: 'yyyy-MM-dd',
  MONTH_YEAR: 'yyyy年MM月',
  YEAR: 'yyyy年',
};

export const VALIDATION_MESSAGES = {
  REQUIRED: '必須項目です',
  INVALID_DATE: '有効な日付を入力してください',
  INVALID_AMOUNT: '有効な金額を入力してください',
  POSITIVE_AMOUNT: '金額は0より大きい値を入力してください',
  MAX_LENGTH: (max: number) => `${max}文字以内で入力してください`,
};
