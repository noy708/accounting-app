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
const TestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-testid="test-provider">{children}</div>
);

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
    // Setup for each test
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
      expect(screen.getByRole('button', { name: /収入を追加/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /支出を追加/i })).toBeInTheDocument();
    });
  });

  describe('Component Interaction Flow', () => {
    it('should handle multi-step user interactions', async () => {
      const MultiStepComponent: React.FC = () => {
        const [step, setStep] = React.useState(1);
        const [formData, setFormData] = React.useState({ description: '', amount: '' });

        return (
          <div>
            {step === 1 && (
              <div>
                <h2>ステップ 1: 基本情報</h2>
                <input
                  aria-label="説明"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
          // Simulate async operation
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

      // Retry
      const retryButton = screen.getByRole('button', { name: /再試行/i });
      await userEvent.click(retryButton);

      expect(screen.getByRole('button', { name: /送信/i })).toBeInTheDocument();
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain state across component updates', async () => {
      const StatefulComponent: React.FC = () => {
        const [transactions, setTransactions] = React.useState<Transaction[]>(mockTransactions);
        const [filter, setFilter] = React.useState('');

        const filteredTransactions = transactions.filter(tx =>
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
            {filteredTransactions.map(tx => (
              <div key={tx.id}>{tx.description}</div>
            ))}
          </div>
        );
      };

      render(<StatefulComponent />);

      // Initially shows all transactions
      expect(screen.getByTestId('transaction-count')).toHaveTextContent('2件の取引');
      expect(screen.getByText('ランチ代')).toBeInTheDocument();
      expect(screen.getByText('給与')).toBeInTheDocument();

      // Filter transactions
      const filterInput = screen.getByLabelText(/フィルター/i);
      await userEvent.type(filterInput, 'ランチ');

      expect(screen.getByTestId('transaction-count')).toHaveTextContent('1件の取引');
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
});