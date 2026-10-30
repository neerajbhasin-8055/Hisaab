import React, { useState } from 'react'
import { Download, Filter, RotateCcw, Search, X } from 'lucide-react'
import { useStore } from '../store'
import { TxRows, ScopeSelect } from '../components'
import {
  FilterOptions,
  Scope,
  calculatePeriodSummary,
  downloadFile,
  filterTransactions,
  fmt,
  monthEnd,
  newestFirst,
  toCsv,
  today
} from '../lib'
import { METHODS } from '../lib/constants'

export function History({
  edit,
  initialAccountId,
  initialCategory
}: {
  edit: (id: string) => void
  initialAccountId?: string
  initialCategory?: string
}) {
  const { tx, accounts, categories, delTx } = useStore()

  const [query, setQuery] = useState('')
  const [type, setType] = useState<string>('')
  const [scope, setScope] = useState<Scope>('all')
  const [accountId, setAccountId] = useState<string>(initialAccountId || '')
  const [categoryId, setCategoryId] = useState<string>(initialCategory || '')
  const [method, setMethod] = useState<string>('')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')

  const [showFilters, setShowFilters] = useState(
    Boolean(initialAccountId || initialCategory)
  )

  // Filter transactions using shared calculation utility
  const filterOpts: FilterOptions = {
    query,
    type,
    scope,
    accountId: accountId || undefined,
    categoryId: categoryId || undefined,
    method: method || undefined,
    from: from || undefined,
    to: to || undefined
  }

  const filtered = filterTransactions(tx, filterOpts).sort(newestFirst)
  const summary = calculatePeriodSummary(filtered, from, to, scope)

  const hasActiveFilters = Boolean(
    query || type || scope !== 'all' || accountId || categoryId || method || from || to
  )

  const clearAllFilters = () => {
    setQuery('')
    setType('')
    setScope('all')
    setAccountId('')
    setCategoryId('')
    setMethod('')
    setFrom('')
    setTo('')
  }

  // Quick date presets
  const setDatePreset = (preset: 'all' | 'today' | 'thisMonth' | 'lastMonth') => {
    const td = today()
    if (preset === 'all') {
      setFrom('')
      setTo('')
    } else if (preset === 'today') {
      setFrom(td)
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
    }
  }

  const handleExportCsv = () => {
    const csvContent = toCsv(filtered, accounts)
    const filename = `hisaab-transactions-${today()}${hasActiveFilters ? '-filtered' : ''}.csv`
    downloadFile(filename, csvContent, 'text/csv')
  }

  return (
    <div className="transactions-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Search, filter, and review your financial ledger.</p>
        </div>

        <button
          type="button"
          className="btn secondary filter-toggle-btn"
          onClick={() => setShowFilters(p => !p)}
        >
          <Filter size={16} />
          <span>Filters</span>
          {hasActiveFilters && <span className="filter-active-dot" />}
        </button>
      </header>

      {/* Search Input */}
      <div className="search-bar-clay">
        <Search size={18} className="search-icon" />
        <input
          type="search"
          className="search-input"
          placeholder="Search by note, category, or payment method..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="icon-btn search-clear-btn"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Drawer / Panel */}
      {showFilters && (
        <div className="clay-card filter-panel">
          <div className="between filter-panel-head">
            <b>Filter Criteria</b>
            {hasActiveFilters && (
              <button type="button" className="link-btn small" onClick={clearAllFilters}>
                <RotateCcw size={13} /> Reset all filters
              </button>
            )}
          </div>

          <div className="filter-grid">
            <div className="form-group">
              <label htmlFor="filter-type" className="field-label small">
                Type
              </label>
              <select
                id="filter-type"
                className="clay-select small"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="out">Expenses</option>
                <option value="in">Income</option>
                <option value="transfer">Transfers</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="filter-acc" className="field-label small">
                Account
              </label>
              <select
                id="filter-acc"
                className="clay-select small"
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
              >
                <option value="">All Accounts</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type === 'bank' ? 'Bank' : 'Cash'})
                  </option>
                ))}
                <option value="unassigned">Legacy Unassigned</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="filter-cat" className="field-label small">
                Category
              </label>
              <select
                id="filter-cat"
                className="clay-select small"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.type === 'in' ? 'In' : 'Out'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="filter-method" className="field-label small">
                Payment Method
              </label>
              <select
                id="filter-method"
                className="clay-select small"
                value={method}
                onChange={e => setMethod(e.target.value)}
              >
                <option value="">All Methods</option>
                {METHODS.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="filter-from" className="field-label small">
                From Date
              </label>
              <input
                id="filter-from"
                type="date"
                className="clay-input small"
                value={from}
                onChange={e => setFrom(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="filter-to" className="field-label small">
                To Date
              </label>
              <input
                id="filter-to"
                type="date"
                className="clay-input small"
                value={to}
                onChange={e => setTo(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-presets-row">
            <span className="small muted">Date presets:</span>
            <button type="button" className="chip-btn" onClick={() => setDatePreset('all')}>
              All Time
            </button>
            <button type="button" className="chip-btn" onClick={() => setDatePreset('today')}>
              Today
            </button>
            <button type="button" className="chip-btn" onClick={() => setDatePreset('thisMonth')}>
              This Month
            </button>
            <button type="button" className="chip-btn" onClick={() => setDatePreset('lastMonth')}>
              Last Month
            </button>
            <div className="scope-inline-wrap">
              <ScopeSelect value={scope} onChange={setScope} />
            </div>
          </div>
        </div>
      )}

      {/* Filtered Summary Bar */}
      <div className="clay-card filtered-summary-bar">
        <div className="filtered-metric">
          <span className="filtered-metric-label">Results</span>
          <b>{filtered.length}</b>
        </div>
        <div className="filtered-metric">
          <span className="filtered-metric-label">Income</span>
          <b className="gain">+{fmt(summary.income)}</b>
        </div>
        <div className="filtered-metric">
          <span className="filtered-metric-label">Expenses</span>
          <b className="loss">−{fmt(summary.expenses)}</b>
        </div>
        <div className="filtered-metric">
          <span className="filtered-metric-label">Net</span>
          <b className={summary.netSavings >= 0 ? 'gain' : 'loss'}>
            {fmt(summary.netSavings, true)}
          </b>
        </div>
      </div>

      {/* Transactions List */}
      <div className="clay-card tx-history-container">
        <TxRows
          items={filtered.slice(0, 300)}
          onEdit={edit}
          onDelete={id => {
            if (confirm('Delete this transaction? This cannot be undone.')) {
              delTx(id)
            }
          }}
        />
        {filtered.length > 300 && (
          <p className="muted small text-center pagination-note">
            Showing first 300 of {filtered.length} transactions. Export CSV to view the entire list.
          </p>
        )}
      </div>

      {/* CSV Export Button */}
      <div className="table-footer-actions">
        <button type="button" className="btn secondary" onClick={handleExportCsv}>
          <Download size={16} /> Download CSV ({filtered.length} records)
        </button>
      </div>
    </div>
  )
}

export default History
