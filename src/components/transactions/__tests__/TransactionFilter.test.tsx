import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TransactionFilter from '../TransactionFilter';
import { baseApi } from '../../../store/api/baseApi';

// Mock categories data
const mockCategories = [
  {
    id: 'cat1',
    name: '食費',
    color: '#FF5722',
    type: 'expense' as const,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock store setup
const createMockStore = () => {
  return configureStore({
    reducer: {
      api: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
};

const renderWithProvider = (component: React.ReactElement) => {
  const store = createMockStore();
  // Mock the API response
  store.dispatch({
    type: 'api/executeQuery/fulfilled',
    payload: mockCategories,
    meta: {
      arg: {
        endpointName: 'getCategories',
        originalArgs: undefined,
      },
    },
  });

  return render(<Provider store={store}>{component}</Provider>);
};

describe('TransactionFilter Component', () => {
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    mockOnFilterChange.mockClear();
  });

  test('renders filter component', () => {
    renderWithProvider(
      <TransactionFilter onFilterChange={mockOnFilterChange} />
    );

    expect(screen.getByText('フィルター')).toBeInTheDocument();
  });

  test('shows filter count when filters are applied', () => {
    const filter = {
      categoryId: 'cat1',
      type: 'expense' as const,
    };

    renderWithProvider(
      <TransactionFilter filter={filter} onFilterChange={mockOnFilterChange} />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
