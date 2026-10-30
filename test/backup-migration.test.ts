import test from 'node:test'
import assert from 'node:assert/strict'
import { parseHisaabBackup, createBackupPayload } from '../src/lib/backup'
import { Cfg, Tx, Account, Category, Goal } from '../src/types'

test('Backup & Restore: Valid V1 Backup parses successfully', () => {
  const v1 = JSON.stringify({
    app: 'hisaab',
    version: 1,
    exported: '2026-10-15T10:00:00Z',
    cfg: {
      targets: { '2026-10': 2000000 },
      budgets: { '2026-10': 3000000 },
      email: 'founder@hisaab.local'
    },
    tx: [
      {
        id: 'tx-1',
        type: 'out',
        amt: 50000,
        cat: 'Food and groceries',
        cls: 'personal',
        method: 'UPI',
        date: '2026-10-01',
        note: 'Grocery store'
      },
      {
        id: 'tx-2',
        type: 'in',
        amt: 5000000,
        cat: 'Salary',
        cls: 'personal',
        method: 'Bank transfer',
        date: '2026-10-01',
        note: 'Monthly salary'
      }
    ]
  })

  const res = parseHisaabBackup(v1)
  assert.equal(res.version, 1)
  assert.equal(res.tx.length, 2)
  assert.equal(res.skipped, 0)
  assert.equal(res.targets['2026-10'], 2000000)
  assert.equal(res.budgets['2026-10'], 3000000)
  assert.equal(res.email, 'founder@hisaab.local')
})

test('Backup & Restore: Valid V2 Backup with accounts, categories and goals', () => {
  const cfg: Cfg = {
    targets: { '2026-10': 2500000 },
    budgets: { '2026-10': 3500000 },
    categoryBudgets: { '2026-10:cat-1': 1000000 },
    email: 'user@test.local',
    lastBackup: '2026-10-30T10:00:00Z'
  }
  const tx: Tx[] = [
    {
      id: 'tx-v2-1',
      type: 'transfer',
      amt: 200000,
      cat: 'Transfer',
      cls: 'personal',
      method: 'ATM Withdrawal',
      accountId: 'acc-hdfc',
      toAccountId: 'acc-cash',
      date: '2026-10-20',
      note: 'Cash out'
    }
  ]
  const accounts: Account[] = [
    {
      id: 'acc-hdfc',
      name: 'HDFC Bank',
      type: 'bank',
      openingBalance: 1500000,
      openingDate: '2026-01-01',
      isArchived: false
    }
  ]
  const categories: Category[] = [
    {
      id: 'cat-custom-1',
      name: 'Office Lunch',
      type: 'out',
      icon: 'Coffee',
      color: '#4A7C59'
    }
  ]
  const goals: Goal[] = [
    {
      id: 'goal-1',
      name: 'Emergency Fund',
      targetAmount: 10000000,
      currentAmount: 4000000,
      targetDate: '2026-12-31'
    }
  ]

  const payload = createBackupPayload(cfg, tx, accounts, categories, goals)
  const jsonStr = JSON.stringify(payload)
  const res = parseHisaabBackup(jsonStr)

  assert.equal(res.version, 2)
  assert.equal(res.tx.length, 1)
  assert.equal(res.accounts.length, 1)
  assert.equal(res.accounts[0].name, 'HDFC Bank')
  assert.equal(res.categories.length, 1)
  assert.equal(res.categories[0].name, 'Office Lunch')
  assert.equal(res.goals.length, 1)
  assert.equal(res.goals[0].name, 'Emergency Fund')
})

test('Backup & Restore: Skips malformed transactions without crashing', () => {
  const badData = JSON.stringify({
    app: 'hisaab',
    version: 1,
    tx: [
      { id: 'valid-1', type: 'out', amt: 1000, cat: 'Rent', date: '2026-10-01' },
      { id: '', type: 'out', amt: 1000, cat: 'Rent', date: '2026-10-01' }, // missing id
      { id: 'bad-amt', type: 'out', amt: -500, cat: 'Rent', date: '2026-10-01' }, // negative amount
      { id: 'bad-date', type: 'out', amt: 500, cat: 'Rent', date: 'not-a-date' }, // invalid date
      null, // null entry
      'corrupt row'
    ]
  })

  const res = parseHisaabBackup(badData)
  assert.equal(res.tx.length, 1)
  assert.equal(res.skippedTxCount, 5)
  assert.equal(res.skipped, 5)
})

test('Backup & Restore: Throws on non-Hisaab or invalid JSON file', () => {
  assert.throws(() => parseHisaabBackup('not json at all'), /File is not valid JSON/)
  assert.throws(() => parseHisaabBackup('{"app":"other-app"}'), /Not a valid Hisaab backup file/)
})
