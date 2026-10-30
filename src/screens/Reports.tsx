import React, { useState } from 'react'
import {
  Download,
  Mail,
  Printer,
  TrendingDown,
  TrendingUp
} from 'lucide-react'
import { useStore } from '../store'
import { ScopeSelect } from '../components'
import {
  Scope,
  addDays,
  calculateCategoryTotals,
  calculateComparison,
  calculatePeriodSummary,
  downloadFile,
  fmt,
  formatDateDisplay,
  inScope,
  monthEnd,
  monthName,
  newestFirst,
  toCsv,
  today
} from '../lib'

export function Reports({ initialMonth }: { initialMonth?: string }) {
  const { tx, cfg, accounts } = useStore()
  const td = today()
  const m0 = initialMonth || td.slice(0, 7)

  const [from, setFrom] = useState(`${m0}-01`)
  const [to, setTo] = useState(monthEnd(m0))
  const [scope, setScope] = useState<Scope>('all')

  // Date Presets
  const setPreset = (preset: 'today' | 'week' | 'thisMonth' | 'lastMonth' | 'thisYear') => {
    if (preset === 'today') {
      setFrom(td)
      setTo(td)
    } else if (preset === 'week') {
      setFrom(addDays(td, -6))
      setTo(td)
    } else if (preset === 'thisMonth') {
      const m = td.slice(0, 7)
      setFrom(`${m}-01`)
      setTo(monthEnd(m))
    } else if (preset === 'lastMonth') {
      const [y, mo] = td.slice(0, 7).split('-').map(Number)
      const prev = new Date(Date.UTC(y, mo - 2, 1)).toISOString().slice(0, 7)
      setFrom(`${prev}-01`)
      setTo(monthEnd(prev))
    } else if (preset === 'thisYear') {
      const year = td.slice(0, 4)
      setFrom(`${year}-01-01`)
      setTo(`${year}-12-31`)
    }
  }

  // Filtered transactions for this period
  const scopedTx = inScope(tx, scope)
  const periodTx = scopedTx.filter(x => x.date >= from && x.date <= to).sort(newestFirst)
  const summary = calculatePeriodSummary(periodTx, from, to, scope)

  // Previous Period comparison
  // Determine duration in days
  const fromTime = new Date(from + 'T00:00:00Z').getTime()
  const toTime = new Date(to + 'T00:00:00Z').getTime()
  const daysDiff = Math.max(1, Math.round((toTime - fromTime) / (1000 * 60 * 60 * 24)) + 1)

  const prevTo = addDays(from, -1)
  const prevFrom = addDays(prevTo, -(daysDiff - 1))
  const prevPeriodTx = scopedTx.filter(x => x.date >= prevFrom && x.date <= prevTo)
  const prevSummary = calculatePeriodSummary(prevPeriodTx, prevFrom, prevTo, scope)
  const comparison = calculateComparison(summary, prevSummary)

  // Category breakdown for expenses
  const categoryTotals = calculateCategoryTotals(periodTx, 'out')

  // Monthly target / budget if full month selected
  const ms = from.slice(0, 7)
  const isFullMonth = from === `${ms}-01` && to === monthEnd(ms)
  const tg = cfg.targets[ms] || 0
  const bd = cfg.budgets[ms] || 0

  // Mailto link for Gmail draft
  const mailSubject = `Monthly Financial Report — ${formatDateDisplay(from)} to ${formatDateDisplay(to)}`
  const mailBody = `Hello,\n\nMy Hisaab financial report for ${from} to ${to} (${scope === 'all' ? 'Combined' : scope}) is ready.\n\nIncome: ${fmt(summary.income)}\nExpenses: ${fmt(summary.expenses)}\nNet Savings: ${fmt(summary.netSavings, true)}\nSavings Rate: ${summary.savingsRate}%\nTransactions: ${summary.txCount}\n\nPlease find the attached report PDF.\n`
  const mailLink = `mailto:${encodeURIComponent(cfg.email)}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`

  const handleExportCsv = () => {
    const csvContent = toCsv(periodTx, accounts)
    const filename = `hisaab-report-${from}-to-${to}.csv`
    downloadFile(filename, csvContent, 'text/csv')
  }

  return (
    <div className="reports-page">
      <div className="noprint">
        <header className="page-header">
          <div>
            <h1 className="page-title">Financial Reports</h1>
            <p className="page-subtitle">A considered, comprehensive view of where your money goes.</p>
          </div>

          <div className="header-actions">
            <button type="button" className="btn secondary" onClick={handleExportCsv}>
              <Download size={16} /> CSV
            </button>
            <a className="btn secondary" href={mailLink} target="_blank" rel="noopener noreferrer">
              <Mail size={16} /> Gmail draft
            </a>
            <button type="button" className="btn primary" onClick={() => window.print()}>
              <Printer size={16} /> Print or Save PDF
            </button>
          </div>
        </header>

        {/* Date Selector & Scope */}
        <div className="clay-card filter-panel">
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="rep-from" className="field-label small">
                From Date
              </label>
              <input
                id="rep-from"
                type="date"
                className="clay-input"
                value={from}
                onChange={e => setFrom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="rep-to" className="field-label small">
                To Date
              </label>
              <input
                id="rep-to"
                type="date"
                className="clay-input"
                value={to}
                onChange={e => setTo(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-presets-row" style={{ marginTop: '12px' }}>
            <span className="small muted">Presets:</span>
            <button type="button" className="chip-btn" onClick={() => setPreset('today')}>
              Today
            </button>
            <button type="button" className="chip-btn" onClick={() => setPreset('week')}>
              Last 7 Days
            </button>
            <button type="button" className="chip-btn" onClick={() => setPreset('thisMonth')}>
              This Month
            </button>
            <button type="button" className="chip-btn" onClick={() => setPreset('lastMonth')}>
              Last Month
            </button>
            <button type="button" className="chip-btn" onClick={() => setPreset('thisYear')}>
              This Year
            </button>

            <div className="scope-inline-wrap">
              <ScopeSelect value={scope} onChange={setScope} />
            </div>
          </div>
        </div>

        <p className="small muted" style={{ margin: '8px 4px 20px' }}>
          In the print preview window choose <b>“Save as PDF”</b>. Gmail drafts cannot auto-attach local files: open the draft, attach the saved PDF, and send.
          {!cfg.email && ' Set your Gmail address in Settings to pre-fill the recipient.'}
        </p>
      </div>

      {/* Printable Report Document Container */}
      <div className="report-document print-container">
        {/* Printable Header */}
        <div className="report-doc-header">
          <div className="report-branding">
            <div className="report-brand-mark">h.</div>
            <div>
              <h2 className="report-brand-name">Hisaab Financial Statement</h2>
              <span className="small muted">Private Local-First Finance Management</span>
            </div>
          </div>

          <div className="report-meta text-right">
            <b>{formatDateDisplay(from)} – {formatDateDisplay(to)}</b>
            <span className="small muted block">
              Generated {formatDateDisplay(td)} · {scope === 'all' ? 'Combined Scope' : `${scope} Scope`}
            </span>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="report-summary-cards-grid">
          <div className="clay-card report-metric-card">
            <span className="metric-title">Total Income</span>
            <b className="metric-val gain">+{fmt(summary.income)}</b>
            <span className="small muted">Qualifying inflows</span>
          </div>

          <div className="clay-card report-metric-card">
            <span className="metric-title">Total Expenses</span>
            <b className="metric-val loss">−{fmt(summary.expenses)}</b>
            <span className="small muted">Qualifying outflows</span>
          </div>

          <div className="clay-card report-metric-card">
            <span className="metric-title">Net Savings</span>
            <b className={`metric-val ${summary.netSavings >= 0 ? 'gain' : 'loss'}`}>
              {fmt(summary.netSavings, true)}
            </b>
            <span className="small muted">
              {summary.netSavings >= 0 ? 'Cash surplus' : 'Cash deficit'}
            </span>
          </div>

          <div className="clay-card report-metric-card">
            <span className="metric-title">Savings Rate</span>
            <b className={`metric-val ${summary.savingsRate >= 0 ? 'gain' : 'loss'}`}>
              {summary.income > 0 ? `${summary.savingsRate}%` : '—'}
            </b>
            <span className="small muted">Income retained</span>
          </div>
        </div>

        {/* Month-on-Month Comparison */}
        {prevSummary.txCount > 0 && (
          <div className="clay-card period-comparison-box noprint">
            <h3 className="section-subtitle">
              Comparison vs Previous {daysDiff} Days ({formatDateDisplay(prevFrom)} to {formatDateDisplay(prevTo)})
            </h3>
            <div className="comparison-metrics-grid">
              <div className="comp-item">
                <span className="small muted">Income Change</span>
                <b className={comparison.incomeDiff >= 0 ? 'gain' : 'loss'}>
                  {comparison.incomeDiff >= 0 ? '+' : ''}{fmt(comparison.incomeDiff)} ({comparison.incomePctChange}%)
                </b>
              </div>
              <div className="comp-item">
                <span className="small muted">Expense Change</span>
                <b className={comparison.expenseDiff <= 0 ? 'gain' : 'loss'}>
                  {comparison.expenseDiff >= 0 ? '+' : ''}{fmt(comparison.expenseDiff)} ({comparison.expensePctChange}%)
                </b>
              </div>
              <div className="comp-item">
                <span className="small muted">Net Savings Change</span>
                <b className={comparison.savingsDiff >= 0 ? 'gain' : 'loss'}>
                  {comparison.savingsDiff >= 0 ? '+' : ''}{fmt(comparison.savingsDiff)}
                </b>
              </div>
            </div>
          </div>
        )}

        {/* Target and Budget if full month */}
        {isFullMonth && (tg > 0 || bd > 0) && (
          <div className="clay-card month-target-eval-card">
            <div className="between">
              {tg > 0 && (
                <div>
                  <span className="small muted">Monthly Target ({fmt(tg)})</span>
                  <br />
                  <b>
                    {summary.netSavings >= tg
                      ? `Achieved (Surplus: ${fmt(summary.netSavings - tg)})`
                      : `Remaining: ${fmt(tg - summary.netSavings)}`}
                  </b>
                </div>
              )}
              {bd > 0 && (
                <div>
                  <span className="small muted">Spending Budget ({fmt(bd)})</span>
                  <br />
                  <b className={summary.expenses > bd ? 'loss' : 'gain'}>
                    {summary.expenses > bd
                      ? `Over budget by ${fmt(summary.expenses - bd)}`
                      : `${fmt(bd - summary.expenses)} left`}
                  </b>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expenses by Category Table */}
        <section className="report-table-section">
          <h3 className="report-section-title">Expenses by Category</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Category</th>
                <th className="text-center">Count</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {categoryTotals.length > 0 ? (
                categoryTotals.map(c => (
                  <tr key={c.category}>
                    <td><b>{c.category}</b></td>
                    <td className="text-center">{c.txCount}</td>
                    <td className="text-right loss">{fmt(c.amount)}</td>
                    <td className="text-right">{c.percentage}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center muted">No expenses recorded in this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Classification Breakdown (Personal / Business / Shared) */}
        <section className="report-table-section">
          <h3 className="report-section-title">Personal, Business and Shared Breakdown</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Classification</th>
                <th className="text-right">Income</th>
                <th className="text-right">Expenses</th>
                <th className="text-right">Net Flow</th>
              </tr>
            </thead>
            <tbody>
              {(['personal', 'business', 'shared'] as const).map(c => {
                const subset = periodTx.filter(x => x.cls === c)
                const inAmt = subset.filter(x => x.type === 'in').reduce((s, x) => s + x.amt, 0)
                const outAmt = subset.filter(x => x.type === 'out').reduce((s, x) => s + x.amt, 0)
                const netAmt = inAmt - outAmt
                return (
                  <tr key={c}>
                    <td style={{ textTransform: 'capitalize' }}><b>{c}</b></td>
                    <td className="text-right gain">+{fmt(inAmt)}</td>
                    <td className="text-right loss">−{fmt(outAmt)}</td>
                    <td className={`text-right ${netAmt >= 0 ? 'gain' : 'loss'}`}>
                      {fmt(netAmt, true)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        {/* All Transactions in this period */}
        <section className="report-table-section">
          <h3 className="report-section-title">Transaction Ledger ({periodTx.length})</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category & Details</th>
                <th>Method</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {periodTx.length > 0 ? (
                periodTx.map(x => (
                  <tr key={x.id}>
                    <td>{x.date}</td>
                    <td>
                      <b>{x.cat}</b> {x.note ? `· ${x.note}` : ''}
                      <span className="small muted block">{x.cls}</span>
                    </td>
                    <td>{x.method}</td>
                    <td className={`text-right ${x.type === 'in' ? 'gain' : x.type === 'transfer' ? '' : 'loss'}`}>
                      {x.type === 'in' ? '+' : x.type === 'transfer' ? '⇄ ' : '−'}
                      {fmt(x.amt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center muted">No transactions found in this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <p className="small muted report-footer-note">
          Hisaab Statement: Net cash flow represents income minus expenses recorded in this application. All data resides privately on your personal device.
        </p>
      </div>
    </div>
  )
}

export default Reports
