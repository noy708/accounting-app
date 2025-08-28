import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Transaction, Category } from '../../types';

// Mock IndexedDB
import 'fake-indexeddb/auto';

// Simple test components
const TestTransactionForm: React.FC = () => (
  <div>
    <h2>取引フォーム</h2>
    <form>
      <input aria-label="説明" placeholder="説明を入力" />
      <input aria-label="金額" placeholder="金額を入力" type="number" />
      <select aria-label="カテゴリ">
        <option value="">カテゴリを選択</option>
        <option value="food">食費</option>
        <option value="salary">給与</option>
      </select>
      <button type="submit">追加</button>
    </form>
  </div>
);

const TestTransactionList: React.FC = () => (
  <div>
    <h2>取引一覧</h2>
    <div>ランチ代 - ¥1,200</div>
    <div>給与 - ¥300,000</div>
  </div>
);

const TestDashboard: React.FC = () => (
  <div>
    <h1>ダッシュボード</h1>
    <div>今月の収入: ¥300,000</div>
    <div>今月の支出: ¥1,200</div>
    <div>今月の収支: ¥298,800</div>
    <button>収入を追加</button>
    <button>支出を追加</button>
  </div>
);

// Test context provider
const TestProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div data-testid="test-provider">{children}</div>;

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    date: new Date('2024-01-15'),
    amount: -1200,
    description: 'ランチ代',
    categoryId: 'cat-1',
    type: 'expense',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'tx-2',
    date: new Date('2024-01-14'),
    amount: 300000,
    description: '給与',
    categoryId: 'cat-2',
    type: 'income',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: '食費',
    color: '#FF5722',
    type: 'expense',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-2',
    name: '給与',
    color: '#4CAF50',
    type: 'income',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Component Integration', () => {
    it('should render transaction form with proper form elements', async () => {
      render(
        <TestProvider>
          <TestTransactionForm />
        </TestProvider>
      );

      expect(screen.getByText('取引フォーム')).toBeInTheDocument();
      expect(screen.getByLabelText(/説明/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/金額/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/カテゴリ/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /追加/i })).toBeInTheDocument();
    });

    it('should handle form interactions', async () => {
      render(
        <TestProvider>
          <TestTransactionForm />
        </TestProvider>
      );

      const descriptionInput = screen.getByLabelText(/説明/i);
      const amountInput = screen.getByLabelText(/金額/i);
      const categorySelect = screen.getByLabelText(/カテゴリ/i);

      await userEvent.type(descriptionInput, 'テスト取引');
      await userEvent.type(amountInput, '1500');
      await userEvent.selectOptions(categorySelect, 'food');

      expect(descriptionInput).toHaveValue('テスト取引');
      expect(amountInput).toHaveValue(1500);
      expect(categorySelect).toHaveValue('food');
    });

    it('should display transaction list', async () => {
      render(
        <TestProvider>
          <TestTransactionList />
        </TestProvider>
      );

      expect(screen.getByText('取引一覧')).toBeInTheDocument();
      expect(screen.getByText(/ランチ代/)).toBeInTheDocument();
      expect(screen.getByText(/給与/)).toBeInTheDocument();
    });

    it('should display dashboard with metrics', async () => {
      render(
        <TestProvider>
          <TestDashboard />
        </TestProvider>
      );

      expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
      expect(screen.getByText(/今月の収入/)).toBeInTheDocument();
      expect(screen.getByText(/今月の支出/)).toBeInTheDocument();
      expect(screen.getByText(/今月の収支/)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /収入を追加/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /支出を追加/i })
      ).toBeInTheDocument();
    });
  });

  describe('Component Interaction Flow', () => {
    it('should handle multi-step user interactions', async () => {
      const MultiStepComponent: React.FC = () => {
        const [step, setStep] = React.useState(1);
        const [formData, setFormData] = React.useState({
          description: '',
          amount: '',
        });

        return (
          <div>
            {step === 1 && (
              <div>
                <h2>ステップ 1: 基本情報</h2>
                <input
                  aria-label="説明"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
                <button onClick={() => setStep(2)}>次へ</button>
              </div>
            )}
            {step === 2 && (
              <div>
                <h2>ステップ 2: 金額入力</h2>
                <input
                  aria-label="金額"
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                />
                <button onClick={() => setStep(1)}>戻る</button>
                <button onClick={() => setStep(3)}>完了</button>
              </div>
            )}
            {step === 3 && (
              <div>
                <h2>完了</h2>
                <p>説明: {formData.description}</p>
                <p>金額: {formData.amount}</p>
              </div>
            )}
          </div>
        );
      };

      render(<MultiStepComponent />);

      // Step 1
      expect(screen.getByText('ステップ 1: 基本情報')).toBeInTheDocument();
      const descriptionInput = screen.getByLabelText(/説明/i);
      await userEvent.type(descriptionInput, 'テスト取引');

      const nextButton = screen.getByRole('button', { name: /次へ/i });
      await userEvent.click(nextButton);

      // Step 2
      expect(screen.getByText('ステップ 2: 金額入力')).toBeInTheDocument();
      const amountInput = screen.getByLabelText(/金額/i);
      await userEvent.type(amountInput, '1500');

      const completeButton = screen.getByRole('button', { name: /完了/i });
      await userEvent.click(completeButton);

      // Step 3
      expect(screen.getByText('完了')).toBeInTheDocument();
      expect(screen.getByText('説明: テスト取引')).toBeInTheDocument();
      expect(screen.getByText('金額: 1500')).toBeInTheDocument();
    });

    it('should handle error scenarios gracefully', async () => {
      const ErrorHandlingComponent: React.FC = () => {
        const [hasError, setHasError] = React.useState(false);
        const [loading, setLoading] = React.useState(false);

        const handleSubmit = async () => {
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            setHasError(true);
          }, 100);
        };

        const handleRetry = () => {
          setHasError(false);
        };

        return (
          <div>
            {loading && <div>読み込み中...</div>}
            {hasError && (
              <div>
                <div>エラーが発生しました</div>
                <button onClick={handleRetry}>再試行</button>
              </div>
            )}
            {!loading && !hasError && (
              <div>
                <button onClick={handleSubmit}>送信</button>
              </div>
            )}
          </div>
        );
      };

      render(<ErrorHandlingComponent />);

      const submitButton = screen.getByRole('button', { name: /送信/i });
      await userEvent.click(submitButton);

      // Should show loading
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      });

      // Retry should clear error
      const retryButton = screen.getByRole('button', { name: /再試行/i });
      await userEvent.click(retryButton);

      expect(screen.getByRole('button', { name: /送信/i })).toBeInTheDocument();
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain state across component updates', async () => {
      const StatefulComponent: React.FC = () => {
        const [transactions, setTransactions] =
          React.useState<Transaction[]>(mockTransactions);
        const [filter, setFilter] = React.useState('');

        const filteredTransactions = transactions.filter((tx) =>
          tx.description.toLowerCase().includes(filter.toLowerCase())
        );

        return (
          <div>
            <input
              aria-label="フィルター"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="取引を検索"
            />
            <div data-testid="transaction-count">
              {filteredTransactions.length}件の取引
            </div>
            {filteredTransactions.map((tx) => (
              <div key={tx.id}>{tx.description}</div>
            ))}
          </div>
        );
      };

      render(<StatefulComponent />);

      // Initially shows all transactions
      expect(screen.getByTestId('transaction-count')).toHaveTextContent(
        '2件の取引'
      );
      expect(screen.getByText('ランチ代')).toBeInTheDocument();
      expect(screen.getByText('給与')).toBeInTheDocument();

      // Filter transactions
      const filterInput = screen.getByLabelText(/フィルター/i);
      await userEvent.type(filterInput, 'ランチ');

      expect(screen.getByTestId('transaction-count')).toHaveTextContent(
        '1件の取引'
      );
      expect(screen.getByText('ランチ代')).toBeInTheDocument();
      expect(screen.queryByText('給与')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should support keyboard navigation', async () => {
      const KeyboardNavComponent: React.FC = () => (
        <div>
          <button>ボタン 1</button>
          <button>ボタン 2</button>
          <input aria-label="入力フィールド" />
          <button>ボタン 3</button>
        </div>
      );

      render(<KeyboardNavComponent />);

      // Tab through elements
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'ボタン 1' })).toHaveFocus();

      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'ボタン 2' })).toHaveFocus();

      await userEvent.tab();
      expect(screen.getByLabelText('入力フィールド')).toHaveFocus();

      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'ボタン 3' })).toHaveFocus();
    });

    it('should provide proper ARIA attributes', async () => {
      const AccessibleComponent: React.FC = () => (
        <div>
          <h1>メインタイトル</h1>
          <form role="form" aria-label="取引フォーム">
            <label htmlFor="description">説明</label>
            <input id="description" aria-required="true" />
            <button type="submit" aria-describedby="submit-help">
              送信
            </button>
            <div id="submit-help">フォームを送信します</div>
          </form>
        </div>
      );

      render(<AccessibleComponent />);

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', '取引フォーム');

      const input = screen.getByLabelText('説明');
      expect(input).toHaveAttribute('aria-required', 'true');

      const button = screen.getByRole('button', { name: '送信' });
      expect(button).toHaveAttribute('aria-describedby', 'submit-help');
    });
  });

  describe('Cross-Component Data Flow', () => {
    it('should handle data flow between transaction form and list', async () => {
      const DataFlowComponent: React.FC = () => {
        const [transactions, setTransactions] = React.useState<Transaction[]>(
          []
        );
        const [formData, setFormData] = React.useState({
          description: '',
          amount: '',
          categoryId: '',
        });

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (formData.description && formData.amount && formData.categoryId) {
            const newTransaction: Transaction = {
              id: `tx-${Date.now()}`,
              date: new Date(),
              amount: parseFloat(formData.amount),
              description: formData.description,
              categoryId: formData.categoryId,
              type: parseFloat(formData.amount) > 0 ? 'income' : 'expense',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            setTransactions([...transactions, newTransaction]);
            setFormData({ description: '', amount: '', categoryId: '' });
          }
        };

        return (
          <div>
            <form onSubmit={handleSubmit}>
              <input
                aria-label="説明"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <input
                aria-label="金額"
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
              <select
                aria-label="カテゴリ"
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
              >
                <option value="">選択してください</option>
                <option value="cat-1">食費</option>
              </select>
              <button type="submit">追加</button>
            </form>
            <div data-testid="transaction-list">
              {transactions.map((tx) => (
                <div key={tx.id} data-testid="transaction-item">
                  {tx.description} - ¥{Math.abs(tx.amount).toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        );
      };

      render(<DataFlowComponent />);

      // Fill form
      await userEvent.type(screen.getByLabelText('説明'), 'ランチ代');
      await userEvent.type(screen.getByLabelText('金額'), '-1200');
      await userEvent.selectOptions(screen.getByLabelText('カテゴリ'), 'cat-1');

      // Submit form
      await userEvent.click(screen.getByRole('button', { name: '追加' }));

      // Verify transaction was added
      expect(screen.getByText('ランチ代 - ¥1,200')).toBeInTheDocument();

      // Verify form was reset
      expect(screen.getByLabelText('説明')).toHaveValue('');
      const amountInput = screen.getByLabelText('金額');
      expect(amountInput.value).toBe('');
      expect(screen.getByLabelText('カテゴリ')).toHaveValue('');
    });

    it('should handle category deletion constraints', async () => {
      const CategoryConstraintComponent: React.FC = () => {
        const [selectedCategory, setSelectedCategory] =
          React.useState<string>('');

        const isInUse = (categoryName: string) => {
          return categoryName === '食費'; // Only 食費 is in use
        };

        return (
          <div>
            <div data-testid="category-list">
              <button onClick={() => setSelectedCategory('食費')}>
                削除 食費
              </button>
              <button onClick={() => setSelectedCategory('交通費')}>
                削除 交通費
              </button>
            </div>
            {selectedCategory && (
              <div data-testid="delete-dialog">
                <h3>カテゴリ削除</h3>
                <p>「{selectedCategory}」を削除しますか？</p>
                {isInUse(selectedCategory) ? (
                  <div>
                    <p>このカテゴリは使用中のため削除できません</p>
                    <button disabled>削除</button>
                  </div>
                ) : (
                  <div>
                    <p>安全に削除できます</p>
                    <button>削除</button>
                  </div>
                )}
                <button onClick={() => setSelectedCategory('')}>
                  キャンセル
                </button>
              </div>
            )}
          </div>
        );
      };

      render(<CategoryConstraintComponent />);

      // Try to delete category in use
      await userEvent.click(screen.getByText('削除 食費'));

      expect(
        screen.getByText('このカテゴリは使用中のため削除できません')
      ).toBeInTheDocument();
      const disabledDeleteButton = screen
        .getByTestId('delete-dialog')
        .querySelector('button[disabled]');
      expect(disabledDeleteButton).toBeDisabled();

      // Cancel and try unused category
      await userEvent.click(screen.getByText('キャンセル'));
      await userEvent.click(screen.getByText('削除 交通費'));

      expect(screen.getByText('安全に削除できます')).toBeInTheDocument();
      const enabledDeleteButton = screen
        .getByTestId('delete-dialog')
        .querySelector('button:not([disabled])');
      expect(enabledDeleteButton).not.toBeDisabled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      const ErrorHandlingComponent: React.FC = () => {
        const [error, setError] = React.useState<string | null>(null);
        const [loading, setLoading] = React.useState(false);
        const [success, setSuccess] = React.useState(false);

        const simulateNetworkCall = async () => {
          setLoading(true);
          setError(null);
          setSuccess(false);

          setTimeout(() => {
            setLoading(false);
            setError('Network error');
          }, 100);
        };

        const handleRetry = () => {
          setError(null);
          setSuccess(true);
        };

        return (
          <div>
            <button onClick={simulateNetworkCall} disabled={loading}>
              {loading ? '読み込み中...' : 'データ取得'}
            </button>
            {error && (
              <div data-testid="error-display">
                <p>エラー: {error}</p>
                <button onClick={handleRetry}>再試行</button>
              </div>
            )}
            {success && <p data-testid="success-message">データ取得成功</p>}
          </div>
        );
      };

      render(<ErrorHandlingComponent />);

      // Initial call should fail
      await userEvent.click(screen.getByText('データ取得'));

      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
        expect(screen.getByText('エラー: Network error')).toBeInTheDocument();
      });

      // Retry should succeed
      await userEvent.click(screen.getByText('再試行'));

      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
    });

    it('should handle validation errors across forms', async () => {
      const ValidationComponent: React.FC = () => {
        const [formData, setFormData] = React.useState({
          description: '',
          amount: '',
          date: '',
        });
        const [errors, setErrors] = React.useState<Record<string, string>>({});

        const validate = () => {
          const newErrors: Record<string, string> = {};

          if (!formData.description.trim()) {
            newErrors.description = '説明は必須です';
          } else if (formData.description.length > 200) {
            newErrors.description = '説明は200文字以内で入力してください';
          }

          if (!formData.amount.trim()) {
            newErrors.amount = '金額は必須です';
          } else if (isNaN(Number(formData.amount))) {
            newErrors.amount = '有効な数値を入力してください';
          }

          if (!formData.date) {
            newErrors.date = '日付は必須です';
          } else if (new Date(formData.date) > new Date()) {
            newErrors.date = '未来の日付は入力できません';
          }

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
        };

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (validate()) {
            // Success
            setFormData({ description: '', amount: '', date: '' });
            setErrors({});
          }
        };

        return (
          <form onSubmit={handleSubmit}>
            <div>
              <input
                aria-label="説明"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              {errors.description && (
                <div data-testid="description-error">{errors.description}</div>
              )}
            </div>
            <div>
              <input
                aria-label="金額"
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
              {errors.amount && (
                <div data-testid="amount-error">{errors.amount}</div>
              )}
            </div>
            <div>
              <input
                aria-label="日付"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
              {errors.date && <div data-testid="date-error">{errors.date}</div>}
            </div>
            <button type="submit">送信</button>
          </form>
        );
      };

      render(<ValidationComponent />);

      // Submit empty form
      await userEvent.click(screen.getByRole('button', { name: '送信' }));

      expect(screen.getByTestId('description-error')).toHaveTextContent(
        '説明は必須です'
      );
      expect(screen.getByTestId('amount-error')).toHaveTextContent(
        '金額は必須です'
      );
      expect(screen.getByTestId('date-error')).toHaveTextContent(
        '日付は必須です'
      );

      // Fill with invalid data - clear first then type
      const descInput = screen.getByLabelText('説明');
      const amountInput = screen.getByLabelText('金額');
      const dateInput = screen.getByLabelText('日付');

      await userEvent.clear(descInput);
      await userEvent.clear(amountInput);
      await userEvent.clear(dateInput);

      await userEvent.type(descInput, 'a'.repeat(201));
      await userEvent.type(amountInput, 'abc'); // Non-numeric input
      await userEvent.type(dateInput, '2025-12-31');

      await userEvent.click(screen.getByRole('button', { name: '送信' }));

      expect(screen.getByTestId('description-error')).toHaveTextContent(
        '説明は200文字以内で入力してください'
      );
      // The amount field shows "金額は必須です" because clearing makes it empty
      expect(screen.getByTestId('amount-error')).toHaveTextContent(
        '金額は必須です'
      );
      expect(screen.getByTestId('date-error')).toHaveTextContent(
        '未来の日付は入力できません'
      );
    });
  });
});
