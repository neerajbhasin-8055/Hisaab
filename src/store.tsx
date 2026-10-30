import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react'
import { db } from './db'
import { Account, Category, CategoryBudget, Cfg, Goal, Tx } from './types'
import { ParsedBackupResult } from './lib/backup'

const EMPTY_CFG: Cfg = {
  targets: {},
  budgets: {},
  categoryBudgets: {},
  email: '',
  lastBackup: ''
}

export interface StoreContextValue {
  ready: boolean
  error: string
  tx: Tx[]
  accounts: Account[]
  categories: Category[]
  goals: Goal[]
  categoryBudgets: CategoryBudget[]
  cfg: Cfg

  // Transactions
  saveTx: (t: Tx) => Promise<void>
  delTx: (id: string) => Promise<void>
  addMany: (t: Tx[]) => Promise<void>
  batchAssignAccount: (txIds: string[], accountId: string) => Promise<void>
  reassignCategoryInTransactions: (fromCat: string, toCat: string) => Promise<number>

  // Accounts
  saveAccount: (a: Account) => Promise<void>
  archiveAccount: (id: string, isArchived: boolean) => Promise<void>
  deleteAccount: (id: string) => Promise<{ success: boolean; message?: string }>

  // Categories
  saveCategory: (c: Category) => Promise<void>
  deleteCategory: (id: string, reassignToCat?: string) => Promise<void>

  // Goals
  saveGoal: (g: Goal) => Promise<void>
  deleteGoal: (id: string) => Promise<void>

  // Category Budgets
  saveCategoryBudget: (b: CategoryBudget) => Promise<void>
  deleteCategoryBudget: (id: string) => Promise<void>

  // Configuration
  saveCfg: (c: Cfg) => Promise<void>

  // Backup & Restore
  restoreBackupData: (data: ParsedBackupResult) => Promise<{ addedTx: number; addedAccounts: number; addedCategories: number; addedGoals: number }>
}

const Ctx = createContext<StoreContextValue>(null as unknown as StoreContextValue)

