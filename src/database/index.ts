// Database module exports
export { db, AccountingDatabase } from './schema';
export { dbConnection, DatabaseConnection, DatabaseError } from './connection';
export {
  TransactionRepository,
  transactionRepository,
  CategoryRepository,
  categoryRepository,
} from './repositories';

// Re-export types for convenience
export type { Transaction, Category } from '../types';
