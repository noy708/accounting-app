import { v4 as uuidv4 } from 'uuid';
import { db } from '../schema';
import { Transaction, TransactionHistory } from '../../types';

export class TransactionHistoryService {
  /**
   * Record a transaction history entry
   */
  async recordHistory(
    transactionId: string,
    action: 'create' | 'update' | 'delete',
    previousData?: Partial<Transaction>,
    newData?: Partial<Transaction>
  ): Promise<TransactionHistory> {
    const changes: string[] = [];

    // Calculate changes for update actions
    if (action === 'update' && previousData && newData) {
      const fieldsToCheck: (keyof Transaction)[] = [
        'date',
        'amount',
        'description',
        'categoryId',
        'type',
      ];

      fieldsToCheck.forEach((field) => {
        if (previousData[field] !== newData[field]) {
          changes.push(field);
        }
      });
    }

    const historyEntry: TransactionHistory = {
      id: uuidv4(),
      transactionId,
      action,
      previousData,
      newData,
      timestamp: new Date(),
      changes: changes.length > 0 ? changes : undefined,
    };

    await db.transactionHistory.add(historyEntry);
    return historyEntry;
  }

  /**
   * Get history for a specific transaction
   */
  async getTransactionHistory(
    transactionId: string
  ): Promise<TransactionHistory[]> {
    return await db.transactionHistory
      .where('transactionId')
      .equals(transactionId)
      .sortBy('timestamp');
  }

  /**
   * Get all transaction history with pagination
   */
  async getAllHistory(
    limit?: number,
    offset?: number
  ): Promise<TransactionHistory[]> {
    let query = db.transactionHistory.orderBy('timestamp').reverse();

    if (offset) {
      query = query.offset(offset);
    }

    if (limit) {
      query = query.limit(limit);
    }

    return await query.toArray();
  }

  /**
   * Delete history entries for a transaction
   */
  async deleteTransactionHistory(transactionId: string): Promise<void> {
    await db.transactionHistory
      .where('transactionId')
      .equals(transactionId)
      .delete();
  }

  /**
   * Clean up old history entries (keep only last N entries per transaction)
   */
  async cleanupOldHistory(keepLastN: number = 10): Promise<void> {
    const allTransactionIds = await db.transactions
      .toCollection()
      .primaryKeys();

    for (const transactionId of allTransactionIds) {
      const history = await db.transactionHistory
        .where('transactionId')
        .equals(transactionId as string)
        .reverse()
        .sortBy('timestamp');

      if (history.length > keepLastN) {
        const entriesToDelete = history.slice(keepLastN);
        const idsToDelete = entriesToDelete.map((entry) => entry.id);
        await db.transactionHistory.bulkDelete(idsToDelete);
      }
    }
  }
}

export const transactionHistoryService = new TransactionHistoryService();
