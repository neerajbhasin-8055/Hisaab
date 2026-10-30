import test from 'node:test'
import assert from 'node:assert/strict'

import { fmt, toP } from '../src/lib/format'
import {
  calculateAccountBalance,
  calculateTotalBalance,
  calculateBankBalance,
  calculateCashBalance,
  calculatePeriodSummary,
  calculateCategoryTotals,
  calculateBudgetProgress,
  calculateGoalProgress,
  filterTransactions
} from '../src/lib/calculations'

import { findCategorySuggestion } from '../src/lib/suggestions'
import { escapeCsvCell, toCsv } from '../src/lib/csv'
import { Account, Tx } from '../src/types'

test('Format and Paise conversions (Rule 11: Precision)', () => {
  assert.equal(fmt(0), '₹0')
  assert.equal(fmt(10050), '₹100.50')
  assert.equal(fmt(2500000), '₹25,000')
  assert.equal(fmt(-50000), '−₹500')
  assert.equal(fmt(50000, true), '+₹500')

  assert.equal(toP('100.50'), 10050)
  assert.equal(toP('₹25,000'), 2500000)
  assert.equal(toP('0'), 0)
  assert.equal(toP('-50'), 0)
  assert.equal(toP('abc'), 0)
})

test('Rule 1: Expense reduces account balance & increases period expenses', () => {
  const bankAcc: Account = {
    id: 'acc-hdfc',
    name: 'HDFC Bank',
    type: 'bank',
    openingBalance: 1500000,
    openingDate: '2026-01-01'
  }
  const tx: Tx[] = [
    {
      id: '1',
      type: 'out',
      amt: 50000,
      accountId: 'acc-hdfc',
      date: '2026-10-01',
      cat: 'Food and groceries',
      cls: 'personal',
      method: 'Debit Card',
      note: 'Supermarket'
    }
  ]
  const bal = calculateAccountBalance(bankAcc, tx)
  assert.equal(bal, 1450000) // ₹14,500

  const summary = calculatePeriodSummary(tx, '2026-10-01', '2026-10-31')
  assert.equal(summary.expenses, 50000)
  assert.equal(summary.income, 0)
  assert.equal(summary.netSavings, -50000)
})

test('Rule 2: Income increases account balance & increases period income', () => {
  const bankAcc: Account = {
    id: 'acc-hdfc',
    name: 'HDFC Bank',
    type: 'bank',
    openingBalance: 1500000,
    openingDate: '2026-01-01'
  }
  const tx: Tx[] = [
    {
      id: '1',
      type: 'in',
      amt: 5000000,
      accountId: 'acc-hdfc',
      date: '2026-10-01',
      cat: 'Salary',
      cls: 'personal',
      method: 'Bank transfer',
      note: 'October Pay'
    }
  ]
  const bal = calculateAccountBalance(bankAcc, tx)
  assert.equal(bal, 6500000) // ₹65,000

  const summary = calculatePeriodSummary(tx, '2026-10-01', '2026-10-31')
  assert.equal(summary.income, 5000000)
  assert.equal(summary.expenses, 0)
  assert.equal(summary.netSavings, 5000000)
  assert.equal(summary.savingsRate, 100)
})

test('Rule 3 & Mandatory Accounting Example: Transfer updates both accounts and combined balance remains invariant', () => {
  const hdfc: Account = {
    id: 'hdfc',
    name: 'HDFC Bank',
    type: 'bank',
    openingBalance: 1500000,
    openingDate: '2026-01-01',
    isArchived: false
  }
  const cash: Account = {
    id: 'cash',
    name: 'Cash Wallet',
    type: 'cash',
    openingBalance: 200000,
    openingDate: '2026-01-01',
    isArchived: false
  }
  const accounts = [hdfc, cash]

  // ATM withdrawal: ₹2,000 (200,000 paise) from HDFC to Cash Wallet
  const tx: Tx[] = [
    {
      id: 'tx-atm',
      type: 'transfer',
      amt: 200000,
      accountId: 'hdfc', // source
      toAccountId: 'cash', // destination
      date: '2026-10-05',
      cls: 'personal',
      method: 'ATM Withdrawal',
      note: 'ATM cash withdrawal',
      cat: 'Transfer'
    }
  ]

  const hdfcBal = calculateAccountBalance(hdfc, tx)
  const cashBal = calculateAccountBalance(cash, tx)
  const totalBal = calculateTotalBalance(accounts, tx)

  assert.equal(hdfcBal, 1300000, 'HDFC balance should be ₹13,000')
  assert.equal(cashBal, 400000, 'Cash Wallet balance should be ₹4,000')
  assert.equal(totalBal, 1700000, 'Combined total balance must remain invariant at ₹17,000')

  // Rule 3: Transfers must NOT increase income or expenses!
  const summary = calculatePeriodSummary(tx, '2026-10-01', '2026-10-31')
  assert.equal(summary.income, 0, 'Transfer must not count as income')
  assert.equal(summary.expenses, 0, 'Transfer must not count as expense')
  assert.equal(summary.netSavings, 0, 'Transfer must not affect net savings')
  assert.equal(summary.transfersTotal, 200000, 'Internal transfer tracked for audit')
})

