import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Category, Cls, Kind, Tx } from '../types'
import { CATEGORY_COLORS, METHODS } from '../lib/constants'
import { fmt, toP, toRupeeString, today } from '../lib/format'
import { findCategorySuggestion } from '../lib/suggestions'
import { Sparkles } from 'lucide-react'

export function Add({ editId, done }: { editId: string | null; done: () => void }) {
  const { tx, accounts, categories, saveTx, saveCategory } = useStore()
  const e = tx.find(x => x.id === editId)

  const activeAccounts = accounts.filter(a => !a.isArchived)
  const expenseCategories = categories.filter(c => c.type === 'out')
  const incomeCategories = categories.filter(c => c.type === 'in')

  const [type, setType] = useState<Kind>(e?.type || 'out')
  const [amt, setAmt] = useState(e ? toRupeeString(e.amt) : '')
  const [cat, setCat] = useState(e?.cat || expenseCategories[0]?.name || 'Food and groceries')
  const [cls, setCls] = useState<Cls>(e?.cls || 'personal')
  const [method, setMethod] = useState(e?.method || 'UPI')
  const [date, setDate] = useState(e?.date || today())
  const [time, setTime] = useState(e?.time || '')
  const [note, setNote] = useState(e?.note || '')
  const [accountId, setAccountId] = useState(e?.accountId || activeAccounts[0]?.id || '')
  const [toAccountId, setToAccountId] = useState(e?.toAccountId || '')

  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Inline category creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  useEffect(() => {
    if (type !== 'transfer' && note.trim().length >= 2) {
      const suggested = findCategorySuggestion(note, tx, type)
      if (suggested && suggested !== cat) {
        setSuggestion(suggested)
        return
      }
    }
    setSuggestion(null)
  }, [note, type, cat, tx])

  const flip = (t: Kind) => {
    setType(t)
    setErr('')
    setSuggestion(null)
    setIsAddingCategory(false)
    setNewCatName('')
    if (t === 'transfer') {
      setCat('Transfer')
      setMethod('Bank transfer')
      if (!toAccountId && activeAccounts.length > 1) {
        const dest = activeAccounts.find(a => a.id !== accountId)?.id || ''
        setToAccountId(dest)
      }
    } else if (t === 'in') {
      setCat(incomeCategories[0]?.name || 'Salary')
    } else {
      setCat(expenseCategories[0]?.name || 'Food and groceries')
    }
  }

  const handleCreateInlineCategory = async () => {
    const trimmed = newCatName.trim()
    if (!trimmed) {
      setIsAddingCategory(false)
      return
    }

    const targetType = type === 'in' ? 'in' : 'out'
    const existing = categories.find(
      c => c.type === targetType && c.name.toLowerCase() === trimmed.toLowerCase()
    )

    if (existing) {
      setCat(existing.name)
      setIsAddingCategory(false)
      setNewCatName('')
      return
    }

    const newCatRecord: Category = {
      id: crypto.randomUUID(),
      name: trimmed,
      type: targetType,
      icon: targetType === 'in' ? 'Wallet' : 'ShoppingBag',
      color: CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)],
      isSystem: false,
      created: Date.now(),
      modified: Date.now()
    }

    await saveCategory(newCatRecord)
    setCat(trimmed)
    setIsAddingCategory(false)
    setNewCatName('')
  }

  const applySuggestion = () => {
    if (suggestion) {
      setCat(suggestion)
      setSuggestion(null)
    }
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const p = toP(amt)
    if (!p) return setErr('Enter an amount greater than zero.')
    if (!date) return setErr('Choose a date.')

    if (type === 'transfer') {
      if (!accountId) return setErr('Choose a source account.')
      if (!toAccountId) return setErr('Choose a destination account.')
      if (accountId === toAccountId) return setErr('Source and destination accounts must be different.')
    } else {
      if (!accountId) return setErr('Please select an account.')
    }

    try {
      setSubmitting(true)
      const rec: Tx = {
        ...(e ?? { id: crypto.randomUUID(), created: Date.now() }),
        type,
        amt: p,
        cat: type === 'transfer' ? 'Transfer' : cat,
        cls,
        method,
        date,
        time: time || undefined,
        note: note.trim(),
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        modified: Date.now()
      }

      await saveTx(rec)
      setErr('')
      if (e) return done()

      setMsg(`Saved ${fmt(p)}. Add another, or return back.`)
      setAmt('')
      setNote('')
    } catch (error) {
      console.error(error)
      setErr('Failed to save transaction.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="add-screen-container">
      <form onSubmit={submit} className="clay-card add-screen-form">
        <h1 className="page-title">{e ? 'Edit Transaction' : 'Record Transaction'}</h1>
        <p className="page-subtitle">A small entry today makes your money clearer tomorrow.</p>

        {msg && <div className="notice-banner success" role="status">{msg}</div>}
        {err && <div className="notice-banner error" role="alert">{err}</div>}

        <div className="clay-segment" role="group">
          <button type="button" className={`clay-seg-btn ${type === 'out' ? 'active expense' : ''}`} onClick={() => flip('out')}>
            Expense
          </button>
          <button type="button" className={`clay-seg-btn ${type === 'in' ? 'active income' : ''}`} onClick={() => flip('in')}>
            Income
          </button>
          <button type="button" className={`clay-seg-btn ${type === 'transfer' ? 'active transfer' : ''}`} onClick={() => flip('transfer')}>
            Transfer
          </button>
        </div>

        <div className="form-group amount-group">
          <label htmlFor="screen-amt" className="field-label">Amount (₹)</label>
          <div className="clay-amount-input-wrap">
            <span className="currency-prefix">₹</span>
            <input
              id="screen-amt"
              className="clay-input amount-input"
              inputMode="decimal"
              autoFocus
              placeholder="0"
              value={amt}
              onChange={x => setAmt(x.target.value)}
            />
          </div>
        </div>

        {type === 'transfer' ? (
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="screen-from-acc" className="field-label">From Account</label>
              <select id="screen-from-acc" className="clay-select" value={accountId} onChange={x => setAccountId(x.target.value)}>
                {activeAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="screen-to-acc" className="field-label">To Account</label>
              <select id="screen-to-acc" className="clay-select" value={toAccountId} onChange={x => setToAccountId(x.target.value)}>
                {activeAccounts.map(a => (
                  <option key={a.id} value={a.id} disabled={a.id === accountId}>{a.name} ({a.type})</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="screen-acc" className="field-label">
                {type === 'in' ? 'Destination Account' : 'Source Account'}
              </label>
              <select id="screen-acc" className="clay-select" value={accountId} onChange={x => setAccountId(x.target.value)}>
                {activeAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
              </select>
            </div>

            {isAddingCategory ? (
              <div className="form-group inline-new-cat-box">
                <div className="between">
                  <label htmlFor="screen-inline-cat" className="field-label small">
                    New {type === 'in' ? 'Income' : 'Expense'} Category
                  </label>
                  <button
                    type="button"
                    className="link-btn small"
                    onClick={() => {
                      setIsAddingCategory(false)
                      setNewCatName('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
                <div className="inline-add-cat-row">
                  <input
                    id="screen-inline-cat"
                    type="text"
                    className="clay-input inline-cat-input"
                    placeholder={`e.g. ${type === 'in' ? 'Freelance, Bonus' : 'Groceries, Gym, Fuel'}`}
                    value={newCatName}
                    autoFocus
                    onChange={e => setNewCatName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCreateInlineCategory()
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn primary small inline-cat-btn"
                    onClick={handleCreateInlineCategory}
                  >
                    Add & Select
                  </button>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <div className="between">
                  <label htmlFor="screen-cat" className="field-label">
                    {type === 'in' ? 'Income Category' : 'Expense Category'}
                  </label>
                  <button
                    type="button"
                    className="link-btn small"
                    onClick={() => {
                      setIsAddingCategory(true)
                      setNewCatName('')
                    }}
                  >
                    + New
                  </button>
                </div>
                <select
                  id="screen-cat"
                  className="clay-select"
                  value={cat}
                  onChange={x => {
                    if (x.target.value === '__ADD_NEW__') {
                      setIsAddingCategory(true)
                      setNewCatName('')
                    } else {
                      setCat(x.target.value)
                    }
                  }}
                >
                  {(type === 'in' ? incomeCategories : expenseCategories).map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  <option value="__ADD_NEW__">+ Add new category...</option>
                </select>
              </div>
            )}
          </div>
        )}

        {suggestion && (
          <div className="suggestion-chip" onClick={applySuggestion} role="button" tabIndex={0}>
            <Sparkles size={15} />
            <span>Suggest category: <b>{suggestion}</b></span>
            <button type="button" className="btn-chip-apply">Apply</button>
          </div>
        )}

        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="screen-method" className="field-label">Payment Method</label>
            <select id="screen-method" className="clay-select" value={method} onChange={x => setMethod(x.target.value)}>
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="screen-cls" className="field-label">Classification</label>
            <select id="screen-cls" className="clay-select" value={cls} onChange={x => setCls(x.target.value as Cls)}>
              <option value="personal">Personal</option>
              <option value="business">Business</option>
              <option value="shared">Shared</option>
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="screen-date" className="field-label">Date</label>
            <input id="screen-date" type="date" className="clay-input" value={date} onChange={x => setDate(x.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="screen-time" className="field-label">Time</label>
            <input id="screen-time" type="time" className="clay-input" value={time} onChange={x => setTime(x.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="screen-note" className="field-label">Note (optional)</label>
          <input
            id="screen-note"
            className="clay-input"
            maxLength={200}
            placeholder="Vendor, description, or memo"
            value={note}
            onChange={x => setNote(x.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={done}>
            {e ? 'Cancel' : 'Back to Home'}
          </button>
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Transaction'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Add
