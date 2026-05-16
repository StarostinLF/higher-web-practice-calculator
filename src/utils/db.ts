import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import type { Budget, Transaction } from '../models/schemas';

interface BudgetDB extends DBSchema {
	budget: {
		key: string;
		value: Budget;
	};
	transactions: {
		key: string;
		value: Transaction;
		indexes: { 'by-date': string };
	};
}

const DB_NAME = 'budget-calculator-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<BudgetDB> | null = null;

async function getDB(): Promise<IDBPDatabase<BudgetDB>> {
	if (dbInstance) {
		return dbInstance;
	}
	dbInstance = await openDB<BudgetDB>(DB_NAME, DB_VERSION, {
		upgrade(db) {
			if (!db.objectStoreNames.contains('budget')) {
				db.createObjectStore('budget', { keyPath: 'id' });
			}
			if (!db.objectStoreNames.contains('transactions')) {
				const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
				txStore.createIndex('by-date', 'date');
			}
		},
	});
	return dbInstance;
}

export async function getBudget(): Promise<Budget | undefined> {
	const db = await getDB();
	return db.get('budget', 'current');
}

export async function saveBudget(budget: Budget): Promise<void> {
	const db = await getDB();
	await db.put('budget', budget);
}

export async function clearBudget(): Promise<void> {
	const db = await getDB();
	await db.delete('budget', 'current');
}

export async function getAllTransactions(): Promise<Transaction[]> {
	const db = await getDB();
	const all = await db.getAllFromIndex('transactions', 'by-date');
	return all.sort((a, b) => b.date.localeCompare(a.date));
}

export async function addTransaction(tx: Transaction): Promise<void> {
	const db = await getDB();
	await db.put('transactions', tx);
}

export async function deleteTransaction(id: string): Promise<void> {
	const db = await getDB();
	await db.delete('transactions', id);
}

export async function clearAllTransactions(): Promise<void> {
	const db = await getDB();
	await db.clear('transactions');
}