test('Rule 4: Opening balance is a baseline, not period income', () => {
  const hdfc: Account = {
    id: 'hdfc',
    name: 'HDFC Bank',
    type: 'bank',
    openingBalance: 2500000,
    openingDate: '2026-01-01'
  }
  const tx: Tx[] = []
  const bal = calculateAccountBalance(hdfc, tx)
  assert.equal(bal, 2500000)

  const summary = calculatePeriodSummary(tx, '2026-10-01', '2026-10-31')
  assert.equal(summary.income, 0, 'Opening balance must NOT count as period income')
  assert.equal(summary.expenses, 0)
  assert.equal(summary.netSavings, 0)
})

test('Rule 5, 6, 7: Total Balance, Bank Balance, Cash Balance across active accounts', () => {
  const hdfc: Account = {
    id: 'hdfc',
    name: 'HDFC Bank',
    type: 'bank',
    openingBalance: 1500000,
    openingDate: '2026-01-01',
    isArchived: false
  }
  const sbi: Account = {
    id: 'sbi',
    name: 'SBI Bank',
    type: 'bank',
    openingBalance: 800000,
    openingDate: '2026-01-01',
    isArchived: false
  }
  const cash: Account = {
    id: 'cash',
    name: 'Cash Wallet',
    type: 'cash',
    openingBalance: 200000,
    openingDate: '2026-01-01',
    isArchived: false
  }
  const oldClosedAcc: Account = {
    id: 'old',
    name: 'Old Account',
    type: 'bank',
    openingBalance: 500000,
    openingDate: '2026-01-01',
    isArchived: true
  }

  const accounts = [hdfc, sbi, cash, oldClosedAcc]
  const tx: Tx[] = []

  const total = calculateTotalBalance(accounts, tx)
  const bankTotal = calculateBankBalance(accounts, tx)
  const cashTotal = calculateCashBalance(accounts, tx)

  assert.equal(total, 2500000, 'Total should be ₹25,000 (active accounts only)')
  assert.equal(bankTotal, 2300000, 'Bank balance should be ₹23,000')
  assert.equal(cashTotal, 200000, 'Cash balance should be ₹2,000')
})

test('Rule 8: Category expense totals include qualifying expenses and exclude transfers', () => {
  const tx: Tx[] = [
    {
      id: '1',
      type: 'out',
      amt: 120000,
      cat: 'Food and groceries',
      cls: 'personal',
      method: 'UPI',
      date: '2026-10-01',
      note: ''
    },
    {
      id: '2',
      type: 'out',
      amt: 45000,
      cat: 'Tea and snacks',
      cls: 'personal',
      method: 'Cash',
      date: '2026-10-02',
      note: ''
    },
    {
      id: '3',
      type: 'out',
      amt: 80000,
      cat: 'Food and groceries',
      cls: 'personal',
      method: 'UPI',
      date: '2026-10-03',
      note: ''
    },
    {
      id: '4',
      type: 'transfer',
      amt: 500000,
      cat: 'Transfer',
      cls: 'personal',
      method: 'Bank transfer',
      date: '2026-10-04',
      note: ''
    }
  ]

  const breakdown = calculateCategoryTotals(tx, 'out')
  assert.equal(breakdown.length, 2)
  assert.equal(breakdown[0].category, 'Food and groceries')
  assert.equal(breakdown[0].amount, 200000) // ₹2,000
  assert.equal(breakdown[1].category, 'Tea and snacks')
  assert.equal(breakdown[1].amount, 45000) // ₹450
})

