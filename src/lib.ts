export type Kind = 'in' | 'out'
export type Cls = 'personal' | 'business' | 'shared'
export type Scope = 'all' | 'personal' | 'business'
export interface Tx { id: string; type: Kind; amt: number; cat: string; cls: Cls; method: string; date: string; time?: string; note: string; created?: number; modified?: number }
export interface Cfg { targets: Record<string, number>; budgets: Record<string, number>; email: string; lastBackup: string }
export const EXP = ['Food and groceries','Tea and snacks','Rent','Utilities and electricity','Transport and fuel','Medical expenses','Shopping','Household expenses','Family expenses','Phone and internet','Travel','Entertainment','Business supplies and materials','Business rent','Packaging and delivery','Repairs and maintenance','EMIs and loan payments','Other expenses']
export const INC = ['Business sales','Customer payment','Salary','Refund','Other income']
export const METHODS = ['Cash','UPI','Bank transfer','Card','Cheque']
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
export const addDays = (d: string, n: number) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10) }
export const addMonths = (m: string, n: number) => { const [y, mo] = m.split('-').map(Number); return new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7) }
export const monthEnd = (m: string) => { const [y, mo] = m.split('-').map(Number); return new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10) }
export const monthName = (m: string) => new Date(m + '-15T00:00:00Z').toLocaleString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })
export const fmt = (p: number) => (p < 0 ? '−' : '') + '₹' + (Math.abs(p) / 100).toLocaleString('en-IN', { minimumFractionDigits: p % 100 ? 2 : 0, maximumFractionDigits: 2 })
export const toP = (s: string) => { const n = Number(s); return isFinite(n) && n > 0 ? Math.round(n * 100) : 0 }
export const sum = (a: Tx[], t: Kind) => a.filter(x => x.type === t).reduce((s, x) => s + x.amt, 0)
export const newest = (a: Tx, b: Tx) => ((b.date + (b.time || '')) > (a.date + (a.time || '')) ? 1 : -1)
export const inScope = (a: Tx[], s: Scope) => (s === 'all' ? a : a.filter(x => x.cls === s))
export const byCategory = (a: Tx[]) => { const c: Record<string, number> = {}; a.filter(x => x.type === 'out').forEach(x => (c[x.cat] = (c[x.cat] || 0) + x.amt)); return Object.entries(c).sort((x, y) => y[1] - x[1]) }
export const download = (name: string, text: string, type: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000) }
const cell = (v: unknown) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"' }
export const toCsv = (a: Tx[]) => ['Date,Time,Type,Category,Amount (INR),Class,Method,Note', ...a.map(x => [x.date, x.time, x.type, x.cat, x.amt / 100, x.cls, x.method, x.note].map(cell).join(','))].join('\n')
// Validates a Hisaab backup (also the format written by the original HTML app). Never throws on single bad rows; counts them.
export function parseBackup(text: string) {
  const j = JSON.parse(text)
  if (!j || j.app !== 'hisaab' || !Array.isArray(j.tx)) throw new Error('Not a Hisaab backup file.')
  const tx: Tx[] = []; let skipped = 0
  for (const r of j.tx) {
    const ok = r && typeof r.id === 'string' && r.id && (r.type === 'in' || r.type === 'out') && Number.isInteger(r.amt) && r.amt > 0 && typeof r.date === 'string' && /^\d{4}-\d\d-\d\d$/.test(r.date) && typeof r.cat === 'string'
    if (!ok) { skipped++; continue }
    tx.push({ id: r.id, type: r.type, amt: r.amt, cat: r.cat.slice(0, 80), cls: ['personal', 'business', 'shared'].includes(r.cls) ? r.cls : 'personal', method: typeof r.method === 'string' ? r.method.slice(0, 40) : 'Cash', date: r.date, time: typeof r.time === 'string' ? r.time.slice(0, 5) : '', note: typeof r.note === 'string' ? r.note.slice(0, 500) : '', created: r.created, modified: r.modified })
  }
  const num = (o: unknown) => { const out: Record<string, number> = {}; if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (/^\d{4}-\d\d$/.test(k) && Number.isInteger(v) && (v as number) >= 0) out[k] = v as number; return out }
  return { tx, skipped, targets: num(j.cfg?.targets), budgets: num(j.cfg?.budgets), email: typeof j.cfg?.email === 'string' ? j.cfg.email : '' }
}
