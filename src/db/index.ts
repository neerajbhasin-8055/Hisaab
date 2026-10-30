import Dexie, { Table } from 'dexie'
import { Account, Category, CategoryBudget, Goal, Tx } from '../types'
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES
} from '../lib/constants'

export class HisaabDB extends Dexie {
  tx!: Table<Tx, string>
  kv!: Table<{ k: string; v: any }, string>
  accounts!: Table<Account, string>
  categories!: Table<Category, string>
  goals!: Table<Goal, string>
  budgets!: Table<CategoryBudget, string>

  constructor() {
    super('hisaab-app')

    // Schema Version 1 (Existing schema preservation)
    this.version(1).stores({
      tx: 'id,date',
      kv: 'k'
    })

    // Schema Version 2 (Upgraded schema with accounts, categories, goals, budgets)
    this.version(2)
      .stores({
        tx: 'id, date, type, cat, cls, accountId, toAccountId',
        kv: 'k',
        accounts: 'id, type, isArchived',
        categories: 'id, type, name',
        goals: 'id',
        budgets: 'id, month, categoryId'
      })
      .upgrade(async tx => {
        // Upgrade existing transactions safely:
        // Set accountId to 'unassigned' if missing to avoid inventing historical account associations
        await tx.table('tx').toCollection().modify((record: any) => {
          if (!record.accountId) {
            record.accountId = 'unassigned'
          }
        })
      })
  }

  /**
   * Initializes initial default seed data if database is fresh.
   */
  async ensureSeedData() {
    // Seed default accounts if none exist
    const accCount = await this.accounts.count()
    if (accCount === 0) {
      await this.accounts.bulkAdd(DEFAULT_ACCOUNTS)
    }

    // Seed missing default categories without replacing or deleting user categories.
    // This also safely adds newly introduced built-in categories to existing databases.
    const defaultCategories = [
      ...DEFAULT_EXPENSE_CATEGORIES,
      ...DEFAULT_INCOME_CATEGORIES
    ]
    const existingCategoryIds = new Set(await this.categories.toCollection().primaryKeys())
    const missingCategories = defaultCategories.filter(category => !existingCategoryIds.has(category.id))
    if (missingCategories.length > 0) {
      await this.categories.bulkAdd(missingCategories)
    }
  }
}

export const db = new HisaabDB()
