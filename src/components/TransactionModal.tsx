import React, { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { useStore } from '../store'
import { Category, Cls, Kind, Tx } from '../types'
import { CATEGORY_COLORS, METHODS } from '../lib/constants'
import { fmt, toP, toRupeeString, today } from '../lib/format'
import { findCategorySuggestion } from '../lib/suggestions'
import { Plus, Sparkles } from 'lucide-react'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  editTx?: Tx | null
  initialType?: Kind
  initialAccountId?: string
}

export function TransactionModal({
  isOpen,
  onClose,
  editTx,
  initialType = 'out',
  initialAccountId
}: TransactionModalProps) {
  const { tx, accounts, categories, saveTx, saveCategory } = useStore()

  const [type, setType] = useState<Kind>(editTx?.type || initialType)
  const [deductionMode, setDeductionMode] = useState(Boolean(editTx?.type === 'out' && /deduction/i.test(editTx?.cat || '')))
  const [amt, setAmt] = useState(editTx ? toRupeeString(editTx.amt) : '')
  const [cat, setCat] = useState(editTx?.cat || '')
  const [cls, setCls] = useState<Cls>(editTx?.cls || 'personal')
  const [method, setMethod] = useState(editTx?.method || 'UPI')
  const [date, setDate] = useState(editTx?.date || today())
  const [time, setTime] = useState(editTx?.time || '')
  const [note, setNote] = useState(editTx?.note || '')
  const [accountId, setAccountId] = useState(editTx?.accountId || initialAccountId || '')
  const [toAccountId, setToAccountId] = useState(editTx?.toAccountId || '')

  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Inline category creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  // Active accounts list
  const activeAccounts = accounts.filter(a => !a.isArchived)
  const expenseCategories = categories.filter(c => c.type === 'out')
  const incomeCategories = categories.filter(c => c.type === 'in')

  // Reset or initialize state when opening / switching editTx
  useEffect(() => {
    if (isOpen) {
      setErr('')
      setSubmitting(false)
      setIsAddingCategory(false)
      setNewCatName('')
      if (editTx) {
        setType(editTx.type)
        setDeductionMode(editTx.type === 'out' && /deduction/i.test(editTx.cat || ''))
        setAmt(toRupeeString(editTx.amt))
        setCat(editTx.cat)
        setCls(editTx.cls)
        setMethod(editTx.method)
        setDate(editTx.date)
        setTime(editTx.time || '')
        setNote(editTx.note)
        setAccountId(editTx.accountId || '')
        setToAccountId(editTx.toAccountId || '')
      } else {
        setType(initialType)
        setDeductionMode(false)
        setAmt('')
        setNote('')
        setDate(today())
        setTime('')
        setCls('personal')

        // Default account
        const defAcc = initialAccountId || (activeAccounts[0]?.id ?? '')
        setAccountId(defAcc)

        if (initialType === 'transfer') {
          setCat('Transfer')
          setMethod('Bank transfer')
          const dest = activeAccounts.find(a => a.id !== defAcc)?.id || ''
          setToAccountId(dest)
        } else if (initialType === 'in') {
          setCat(incomeCategories[0]?.name || 'Salary')
          setMethod('Bank transfer')
        } else {
          setCat(expenseCategories[0]?.name || 'Food and groceries')
          setMethod('UPI')
        }
      }
    }
  }, [isOpen, editTx, initialType, initialAccountId])

  // Local Category Suggestion check when user enters note
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

  const handleTypeChange = (newType: Kind) => {
    setType(newType)
    setDeductionMode(false)
    setErr('')
    setSuggestion(null)
    setIsAddingCategory(false)
    setNewCatName('')

    if (newType === 'transfer') {
      setCat('Transfer')
      setMethod('Bank transfer')
      if (!toAccountId && activeAccounts.length > 1) {
        const dest = activeAccounts.find(a => a.id !== accountId)?.id || ''
        setToAccountId(dest)
      }
    } else if (newType === 'in') {
      if (cat === 'Transfer' || !incomeCategories.some(c => c.name === cat)) {
        setCat(incomeCategories[0]?.name || 'Salary')
      }
    } else {
      if (cat === 'Transfer' || !expenseCategories.some(c => c.name === cat)) {
        setCat(expenseCategories[0]?.name || 'Food and groceries')
      }
    }
  }

  const chooseDeductions = () => {
    setType('out')
    setDeductionMode(true)
    setCat(expenseCategories.find(c => c.name.toLowerCase() === 'deductions')?.name || 'Deductions')
    setErr('')
    setSuggestion(null)
    setIsAddingCategory(false)
    setNewCatName('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const p = toP(amt)

    if (!p || p <= 0) {
      setErr('Enter an amount greater than zero.')
      return
    }
    if (!date) {
      setErr('Please choose a transaction date.')
      return
    }

    if (type === 'transfer') {
      if (!accountId) {
        setErr('Choose a source account (from).')
        return
      }
      if (!toAccountId) {
        setErr('Choose a destination account (to).')
        return
      }
      if (accountId === toAccountId) {
        setErr('Source and destination accounts must be different.')
        return
      }
    } else {
      if (!accountId) {
        setErr('Please select an account.')
        return
      }
      if (!cat) {
        setErr('Please select a category.')
        return
      }
    }

    try {
      setSubmitting(true)
      const record: Tx = {
        id: editTx?.id || crypto.randomUUID(),
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
        created: editTx?.created || Date.now(),
        modified: Date.now()
      }

      await saveTx(record)
      onClose()
    } catch (err: any) {
      console.error(err)
      setErr('Failed to save transaction. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const applySuggestion = () => {
    if (suggestion) {
      setCat(suggestion)
      setSuggestion(null)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editTx ? 'Edit Transaction' : 'Record Transaction'}
      subtitle="Track your financial activity with precision."
    >
      <form onSubmit={handleSubmit} className="tx-form">
        {deductionMode && <div className="notice-banner info" role="status">Deductions are recorded as money going out, so they reduce the selected account balance.</div>}
        {err && <div className="notice-banner error">{err}</div>}

        {/* Transaction Type Segment */}
        <div className="clay-segment" role="group" aria-label="Transaction type">
          <button
            type="button"
            className={`clay-seg-btn ${type === 'out' && !deductionMode ? 'active expense' : ''}`}
            onClick={() => handleTypeChange('out')}
          >
            Expense
          </button>
          <button
            type="button"
            className={`clay-seg-btn ${deductionMode ? 'active expense' : ''}`}
            onClick={chooseDeductions}
          >
            Deduction
          </button>
          <button
            type="button"
            className={`clay-seg-btn ${type === 'in' ? 'active income' : ''}`}
            onClick={() => handleTypeChange('in')}
          >
            Income
          </button>
          <button
            type="button"
            className={`clay-seg-btn ${type === 'transfer' ? 'active transfer' : ''}`}
            onClick={() => handleTypeChange('transfer')}
          >
            Transfer
          </button>
        </div>

        {/* Amount Input */}
        <div className="form-group amount-group">
          <label htmlFor="tx-amount" className="field-label">
            Amount (₹)
          </label>
          <div className="clay-amount-input-wrap">
            <span className="currency-prefix">₹</span>
            <input
              id="tx-amount"
              className="clay-input amount-input"
              inputMode="decimal"
              autoFocus
              placeholder="0"
              value={amt}
              onChange={e => setAmt(e.target.value)}
            />
          </div>
        </div>

        {/* Transfer Source & Destination */}
        {type === 'transfer' ? (
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="tx-from-acc" className="field-label">
                From Account (Source)
              </label>
              <select
                id="tx-from-acc"
                className="clay-select"
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
              >
                <option value="">Select account</option>
                {activeAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type === 'bank' ? 'Bank' : a.type === 'cash' ? 'Cash' : 'Other'})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="tx-to-acc" className="field-label">
                To Account (Destination)
              </label>
              <select
                id="tx-to-acc"
                className="clay-select"
                value={toAccountId}
                onChange={e => setToAccountId(e.target.value)}
              >
                <option value="">Select account</option>
                {activeAccounts.map(a => (
                  <option key={a.id} value={a.id} disabled={a.id === accountId}>
                    {a.name} ({a.type === 'bank' ? 'Bank' : a.type === 'cash' ? 'Cash' : 'Other'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* Normal In/Out Account and Category */
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="tx-acc" className="field-label">
                {type === 'in' ? 'Deposited To Account' : 'Paid From Account'}
              </label>
              <select
                id="tx-acc"
                className="clay-select"
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
              >
                <option value="">Select account</option>
                {activeAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type === 'bank' ? 'Bank' : a.type === 'cash' ? 'Cash' : 'Other'})
                  </option>
                ))}
              </select>
            </div>

            {isAddingCategory ? (
              <div className="form-group inline-new-cat-box">
                <div className="between">
                  <label htmlFor="tx-inline-cat" className="field-label small">
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
                    id="tx-inline-cat"
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
                  <label htmlFor="tx-cat" className="field-label">
                    {type === 'in' ? 'Income Source / Category' : 'Expense Category'}
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
                  id="tx-cat"
                  className="clay-select"
                  value={cat}
                  onChange={e => {
                    if (e.target.value === '__ADD_NEW__') {
                      setIsAddingCategory(true)
                      setNewCatName('')
                    } else {
                      setCat(e.target.value)
                    }
                  }}
                >
                  {(type === 'in' ? incomeCategories : expenseCategories).map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__ADD_NEW__">+ Add new category...</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Vendor Suggestion Banner */}
        {suggestion && (
          <div className="suggestion-chip" onClick={applySuggestion} role="button" tabIndex={0}>
            <Sparkles size={15} className="suggestion-icon" />
            <span>
              Suggest category: <b>{suggestion}</b> based on past entries
            </span>
            <button type="button" className="btn-chip-apply">
              Apply
            </button>
          </div>
        )}

        {/* Payment Method & Class (for non-transfer) */}
        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="tx-method" className="field-label">
              Payment Method
            </label>
            <select
              id="tx-method"
              className="clay-select"
              value={method}
              onChange={e => setMethod(e.target.value)}
            >
              {METHODS.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tx-cls" className="field-label">
              Classification
            </label>
            <select
              id="tx-cls"
              className="clay-select"
              value={cls}
              onChange={e => setCls(e.target.value as Cls)}
            >
              <option value="personal">Personal</option>
              <option value="business">Business</option>
              <option value="shared">Shared</option>
            </select>
          </div>
        </div>

        {/* Date and Time */}
        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="tx-date" className="field-label">
              Date
            </label>
            <input
              id="tx-date"
              type="date"
              className="clay-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tx-time" className="field-label">
              Time (Optional)
            </label>
            <input
              id="tx-time"
              type="time"
              className="clay-input"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
        </div>

        {/* Note / Payee / Description */}
        <div className="form-group">
          <label htmlFor="tx-note" className="field-label">
            Note / Description (Optional)
          </label>
          <input
            id="tx-note"
            className="clay-input"
            placeholder={type === 'transfer' ? 'ATM cash withdrawal, bank transfer...' : 'Vendor, grocery shop, lunch...'}
            maxLength={200}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Saving...' : editTx ? 'Update Transaction' : 'Save Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
