import { Account, Scope, Tx } from '../types'

export interface PeriodSummary {
  income: number // in paise
  expenses: number // in paise
  netSavings: number // in paise (income - expenses)
  savingsRate: number // percentage (0 - 100 or negative if deficit)
  transfersTotal: number // strictly internal, not income or expense
  txCount: number
}

export interface CategoryBreakdown {
  category: string
  amount: number // in paise
  percentage: number // 0 - 100
  txCount: number
}

export interface FilterOptions {
  query?: string
  type?: string // 'in' | 'out' | 'transfer' | ''
  accountId?: string
  categoryId?: string
  method?: string
  scope?: Scope
  from?: string // YYYY-MM-DD
  to?: string // YYYY-MM-DD
}

// Rule 1, 2, 3, 4: Account Balance Calculation
export const calculateAccountBalance = (account: Account, transactions: Tx[]): number => {
  let balance = account.openingBalance || 0

  for (const tx of transactions) {
    if (tx.type === 'in' && tx.accountId === account.id) {
      // Inflow to this account
      balance += tx.amt
    } else if (tx.type === 'out' && tx.accountId === account.id) {
      // Outflow from this account
      balance -= tx.amt
    } else if (tx.type === 'transfer') {
      // Internal transfer
      if (tx.accountId === account.id) {
        // Outflow from source account
        balance -= tx.amt
      }
      if (tx.toAccountId === account.id) {
        // Inflow to destination account
        balance += tx.amt
      }
    }
  }

  return balance
}

// Calculate balances for an array of accounts
export const calculateAllAccountBalances = (
  accounts: Account[],
  transactions: Tx[]
): Record<string, number> => {
  const balances: Record<string, number> = {}
  for (const acc of accounts) {
    balances[acc.id] = calculateAccountBalance(acc, transactions)
  }
  return balances
}

// Rule 5: Combined Total Balance across active accounts
export const calculateTotalBalance = (
  accounts: Account[],
  transactions: Tx[],
  includeArchived = false
): number => {
  const active = accounts.filter(a => includeArchived || !a.isArchived)
  let total = 0
  for (const acc of active) {
    total += calculateAccountBalance(acc, transactions)
  }
  return total
}

// Rule 6: Combined Bank Balance across active bank accounts
export const calculateBankBalance = (
  accounts: Account[],
  transactions: Tx[]
): number => {
  const banks = accounts.filter(a => !a.isArchived && a.type === 'bank')
  let total = 0
  for (const acc of banks) {
    total += calculateAccountBalance(acc, transactions)
  }
  return total
}

// Rule 7: Combined Cash Balance across active cash accounts
export const calculateCashBalance = (
  accounts: Account[],
  transactions: Tx[]
): number => {
  const cashes = accounts.filter(a => !a.isArchived && a.type === 'cash')
  let total = 0
  for (const acc of cashes) {
    total += calculateAccountBalance(acc, transactions)
  }
  return total
}

// Rule 8, 9, 10: Period Summary (Income, Expenses, Net Savings, Excludes Transfers)
export const calculatePeriodSummary = (
  transactions: Tx[],
  fromDate?: string,
  toDate?: string,
  scope: Scope = 'all'
): PeriodSummary => {
  let income = 0
  let expenses = 0
  let transfersTotal = 0
  let txCount = 0

  for (const tx of transactions) {
    if (fromDate && tx.date < fromDate) continue
    if (toDate && tx.date > toDate) continue
    if (scope !== 'all' && tx.cls !== scope) continue

    txCount++

    if (tx.type === 'in') {
      income += tx.amt
    } else if (tx.type === 'out') {
      expenses += tx.amt
    } else if (tx.type === 'transfer') {
      transfersTotal += tx.amt
    }
  }

  const netSavings = income - expenses
  const savingsRate = income > 0 ? (netSavings / income) * 100 : 0

  return {
    income,
    expenses,
    netSavings,
    savingsRate: Math.round(savingsRate * 10) / 10,
    transfersTotal,
    txCount
  }
}

