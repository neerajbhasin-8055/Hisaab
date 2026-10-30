// Compatibility entry point for lib
export * from './types'
export * from './lib/constants'
export * from './lib/format'
export * from './lib/calculations'
export * from './lib/suggestions'
export * from './lib/csv'
export * from './lib/backup'

// Direct compatibility functions for previous callers
import { Scope, Tx, Kind, Account } from './types'
import { downloadFile, toCsv as modernToCsv } from './lib/csv'
import { parseHisaabBackup } from './lib/backup'

export const sum = (a: Tx[], t: Kind) =>
  a.filter(x => x.type === t).reduce((s, x) => s + x.amt, 0)

export const newest = (a: Tx, b: Tx) =>
  ((b.date + (b.time || '')) > (a.date + (a.time || '')) ? 1 : -1)

export const inScope = (a: Tx[], s: Scope) =>
  s === 'all' ? a : a.filter(x => x.cls === s)

export const byCategory = (a: Tx[]) => {
  const c: Record<string, number> = {}
  a.filter(x => x.type === 'out').forEach(x => {
    c[x.cat] = (c[x.cat] || 0) + x.amt
  })
  return Object.entries(c).sort((x, y) => y[1] - x[1])
}

export const download = (name: string, text: string, type: string) => {
  downloadFile(name, text, type)
}

export const toCsv = (a: Tx[], accounts: Account[] = []) => modernToCsv(a, accounts)

export const parseBackup = (text: string) => parseHisaabBackup(text)
