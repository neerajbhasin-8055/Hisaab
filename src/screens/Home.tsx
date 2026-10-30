import React, { useState } from 'react'
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  Building,
  Coins
} from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useStore } from '../store'
import { TxRows, ScopeSelect, UnassignedTransactionsBanner } from '../components'
import {
  Scope,
  addDays,
  addMonths,
  calculateBankBalance,
  calculateCashBalance,
  calculateCategoryTotals,
  calculatePeriodSummary,
  calculateTotalBalance,
  fmt,
  inScope,
  monthName,
  newestFirst,
  today
} from '../lib'

interface HomeProps {
  go: (tab: string, extra?: string) => void
  onOpenAddTx: (initialType?: 'in' | 'out' | 'transfer', accountId?: string) => void
  onEditTx: (id: string) => void
}

export function Home({ go, onOpenAddTx, onEditTx }: HomeProps) {
  const { tx, accounts, cfg, delTx } = useStore()
  const [month, setMonth] = useState(today().slice(0, 7))
  const [scope, setScope] = useState<Scope>('all')

  const td = today()
  const prevMonth = addMonths(td.slice(0, 7), -1)

  // Account balances
  const totalBalance = calculateTotalBalance(accounts, tx)
  const bankBalance = calculateBankBalance(accounts, tx)
  const cashBalance = calculateCashBalance(accounts, tx)

  // Scope & Month transactions
  const monthStart = `${month}-01`
  const monthEndStr = `${month}-31`
  const scopedTx = inScope(tx, scope)
  const monthSummary = calculatePeriodSummary(scopedTx, monthStart, monthEndStr, scope)

  const inc = monthSummary.income
  const ex = monthSummary.expenses
  const net = monthSummary.netSavings
  const savingsRate = monthSummary.savingsRate

  const tg = cfg.targets[month] || 0
  const bd = cfg.budgets[month] || 0
  const targetPct = tg > 0 ? Math.max(0, Math.round((net / tg) * 100)) : 0
  const targetStatus = tg <= 0 ? 'No target set' : net > tg ? 'Exceeded' : net === tg ? 'Achieved' : 'In progress'

  // Today & 7 days spend
  const todaySpend = scopedTx
    .filter(x => x.date === td && x.type === 'out')
    .reduce((s, x) => s + x.amt, 0)

  const sevenDaysSpend = scopedTx
    .filter(x => x.date >= addDays(td, -6) && x.date <= td && x.type === 'out')
    .reduce((s, x) => s + x.amt, 0)

  // Category breakdown
  const monthExpenses = scopedTx.filter(x => x.date.startsWith(month))
  const categoryTotals = calculateCategoryTotals(monthExpenses, 'out')

  // Trend chart for 6 months
  const trend = [5, 4, 3, 2, 1, 0].map(i => {
    const m = addMonths(td.slice(0, 7), -i)
    const summary = calculatePeriodSummary(scopedTx, `${m}-01`, `${m}-31`, scope)
    return {
      m: m.slice(5),
      Income: summary.income / 100,
      Expenses: summary.expenses / 100
    }
  })

  // Backup notification
  const needBackup =
    tx.length > 0 &&
    (!cfg.lastBackup || Date.now() - new Date(cfg.lastBackup).getTime() > 30 * 864e5)

  return (
    <div className="overview-page">
      {/* Top Header */}
      <header className="page-header">
        <div className="brand-lockup">
          <div className="brand-mark">h.</div>
          <div>
            <h1 className="brand-title">Hisaab</h1>
            <p className="page-subtitle">A clearer view of your money.</p>
          </div>
        </div>

        <div className="header-actions">
          <ScopeSelect value={scope} onChange={setScope} />
        </div>
      </header>

      {/* Month Stepper */}
      <div className="month-stepper-clay">
        <button
          type="button"
          className="stepper-arrow-btn"
          aria-label="Previous month"
          onClick={() => setMonth(addMonths(month, -1))}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="stepper-center">
          <span className="stepper-month-name">{monthName(month)}</span>
          {month === td.slice(0, 7) && <span className="stepper-current-badge">Current</span>}
        </div>
        <button
          type="button"
          className="stepper-arrow-btn"
          aria-label="Next month"
          onClick={() => setMonth(addMonths(month, 1))}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Unassigned Transactions Banner (for migrated data) */}
      <UnassignedTransactionsBanner />

      {/* Notifications */}
      {tx.some(x => x.date.startsWith(prevMonth)) && month === td.slice(0, 7) && (
        <div className="notice-banner clay-notice">
          <span>Last month’s report is ready to review.</span>
          <button type="button" className="link-btn" onClick={() => go('reports', prevMonth)}>
            Open report
          </button>
        </div>
      )}

      {needBackup && (
        <div className="notice-banner clay-notice warning">
          <span>Your financial records live only on this device.</span>
          <button type="button" className="link-btn" onClick={() => go('settings')}>
            Back up now
          </button>
        </div>
      )}

      {/* Interactive Account Balance Summary Cards (Feature Two: Master Prompt Section 7) */}
      <div className="balance-cards-grid">
        <div
          className="clay-card balance-card interactive"
          onClick={() => go('accounts')}
          role="button"
          tabIndex={0}
        >
          <div className="balance-card-head">
            <span className="balance-card-label">Total Balance</span>
            <div className="balance-icon-wrap total">
              <Wallet size={18} />
            </div>
          </div>
          <div className="balance-card-amount">{fmt(totalBalance)}</div>
          <span className="balance-card-sub">Combined active accounts</span>
        </div>

        <div
          className="clay-card balance-card interactive"
          onClick={() => go('accounts', 'bank')}
          role="button"
          tabIndex={0}
        >
          <div className="balance-card-head">
            <span className="balance-card-label">Bank Balance</span>
            <div className="balance-icon-wrap bank">
              <Building size={18} />
            </div>
          </div>
          <div className="balance-card-amount">{fmt(bankBalance)}</div>
          <span className="balance-card-sub">All active bank accounts</span>
        </div>

        <div
          className="clay-card balance-card interactive"
          onClick={() => go('accounts', 'cash')}
          role="button"
          tabIndex={0}
        >
          <div className="balance-card-head">
            <span className="balance-card-label">Cash in Hand</span>
            <div className="balance-icon-wrap cash">
              <Coins size={18} />
            </div>
          </div>
          <div className="balance-card-amount">{fmt(cashBalance)}</div>
          <span className="balance-card-sub">Cash wallet balances</span>
        </div>
      </div>

      {/* Monthly Net Cash Flow Hero Card */}
      <section className="clay-card hero-cashflow-card">
        <div className="hero-top-label">Monthly Net Cash Flow</div>
        <div className={`hero-net-amount ${net < 0 ? 'loss' : 'gain'}`}>
          {fmt(net, true)}
        </div>
        <div className="hero-subtext">
          {net >= 0 ? 'Net savings surplus' : 'Net spending deficit'} · {monthName(month)}
        </div>

        {tg > 0 ? (
          <div className="hero-target-section">
            <div className="clay-progress-track">
              <div
                className="clay-progress-fill"
                style={{ width: `${Math.min(100, targetPct)}%` }}
              />
            </div>
            <div className="hero-target-foot">
              <span>
                {targetPct}% of target {fmt(tg)} · <b>{targetStatus}</b>
              </span>
              <span>
                {net >= tg ? `Surplus: ${fmt(net - tg)}` : `Remaining: ${fmt(tg - net)}`}
              </span>
            </div>
          </div>
        ) : (
          <div className="hero-target-prompt">
            <span className="small muted">
              Tip: Set a monthly savings target in Settings or Savings Goals to track progress.
            </span>
          </div>
        )}
      </section>

      {/* Primary Quick Actions */}
      <div className="quick-actions-row">
        <button
          type="button"
          className="btn primary flex-1"
          onClick={() => onOpenAddTx('out')}
        >
          <Plus size={18} /> Add Transaction
        </button>
        <button
          type="button"
          className="btn secondary flex-1"
          onClick={() => onOpenAddTx('transfer')}
        >
          <ArrowRightLeft size={16} /> Transfer Money
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-dashboard-grid">
        <div className="clay-card metric-card">
          <div className="metric-head">
            <TrendingUp size={16} className="gain" />
            <span className="metric-title">Money in</span>
          </div>
          <b className="metric-val gain">{fmt(inc)}</b>
          <span className="metric-sub">{monthName(month)}</span>
        </div>

        <div className="clay-card metric-card">
          <div className="metric-head">
            <TrendingDown size={16} className="loss" />
            <span className="metric-title">Money out</span>
          </div>
          <b className="metric-val loss">{fmt(ex)}</b>
          <span className="metric-sub">{monthName(month)}</span>
        </div>

        <div className="clay-card metric-card">
          <div className="metric-head">
            <span className="metric-title">Savings Rate</span>
          </div>
          <b className={`metric-val ${savingsRate >= 0 ? 'gain' : 'loss'}`}>
            {inc > 0 ? `${savingsRate}%` : '—'}
          </b>
          <span className="metric-sub">
            {net >= 0 ? 'Retained from income' : 'Deficit'}
          </span>
        </div>

        <div className="clay-card metric-card">
          <div className="metric-head">
            <span className="metric-title">Today's spend</span>
          </div>
          <b className="metric-val">{fmt(todaySpend)}</b>
          <span className="metric-sub">7-day: {fmt(sevenDaysSpend)}</span>
        </div>
      </div>

      {/* Overall Budget Progress Card */}
      {bd > 0 && (
        <div className="clay-card budget-status-card">
          <div className="between">
            <span className="field-label">Monthly Spending Budget</span>
            <b className={ex > bd ? 'loss' : 'gain'}>
              {ex > bd ? `Over budget by ${fmt(ex - bd)}` : `${fmt(bd - ex)} remaining`}
            </b>
          </div>
          <div className={`clay-progress-track ${ex > bd ? 'danger' : ''}`}>
            <div
              className={`clay-progress-fill ${ex > bd ? 'danger' : ''}`}
              style={{ width: `${Math.min(100, Math.round((ex / bd) * 100))}%` }}
            />
          </div>
          <div className="between small muted">
            <span>Spent: {fmt(ex)}</span>
            <span>Limit: {fmt(bd)}</span>
          </div>
        </div>
      )}

      {/* Spending by Category */}
      <section className="section-container">
        <div className="section-head">
          <h2 className="section-heading">Spending by category</h2>
          <span className="small muted">{monthName(month)}</span>
        </div>

        <div className="clay-card">
          {categoryTotals.length > 0 ? (
            <div className="category-bars-list">
              {categoryTotals.slice(0, 6).map(c => (
                <div key={c.category} className="category-bar-row">
                  <div className="between category-bar-head">
                    <span className="category-name">{c.category}</span>
                    <b className="category-amount">{fmt(c.amount)}</b>
                  </div>
                  <div className="clay-progress-track">
                    <div
                      className="clay-progress-fill"
                      style={{
                        width: `${c.percentage}%`
                      }}
                    />
                  </div>
                </div>
              ))}
              {categoryTotals.length > 6 && (
                <button
                  type="button"
                  className="link-btn small text-center wide-link"
                  onClick={() => go('reports')}
                >
                  View all {categoryTotals.length} categories in Reports
                </button>
              )}
            </div>
          ) : (
            <p className="empty-notice muted">
              No expenses recorded in {monthName(month)} yet. Tap “Add Transaction” to start.
            </p>
          )}
        </div>
      </section>

      {/* 6-Month Cash Flow Trend */}
      <section className="section-container">
        <div className="section-head">
          <h2 className="section-heading">Cash flow trend</h2>
          <span className="small muted">Last 6 months</span>
        </div>

        <div className="clay-card chart-card">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <Tooltip
                formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`}
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-clay)'
                }}
              />
              <Bar dataKey="Income" fill="#3B6E57" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Expenses" fill="#BD6656" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="section-container">
        <div className="section-head">
          <h2 className="section-heading">Recent activity</h2>
          <button type="button" className="link-btn" onClick={() => go('history')}>
            View all
          </button>
        </div>

        <div className="clay-card">
          <TxRows
            items={[...scopedTx].sort(newestFirst).slice(0, 5)}
            onEdit={onEditTx}
            onDelete={id => {
              if (confirm('Delete this transaction? This cannot be undone.')) {
                delTx(id)
              }
            }}
          />
        </div>
      </section>

      <p className="footer-disclaimer">
        Savings here means cash in minus cash out recorded in Hisaab. All calculations run locally on your device.
      </p>
    </div>
  )
}

export default Home