// Rule 8: Category Totals (Expenses or Income, excludes Transfers)
export const calculateCategoryTotals = (
  transactions: Tx[],
  type: 'in' | 'out' = 'out'
): CategoryBreakdown[] => {
  const map: Record<string, { amount: number; count: number }> = {}
  let total = 0

  for (const tx of transactions) {
    if (tx.type !== type) continue
    const cat = tx.cat || 'Uncategorised'
    if (!map[cat]) {
      map[cat] = { amount: 0, count: 0 }
    }
    map[cat].amount += tx.amt
    map[cat].count++
    total += tx.amt
  }

  return Object.entries(map)
    .map(([category, { amount, count }]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      txCount: count
    }))
    .sort((a, b) => b.amount - a.amount)
}

// Rule 14: Budget progress calculation
export const calculateBudgetProgress = (budgetAmount: number, spentAmount: number) => {
  const percent = budgetAmount > 0 ? Math.round((spentAmount / budgetAmount) * 100) : 0
  const remaining = budgetAmount - spentAmount
  const isOver = remaining < 0
  return {
    budget: budgetAmount,
    spent: spentAmount,
    percent,
    remaining,
    isOver,
    overAmount: isOver ? Math.abs(remaining) : 0
  }
}

// Rule 13: Goal progress calculation
export const calculateGoalProgress = (targetAmount: number, currentAmount: number) => {
  const percent = targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0
  const remaining = Math.max(0, targetAmount - currentAmount)
  const isAchieved = currentAmount >= targetAmount
  return {
    target: targetAmount,
    current: currentAmount,
    percent: Math.min(100, Math.max(0, percent)),
    remaining,
    isAchieved
  }
}

// Month-on-Month comparison
export const calculateComparison = (
  currentSummary: PeriodSummary,
  previousSummary: PeriodSummary
) => {
  const incomeDiff = currentSummary.income - previousSummary.income
  const expenseDiff = currentSummary.expenses - previousSummary.expenses
  const savingsDiff = currentSummary.netSavings - previousSummary.netSavings
  const savingsRateDiff = currentSummary.savingsRate - previousSummary.savingsRate

  const incomePctChange = previousSummary.income > 0
    ? Math.round((incomeDiff / previousSummary.income) * 100)
    : currentSummary.income > 0 ? 100 : 0

  const expensePctChange = previousSummary.expenses > 0
    ? Math.round((expenseDiff / previousSummary.expenses) * 100)
    : currentSummary.expenses > 0 ? 100 : 0

  return {
    incomeDiff,
    incomePctChange,
    expenseDiff,
    expensePctChange,
    savingsDiff,
    savingsRateDiff
  }
}

// Rule 10: Multi-filter transactions
export const filterTransactions = (transactions: Tx[], options: FilterOptions): Tx[] => {
  const { query, type, accountId, categoryId, method, scope, from, to } = options
  const q = query ? query.trim().toLowerCase() : ''

  return transactions.filter(tx => {
    if (type && tx.type !== type) return false
    if (scope && scope !== 'all' && tx.cls !== scope) return false
    if (from && tx.date < from) return false
    if (to && tx.date > to) return false
    if (method && tx.method !== method) return false
    if (categoryId && tx.cat !== categoryId) return false

    // Account filtering: if an account is selected:
    // for in/out: tx.accountId === accountId
    // for transfer: tx.accountId === accountId OR tx.toAccountId === accountId
    if (accountId) {
      if (tx.type === 'transfer') {
        if (tx.accountId !== accountId && tx.toAccountId !== accountId) return false
      } else {
        if (tx.accountId !== accountId) return false
      }
    }

    // Text search query across note, category, method
    if (q) {
      const match =
        (tx.note && tx.note.toLowerCase().includes(q)) ||
        (tx.cat && tx.cat.toLowerCase().includes(q)) ||
        (tx.method && tx.method.toLowerCase().includes(q))
      if (!match) return false
    }

    return true
  })
}

// Sort newest first: by date then time then created timestamp
export const newestFirst = (a: Tx, b: Tx): number => {
  const dateA = a.date + (a.time || '00:00')
  const dateB = b.date + (b.time || '00:00')
  if (dateB !== dateA) return dateB > dateA ? 1 : -1
  return (b.created || 0) - (a.created || 0)
}
