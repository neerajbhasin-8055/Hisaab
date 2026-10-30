export type Kind = 'in' | 'out' | 'transfer'
export type Cls = 'personal' | 'business' | 'shared'
export type Scope = 'all' | 'personal' | 'business'
export type AccountType = 'bank' | 'cash' | 'other'

export interface Tx {
  id: string
  type: Kind
  amt: number // integer paise
  cat: string
  cls: Cls
  method: string
  date: string // YYYY-MM-DD
  time?: string // HH:MM
  note: string
  accountId?: string // source account id or 'unassigned'
  toAccountId?: string // destination account id for transfers
  created?: number
  modified?: number
}

export interface Account {
  id: string
  name: string
  type: AccountType
  openingBalance: number // integer paise
  openingDate: string // YYYY-MM-DD
  isArchived?: boolean
  created?: number
  modified?: number
}

export interface Category {
  id: string
  name: string
  type: 'in' | 'out'
  icon?: string
  color?: string
  isSystem?: boolean
  created?: number
  modified?: number
}

export interface Goal {
  id: string
  name: string
  targetAmount: number // paise
  currentAmount: number // paise
  targetDate?: string // YYYY-MM-DD
  color?: string
  created?: number
  modified?: number
}

export interface CategoryBudget {
  id: string
  month: string // YYYY-MM
  categoryId: string
  amount: number // paise
}

export interface Cfg {
  targets: Record<string, number> // month YYYY-MM -> paise
  budgets: Record<string, number> // month YYYY-MM -> paise
  categoryBudgets?: Record<string, number> // `${month}:${categoryId}` -> paise
  email: string
  lastBackup: string
  defaultAccountId?: string
}

export interface HisaabBackupV1 {
  app: 'hisaab'
  version?: 1
  exported: string
  cfg?: {
    targets?: Record<string, number>
    budgets?: Record<string, number>
    email?: string
    lastBackup?: string
  }
  tx: any[]
}

export interface HisaabBackupV2 {
  app: 'hisaab'
  version: 2
  exported: string
  cfg: Cfg
  tx: Tx[]
  accounts?: Account[]
  categories?: Category[]
  goals?: Goal[]
}

export type HisaabBackup = HisaabBackupV1 | HisaabBackupV2
