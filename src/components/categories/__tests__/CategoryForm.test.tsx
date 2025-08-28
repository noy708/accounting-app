import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryForm } from '../CategoryForm';
import { Category } from '../../../types';

// Mock the API hooks
const mockCreateCategory = jest.fn();
const mockUpdateCategory = jest.fn();

jest.mock('../../../store/api/categoryApi', () => ({
  useCreateCategoryMutation: () => [mockCreateCategory, { isLoading: false }],
  useUpdateCategoryMutation: () => [mockUpdateCategory, { isLoading: false }],
}));

// Mock the ColorPicker component
jest.mock('../ColorPicker', () => ({
  ColorPicker: ({ value, onChange, disabled }: any) => (
    <div data-testid="color-picker">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        data-testid="color-input"
      />
    </div>
  ),
}));

const mockCategory: Category = {
  id: '1',
  name: '食費',
  color: '#ff5722',
  type: 'expense',
  isDefault: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('CategoryForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateCategory.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
    mockUpdateCategory.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
  });

  it('renders create form when no category is provided', () => {
    render(<CategoryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText('カテゴリ名')).toBeInTheDocument();
    expect(screen.getByLabelText('タイプ')).toBeInTheDocument();
    expect(screen.getByTestId('color-picker')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '作成' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'キャンセル' })
    ).toBeInTheDocument();
  });

  it('renders edit form when category is provided', () => {
    render(
      <CategoryForm
        category={mockCategory}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('食費')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', { name: '作成' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('カテゴリ名は必須です')).toBeInTheDocument();
    });
  });

  it('validates category name length', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText('カテゴリ名');

    // Test minimum length
    await user.clear(nameInput);
    await user.type(nameInput, '');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText('カテゴリ名は必須です')).toBeInTheDocument();
    });

    // Test maximum length
    const longName = 'a'.repeat(51);
    await user.clear(nameInput);
    await user.type(nameInput, longName);
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText('カテゴリ名は50文字以内で入力してください')
      ).toBeInTheDocument();
    });
  });

  it('submits create form with valid data', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill form
    await user.type(screen.getByLabelText('カテゴリ名'), '新しいカテゴリ');
    await user.click(screen.getByLabelText('タイプ'));
    await user.click(screen.getByText('収入'));

    // Change color
    const colorInput = screen.getByTestId('color-input');
    fireEvent.change(colorInput, { target: { value: '#4caf50' } });

    // Submit form
    await user.click(screen.getByRole('button', { name: '作成' }));

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: '新しいカテゴリ',
        type: 'income',
        color: '#4caf50',
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('submits update form with valid data', async () => {
    const user = userEvent.setup();

    render(
      <CategoryForm
        category={mockCategory}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Update name
    const nameInput = screen.getByDisplayValue('食費');
    await user.clear(nameInput);
    await user.type(nameInput, '更新された食費');

    // Submit form
    await user.click(screen.getByRole('button', { name: '更新' }));

    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalledWith({
        id: '1',
        data: {
          name: '更新された食費',
          type: 'expense',
          color: '#ff5722',
        },
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('handles API errors', async () => {
    const user = userEvent.setup();
    const errorMessage = 'カテゴリの作成に失敗しました';

    mockCreateCategory.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error(errorMessage)),
    });

    render(<CategoryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill and submit form
    await user.type(screen.getByLabelText('カテゴリ名'), '新しいカテゴリ');
    await user.click(screen.getByRole('button', { name: '作成' }));

    await waitFor(() => {
      expect(
        screen.getByText('カテゴリの保存に失敗しました')
      ).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('disables form when loading', () => {
    // Mock loading state
    jest.doMock('../../../store/api/categoryApi', () => ({
      useCreateCategoryMutation: () => [
        mockCreateCategory,
        { isLoading: true },
      ],
      useUpdateCategoryMutation: () => [
        mockUpdateCategory,
        { isLoading: false },
      ],
    }));

    render(<CategoryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText('カテゴリ名')).toBeDisabled();
    expect(screen.getByRole('button', { name: '保存中...' })).toBeDisabled();
  });

  it('updates form values when category prop changes', () => {
    const { rerender } = render(
      <CategoryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Initially empty
    expect(screen.getByLabelText('カテゴリ名')).toHaveValue('');

    // Update with category
    rerender(
      <CategoryForm
        category={mockCategory}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('食費')).toBeInTheDocument();
  });

  it('validates color format', async () => {
    const user = userEvent.setup();

    render(<CategoryForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Set invalid color
    const colorInput = screen.getByTestId('color-input');
    fireEvent.change(colorInput, { target: { value: 'invalid-color' } });

    await user.type(screen.getByLabelText('カテゴリ名'), 'テストカテゴリ');
    await user.click(screen.getByRole('button', { name: '作成' }));

    // Form should not submit with invalid color
    expect(mockCreateCategory).not.toHaveBeenCalled();
  });
});