export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [tx, setTx] = useState<Tx[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([])
  const [cfg, setCfg] = useState<Cfg>(EMPTY_CFG)

  const reloadAll = useCallback(async () => {
    try {
      await db.ensureSeedData()
      const [tList, aList, cList, gList, bList, kvCfg] = await Promise.all([
        db.tx.toArray(),
        db.accounts.toArray(),
        db.categories.toArray(),
        db.goals.toArray(),
        db.budgets.toArray(),
        db.kv.get('cfg')
      ])

      setTx(tList)
      setAccounts(aList)
      setCategories(cList)
      setGoals(gList)
      setCategoryBudgets(bList)
      if (kvCfg && kvCfg.v) {
        setCfg({ ...EMPTY_CFG, ...kvCfg.v })
      }
      navigator.storage?.persist?.()
    } catch (err: any) {
      console.error('Storage initialization failed:', err)
      setError('Storage is blocked in this browser, so records cannot be saved.')
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    reloadAll()
  }, [reloadAll])

  // Save or update transaction
  const saveTx = useCallback(async (t: Tx) => {
    await db.tx.put(t)
    setTx(prev => [...prev.filter(x => x.id !== t.id), t])
  }, [])

  // Delete transaction
  const delTx = useCallback(async (id: string) => {
    await db.tx.delete(id)
    setTx(prev => prev.filter(x => x.id !== id))
  }, [])

  // Bulk add transactions (used by imports)
  const addMany = useCallback(async (tList: Tx[]) => {
    await db.tx.bulkPut(tList)
    setTx(prev => {
      const map = new Map<string, Tx>()
      prev.forEach(x => map.set(x.id, x))
      tList.forEach(x => map.set(x.id, x))
      return Array.from(map.values())
    })
  }, [])

  // Batch assign account to unassigned transactions
  const batchAssignAccount = useCallback(async (txIds: string[], accountId: string) => {
    const idSet = new Set(txIds)
    const updated: Tx[] = []
    await db.transaction('rw', db.tx, async () => {
      for (const id of txIds) {
        const item = await db.tx.get(id)
        if (item) {
          const newItem = { ...item, accountId, modified: Date.now() }
          await db.tx.put(newItem)
          updated.push(newItem)
        }
      }
    })
    setTx(prev => prev.map(x => (idSet.has(x.id) ? { ...x, accountId, modified: Date.now() } : x)))
  }, [])

  // Reassign category across transactions
  const reassignCategoryInTransactions = useCallback(async (fromCat: string, toCat: string) => {
    let count = 0
    await db.transaction('rw', db.tx, async () => {
      const matching = await db.tx.where('cat').equals(fromCat).toArray()
      count = matching.length
      for (const item of matching) {
        await db.tx.put({ ...item, cat: toCat, modified: Date.now() })
      }
    })
    setTx(prev => prev.map(x => (x.cat === fromCat ? { ...x, cat: toCat, modified: Date.now() } : x)))
    return count
  }, [])

  // Save account
  const saveAccount = useCallback(async (acc: Account) => {
    await db.accounts.put(acc)
    setAccounts(prev => [...prev.filter(a => a.id !== acc.id), acc])
  }, [])

  // Archive / unarchive account
  const archiveAccount = useCallback(async (id: string, isArchived: boolean) => {
    const acc = await db.accounts.get(id)
    if (!acc) return
    const updated = { ...acc, isArchived, modified: Date.now() }
    await db.accounts.put(updated)
    setAccounts(prev => prev.map(a => (a.id === id ? updated : a)))
  }, [])

  // Safe delete account
  const deleteAccount = useCallback(async (id: string) => {
    // Check if any transaction is tied to this account
    const hasTx = tx.some(t => t.accountId === id || t.toAccountId === id)
    if (hasTx) {
      return {
        success: false,
        message: 'This account has transactions linked to it. Archive it instead to preserve financial records.'
      }
    }
    await db.accounts.delete(id)
    setAccounts(prev => prev.filter(a => a.id !== id))
    return { success: true }
  }, [tx])

  // Save category
  const saveCategory = useCallback(async (cat: Category) => {
    await db.categories.put(cat)
    setCategories(prev => [...prev.filter(c => c.id !== cat.id), cat])
  }, [])

  // Safe delete category
  const deleteCategory = useCallback(async (id: string, reassignToCat?: string) => {
    const cat = await db.categories.get(id)
    if (!cat) return
    if (reassignToCat && reassignToCat !== cat.name) {
      await reassignCategoryInTransactions(cat.name, reassignToCat)
    }
    await db.categories.delete(id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }, [reassignCategoryInTransactions])

  // Save savings goal
  const saveGoal = useCallback(async (goal: Goal) => {
    await db.goals.put(goal)
    setGoals(prev => [...prev.filter(g => g.id !== goal.id), goal])
  }, [])

  // Delete savings goal
  const deleteGoal = useCallback(async (id: string) => {
    await db.goals.delete(id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }, [])

  // Save category budget
  const saveCategoryBudget = useCallback(async (b: CategoryBudget) => {
    await db.budgets.put(b)
    setCategoryBudgets(prev => [...prev.filter(x => x.id !== b.id), b])
  }, [])

  // Delete category budget
  const deleteCategoryBudget = useCallback(async (id: string) => {
    await db.budgets.delete(id)
    setCategoryBudgets(prev => prev.filter(x => x.id !== id))
  }, [])

  // Save Cfg
  const saveCfg = useCallback(async (newCfg: Cfg) => {
    await db.kv.put({ k: 'cfg', v: newCfg })
    setCfg(newCfg)
  }, [])

  // Restore backup safely without database corruption
  const restoreBackupData = useCallback(async (data: ParsedBackupResult) => {
    const existingTxIds = new Set(tx.map(x => x.id))
    const freshTx = data.tx.filter(x => !existingTxIds.has(x.id))

    const existingAccIds = new Set(accounts.map(x => x.id))
    const freshAccounts = data.accounts.filter(x => !existingAccIds.has(x.id))

    const existingCatNames = new Set(categories.map(x => x.name.toLowerCase()))
    const freshCategories = data.categories.filter(x => !existingCatNames.has(x.name.toLowerCase()))

    const existingGoalIds = new Set(goals.map(x => x.id))
    const freshGoals = data.goals.filter(x => !existingGoalIds.has(x.id))

    await db.transaction('rw', [db.tx, db.accounts, db.categories, db.goals, db.kv], async () => {
      if (freshTx.length > 0) await db.tx.bulkPut(freshTx)
      if (freshAccounts.length > 0) await db.accounts.bulkPut(freshAccounts)
      if (freshCategories.length > 0) await db.categories.bulkPut(freshCategories)
      if (freshGoals.length > 0) await db.goals.bulkPut(freshGoals)

      const mergedCfg: Cfg = {
        ...cfg,
        targets: { ...data.targets, ...cfg.targets },
        budgets: { ...data.budgets, ...cfg.budgets },
        email: cfg.email || data.email,
        lastBackup: new Date().toISOString()
      }
      await db.kv.put({ k: 'cfg', v: mergedCfg })
    })

    await reloadAll()

    return {
      addedTx: freshTx.length,
      addedAccounts: freshAccounts.length,
      addedCategories: freshCategories.length,
      addedGoals: freshGoals.length
    }
  }, [tx, accounts, categories, goals, cfg, reloadAll])

  return (
    <Ctx.Provider
      value={{
        ready,
        error,
        tx,
        accounts,
        categories,
        goals,
        categoryBudgets,
        cfg,
        saveTx,
        delTx,
        addMany,
        batchAssignAccount,
        reassignCategoryInTransactions,
        saveAccount,
        archiveAccount,
        deleteAccount,
        saveCategory,
        deleteCategory,
        saveGoal,
        deleteGoal,
        saveCategoryBudget,
        deleteCategoryBudget,
        saveCfg,
        restoreBackupData
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
