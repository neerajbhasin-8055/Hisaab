// Date & Time utilities
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

export const addDays = (d: string, n: number): string => {
  const x = new Date(d + 'T00:00:00Z')
  x.setUTCDate(x.getUTCDate() + n)
  return x.toISOString().slice(0, 10)
}

export const addMonths = (m: string, n: number): string => {
  const [y, mo] = m.split('-').map(Number)
  return new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7)
}

export const monthEnd = (m: string): string => {
  const [y, mo] = m.split('-').map(Number)
  return new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10)
}

export const monthName = (m: string): string => {
  return new Date(m + '-15T00:00:00Z').toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })
}

export const formatDateDisplay = (d: string): string => {
  if (!d) return ''
  try {
    const dt = new Date(d + 'T00:00:00Z')
    return dt.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    })
  } catch {
    return d
  }
}

// Format paise as Indian Rupee string
// e.g. 10050 -> ₹100.50, 2500000 -> ₹25,000
export const fmt = (p: number, showSign = false): string => {
  const isNeg = p < 0
  const abs = Math.abs(p)
  const rupees = abs / 100
  const formatted = rupees.toLocaleString('en-IN', {
    minimumFractionDigits: abs % 100 ? 2 : 0,
    maximumFractionDigits: 2
  })
  const prefix = isNeg ? '−' : showSign ? '+' : ''
  return `${prefix}₹${formatted}`
}

// Parse string amount into integer paise safely
export const toP = (s: string): number => {
  if (!s) return 0
  const clean = s.trim().replace(/[^\d.-]/g, '')
  const n = Number(clean)
  return isFinite(n) && n > 0 ? Math.round(n * 100) : 0
}

// Convert paise back to standard decimal input string
export const toRupeeString = (p: number): string => {
  if (!p) return ''
  return (p / 100).toFixed(p % 100 ? 2 : 0)
}