test('Rule 9: Net savings and savings rate calculation', () => {
  const tx: Tx[] = [
    {
      id: '1',
      type: 'in',
      amt: 5000000,
      date: '2026-10-01',
      cat: 'Salary',
      cls: 'personal',
      method: 'Bank transfer',
      note: ''
    },
    {
      id: '2',
      type: 'out',
      amt: 3000000,
      date: '2026-10-02',
      cat: 'Rent',
      cls: 'personal',
      method: 'Bank transfer',
      note: ''
    }
  ]
  const summary = calculatePeriodSummary(tx, '2026-10-01', '2026-10-31')
  assert.equal(summary.income, 5000000)
  assert.equal(summary.expenses, 3000000)
  assert.equal(summary.netSavings, 2000000) // ₹20,000
  assert.equal(summary.savingsRate, 40) // 40%

  // Deficit scenario: expenses > income
  const deficitTx: Tx[] = [
    {
      id: '1',
      type: 'in',
      amt: 1000000,
      date: '2026-10-01',
      cat: 'Salary',
      cls: 'personal',
      method: 'Bank transfer',
      note: ''
    },
    {
      id: '2',
      type: 'out',
      amt: 1500000,
      date: '2026-10-02',
      cat: 'Rent',
      cls: 'personal',
      method: 'Bank transfer',
      note: ''
    }
  ]
  const deficitSummary = calculatePeriodSummary(deficitTx, '2026-10-01', '2026-10-31')
  assert.equal(deficitSummary.netSavings, -500000)
  assert.equal(deficitSummary.savingsRate, -50)
})

test('Rule 10: Multi-filter behaves consistently across date, type, account, category, method, scope', () => {
  const tx: Tx[] = [
    {
      id: '1',
      type: 'out',
      amt: 120000,
      cat: 'Food and groceries',
      cls: 'personal',
      method: 'UPI',
      accountId: 'acc-hdfc',
      date: '2026-10-01',
      note: 'Grocery Store'
    },
    {
      id: '2',
      type: 'out',
      amt: 45000,
      cat: 'Food and groceries',
      cls: 'personal',
      method: 'UPI',
      accountId: 'acc-hdfc',
      date: '2026-10-02',
      note: 'Restaurant'
    },
    {
      id: '3',
      type: 'out',
      amt: 25000,
      cat: 'Food and groceries',
      cls: 'personal',
      method: 'Cash',
      accountId: 'acc-cash',
      date: '2026-10-03',
      note: 'Vegetable Shop'
    }
  ]

  // All October Food & Groceries
  const filteredAll = filterTransactions(tx, { categoryId: 'Food and groceries' })
  assert.equal(filteredAll.length, 3)

  // Filter Cash only
  const filteredCash = filterTransactions(tx, {
    categoryId: 'Food and groceries',
    method: 'Cash'
  })
  assert.equal(filteredCash.length, 1)
  assert.equal(filteredCash[0].amt, 25000)

  // Filter HDFC only
  const filteredHdfc = filterTransactions(tx, {
    accountId: 'acc-hdfc'
  })
  assert.equal(filteredHdfc.length, 2)
})

test('Rule 13 & 14: Savings Goals and Budgets progress calculation', () => {
  const goalProgress = calculateGoalProgress(10000000, 6000000)
  assert.equal(goalProgress.percent, 60)
  assert.equal(goalProgress.remaining, 4000000)
  assert.equal(goalProgress.isAchieved, false)

  const budgetProgress = calculateBudgetProgress(3000000, 1800000)
  assert.equal(budgetProgress.percent, 60)
  assert.equal(budgetProgress.remaining, 1200000)
  assert.equal(budgetProgress.isOver, false)

  const overBudget = calculateBudgetProgress(3000000, 3500000)
  assert.equal(overBudget.isOver, true)
  assert.equal(overBudget.overAmount, 500000)
})

test('CSV Formula Injection Prevention', () => {
  assert.equal(escapeCsvCell('=1+1'), '"\'=1+1"')
  assert.equal(escapeCsvCell('+500'), '"\'+500"')
  assert.equal(escapeCsvCell('-200'), '"\'-200"')
  assert.equal(escapeCsvCell('@SUM(A1)'), '"\'@SUM(A1)"')
  assert.equal(escapeCsvCell('Regular Note'), '"Regular Note"')
  assert.equal(escapeCsvCell('Quotes "here"'), '"Quotes ""here"""')
})

test('Vendor-based category suggestions', () => {
  const pastTx: Tx[] = [
    {
      id: '1',
      type: 'out',
      amt: 50000,
      cat: 'Food and groceries',
      cls: 'personal',
      method: 'UPI',
      date: '2026-10-01',
      note: 'ABC Grocery Store'
    },
    {
      id: '2',
      type: 'out',
      amt: 20000,
      cat: 'Tea and snacks',
      cls: 'personal',
      method: 'Cash',
      date: '2026-10-02',
      note: 'Corner Chai Shop'
    }
  ]

  const suggestion1 = findCategorySuggestion('ABC Grocery', pastTx, 'out')
  assert.equal(suggestion1, 'Food and groceries')

  const suggestion2 = findCategorySuggestion('Corner Chai', pastTx, 'out')
  assert.equal(suggestion2, 'Tea and snacks')

  const noSuggestion = findCategorySuggestion('Random Unknown', pastTx, 'out')
  assert.equal(noSuggestion, null)
})
