import { Account, Category, Cfg, Goal, HisaabBackupV2, Tx } from '../types'

export interface ParsedBackupResult {
  version: number
  tx: Tx[]
  accounts: Account[]
  categories: Category[]
  goals: Goal[]
  targets: Record<string, number>
  budgets: Record<string, number>
  email: string
  skipped: number // total skipped records across all types
  skippedTxCount: number
  skippedAccountCount: number
  skippedCategoryCount: number
  skippedGoalCount: number
}

/**
 * Validates and parses a Hisaab backup JSON string (handles both v1 and v2 formats).
 * Never crashes on individual bad records; skips them and reports the counts.
 */
export function parseHisaabBackup(text: string): ParsedBackupResult {
  let j: any
  try {
    j = JSON.parse(text)
  } catch {
    throw new Error('File is not valid JSON.')
  }

  if (!j || typeof j !== 'object' || j.app !== 'hisaab') {
    throw new Error('Not a valid Hisaab backup file (missing hisaab app identifier).')
  }

  const version = j.version === 2 ? 2 : 1
  const validTx: Tx[] = []
  let skippedTxCount = 0

  if (Array.isArray(j.tx)) {
    for (const r of j.tx) {
      const isRecord = r && typeof r === 'object'
      const hasId = isRecord && typeof r.id === 'string' && r.id.trim().length > 0
      const validType = isRecord && (r.type === 'in' || r.type === 'out' || r.type === 'transfer')
      const validAmt = isRecord && Number.isInteger(r.amt) && r.amt > 0
      const validDate = isRecord && typeof r.date === 'string' && /^\d{4}-\d\d-\d\d$/.test(r.date)
      const validCat = isRecord && typeof r.cat === 'string'

      if (!hasId || !validType || !validAmt || !validDate || !validCat) {
        skippedTxCount++
        continue
      }

      validTx.push({
        id: r.id.trim(),
        type: r.type,
        amt: r.amt,
        cat: r.cat.slice(0, 80),
        cls: ['personal', 'business', 'shared'].includes(r.cls) ? r.cls : 'personal',
        method: typeof r.method === 'string' ? r.method.slice(0, 40) : 'Cash',
        date: r.date,
        time: typeof r.time === 'string' && /^\d\d:\d\d$/.test(r.time) ? r.time : '',
        note: typeof r.note === 'string' ? r.note.slice(0, 500) : '',
        accountId: typeof r.accountId === 'string' && r.accountId ? r.accountId : undefined,
        toAccountId: typeof r.toAccountId === 'string' && r.toAccountId ? r.toAccountId : undefined,
        created: typeof r.created === 'number' ? r.created : undefined,
        modified: typeof r.modified === 'number' ? r.modified : undefined
      })
    }
  }

  // Parse accounts (v2)
  const validAccounts: Account[] = []
  let skippedAccountCount = 0
  if (Array.isArray(j.accounts)) {
    for (const a of j.accounts) {
      const ok =
        a &&
        typeof a.id === 'string' &&
        a.id.trim().length > 0 &&
        typeof a.name === 'string' &&
        a.name.trim().length > 0 &&
        ['bank', 'cash', 'other'].includes(a.type) &&
        Number.isInteger(a.openingBalance) &&
        typeof a.openingDate === 'string'

      if (!ok) {
        skippedAccountCount++
        continue
      }

      validAccounts.push({
        id: a.id.trim(),
        name: a.name.trim().slice(0, 80),
        type: a.type,
        openingBalance: a.openingBalance,
        openingDate: a.openingDate,
        isArchived: Boolean(a.isArchived),
        created: typeof a.created === 'number' ? a.created : Date.now(),
        modified: typeof a.modified === 'number' ? a.modified : Date.now()
      })
    }
  }

  // Parse categories (v2)
  const validCategories: Category[] = []
  let skippedCategoryCount = 0
  if (Array.isArray(j.categories)) {
    for (const c of j.categories) {
      const ok =
        c &&
        typeof c.id === 'string' &&
        c.id.trim().length > 0 &&
        typeof c.name === 'string' &&
        c.name.trim().length > 0 &&
        (c.type === 'in' || c.type === 'out')

      if (!ok) {
        skippedCategoryCount++
        continue
      }

      validCategories.push({
        id: c.id.trim(),
        name: c.name.trim().slice(0, 80),
        type: c.type,
        icon: typeof c.icon === 'string' ? c.icon : undefined,
        color: typeof c.color === 'string' ? c.color : undefined,
        isSystem: Boolean(c.isSystem),
        created: typeof c.created === 'number' ? c.created : Date.now(),
        modified: typeof c.modified === 'number' ? c.modified : Date.now()
      })
    }
  }

  // Parse goals (v2)
  const validGoals: Goal[] = []
  let skippedGoalCount = 0
  if (Array.isArray(j.goals)) {
    for (const g of j.goals) {
      const ok =
        g &&
        typeof g.id === 'string' &&
        g.id.trim().length > 0 &&
        typeof g.name === 'string' &&
        g.name.trim().length > 0 &&
        Number.isInteger(g.targetAmount) &&
        g.targetAmount > 0

      if (!ok) {
        skippedGoalCount++
        continue
      }

      validGoals.push({
        id: g.id.trim(),
        name: g.name.trim().slice(0, 80),
        targetAmount: g.targetAmount,
        currentAmount: Number.isInteger(g.currentAmount) ? Math.max(0, g.currentAmount) : 0,
        targetDate: typeof g.targetDate === 'string' ? g.targetDate : undefined,
        color: typeof g.color === 'string' ? g.color : undefined,
        created: typeof g.created === 'number' ? g.created : Date.now(),
        modified: typeof g.modified === 'number' ? g.modified : Date.now()
      })
    }
  }

  // Parse monthly targets and budgets (preserves backward compatibility with v1)
  const parseNumRecord = (obj: unknown): Record<string, number> => {
    const out: Record<string, number> = {}
    if (obj && typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        if (/^\d{4}-\d\d$/.test(k) && Number.isInteger(v) && (v as number) >= 0) {
          out[k] = v as number
        }
      }
    }
    return out
  }

  return {
    version,
    tx: validTx,
    accounts: validAccounts,
    categories: validCategories,
    goals: validGoals,
    targets: parseNumRecord(j.cfg?.targets),
    budgets: parseNumRecord(j.cfg?.budgets),
    email: typeof j.cfg?.email === 'string' ? j.cfg.email : '',
    skipped: skippedTxCount + skippedAccountCount + skippedCategoryCount + skippedGoalCount,
    skippedTxCount,
    skippedAccountCount,
    skippedCategoryCount,
    skippedGoalCount
  }
}

/**
 * Creates full version 2 JSON backup payload.
 */
export function createBackupPayload(
  cfg: Cfg,
  tx: Tx[],
  accounts: Account[],
  categories: Category[],
  goals: Goal[]
): HisaabBackupV2 {
  return {
    app: 'hisaab',
    version: 2,
    exported: new Date().toISOString(),
    cfg,
    tx,
    accounts,
    categories,
    goals
  }
}
