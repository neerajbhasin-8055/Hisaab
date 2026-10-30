import { Account, Tx } from '../types'

/**
 * Escapes CSV cells and guards against spreadsheet formula injection.
 * Formula triggers: '=', '+', '-', '@', tab, carriage return.
 */
export const escapeCsvCell = (value: unknown): string => {
  let s = String(value ?? '').trim()
  if (/^[=+\-@\t\r]/.test(s)) {
    s = "'" + s
  }
  return '"' + s.replace(/"/g, '""') + '"'
}

/**
 * Converts transactions into formatted CSV content with account names and full details.
 */
export const toCsv = (transactions: Tx[], accounts: Account[] = []): string => {
  const accountMap = new Map<string, string>()
  for (const acc of accounts) {
    accountMap.set(acc.id, acc.name)
  }

  const headers = [
    'Date',
    'Time',
    'Type',
    'Category',
    'Amount (INR)',
    'Class',
    'Account',
    'To Account',
    'Payment Method',
    'Note'
  ]

  const rows = transactions.map(tx => {
    const accName = tx.accountId
      ? tx.accountId === 'unassigned'
        ? 'Unassigned'
        : accountMap.get(tx.accountId) || 'Unknown'
      : 'Unassigned'

    const toAccName = tx.toAccountId ? accountMap.get(tx.toAccountId) || 'Unknown' : ''

    return [
      tx.date,
      tx.time || '',
      tx.type,
      tx.cat,
      (tx.amt / 100).toFixed(2),
      tx.cls,
      accName,
      toAccName,
      tx.method,
      tx.note
    ].map(escapeCsvCell).join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Triggers safe client-side file download.
 */
export const downloadFile = (name: string, content: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
