// Database schema definition using Dexie.js
import Dexie, { Table } from 'dexie';
import { Transaction, Category, TransactionHistory } from '../types';

// Database schema version 1
export class AccountingDatabase extends Dexie {
  // テーブル定義
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  transactionHistory!: Table<TransactionHistory>;

  constructor() {
    super('AccountingAppDB');

    // スキーマ定義 - バージョン1
    this.version(1).stores({
      transactions: 'id, date, amount, categoryId, type, createdAt, updatedAt',
      categories: 'id, name, color, type, isDefault, createdAt, updatedAt',
    });

    // スキーマ定義 - バージョン2 (履歴機能追加)
    this.version(2).stores({
      transactions: 'id, date, amount, categoryId, type, createdAt, updatedAt',
      categories: 'id, name, color, type, isDefault, createdAt, updatedAt',
      transactionHistory: 'id, transactionId, action, timestamp',
    });
  }
}

// データベースインスタンス
export const db = new AccountingDatabase();
