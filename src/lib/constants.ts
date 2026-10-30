import { Account, Category } from '../types'

export const EXP = [
  'Food and groceries',
  'Tea and snacks',
  'Rent',
  'Utilities and electricity',
  'Transport and fuel',
  'Medical expenses',
  'Shopping',
  'Household expenses',
  'Family expenses',
  'Phone and internet',
  'Travel',
  'Entertainment',
  'Business supplies and materials',
  'Business rent',
  'Packaging and delivery',
  'Repairs and maintenance',
  'EMIs and loan payments',
  'Other expenses'
]

export const INC = [
  'Business sales',
  'Customer payment',
  'Salary',
  'Refund',
  'Other income'
]

export const METHODS = [
  'UPI',
  'Cash',
  'Debit Card',
  'Credit Card',
  'Bank transfer',
  'ATM Withdrawal',
  'Cheque',
  'Other'
]

export const CATEGORY_COLORS = [
  '#4A7C59', // Muted Forest Green
  '#5C8068', // Sage
  '#466978', // Slate Blue
  '#806254', // Warm Brown
  '#7A5266', // Muted Plum
  '#8E6C38', // Amber Earth
  '#437A74', // Teal Green
  '#636D78', // Steel Gray
  '#8F5555', // Terracotta
  '#5F7052'  // Olive
]

export const CATEGORY_ICONS = [
  'Coffee',
  'ShoppingBag',
  'Home',
  'Car',
  'HeartPulse',
  'Briefcase',
  'Smartphone',
  'CreditCard',
  'Package',
  'Users',
  'Plane',
  'Receipt',
  'Wallet',
  'Tag',
  'Film',
  'Zap',
  'Shield',
  'BookOpen',
  'MoreHorizontal'
]

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc-cash',
    name: 'Cash Wallet',
    type: 'cash',
    openingBalance: 0,
    openingDate: '2020-01-01',
    isArchived: false,
    created: 1,
    modified: 1
  },
  {
    id: 'acc-primary-bank',
    name: 'Primary Bank Account',
    type: 'bank',
    openingBalance: 0,
    openingDate: '2020-01-01',
    isArchived: false,
    created: 1,
    modified: 1
  }
]

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = EXP.map((name, i) => ({
  id: `cat-exp-${i + 1}`,
  name,
  type: 'out',
  icon: getInitialIcon(name, 'out'),
  color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  isSystem: true,
  created: 1,
  modified: 1
}))

export const DEFAULT_INCOME_CATEGORIES: Category[] = INC.map((name, i) => ({
  id: `cat-inc-${i + 1}`,
  name,
  type: 'in',
  icon: getInitialIcon(name, 'in'),
  color: CATEGORY_COLORS[(i + 4) % CATEGORY_COLORS.length],
  isSystem: true,
  created: 1,
  modified: 1
}))

function getInitialIcon(category: string, type: 'in' | 'out'): string {
  const c = category.toLowerCase()
  if (/tea|snack|coffee/.test(c)) return 'Coffee'
  if (/food|grocer/.test(c)) return 'ShoppingBag'
  if (/rent|house|household/.test(c)) return 'Home'
  if (/utilit|electric|phone|internet/.test(c)) return /electric/.test(c) ? 'Zap' : 'Smartphone'
  if (/transport|fuel/.test(c)) return 'Car'
  if (/travel|flight/.test(c)) return 'Plane'
  if (/medical|health/.test(c)) return 'HeartPulse'
  if (/shop/.test(c)) return 'ShoppingBag'
  if (/business|sales|customer|material|packag/.test(c)) return 'Briefcase'
  if (/emi|loan|payment/.test(c)) return 'CreditCard'
  if (/repair|maintenance/.test(c)) return 'Package'
  if (/family|shared/.test(c)) return 'Users'
  if (/entertainment|movie/.test(c)) return 'Film'
  if (type === 'in') return 'Wallet'
  return 'Receipt'
}
