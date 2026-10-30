import React, { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { useStore } from '../store'
import { Account, AccountType } from '../types'
import { toP, toRupeeString, today } from '../lib/format'

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
  editAccount?: Account | null
}

export function AccountModal({ isOpen, onClose, editAccount }: AccountModalProps) {
  const { saveAccount } = useStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('bank')
  const [openingBalance, setOpeningBalance] = useState('')
  const [openingDate, setOpeningDate] = useState(today())
  const [err, setErr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setErr('')
      setSubmitting(false)
      if (editAccount) {
        setName(editAccount.name)
        setType(editAccount.type)
        setOpeningBalance(toRupeeString(editAccount.openingBalance))
        setOpeningDate(editAccount.openingDate || today())
      } else {
        setName('')
        setType('bank')
        setOpeningBalance('0')
        setOpeningDate(today())
      }
    }
  }, [isOpen, editAccount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErr('Please enter an account name.')
      return
    }

    const bal = toP(openingBalance)
    if (bal < 0) {
      setErr('Opening balance cannot be negative.')
      return
    }

    try {
      setSubmitting(true)
      const acc: Account = {
        id: editAccount?.id || crypto.randomUUID(),
        name: name.trim(),
        type,
        openingBalance: bal,
        openingDate,
        isArchived: editAccount?.isArchived || false,
        created: editAccount?.created || Date.now(),
        modified: Date.now()
      }

      await saveAccount(acc)
      onClose()
    } catch (error) {
      console.error(error)
      setErr('Failed to save account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editAccount ? 'Edit Account' : 'Add New Account'}
      subtitle="Track your money across bank accounts and cash wallets."
    >
      <form onSubmit={handleSubmit} className="account-form">
        {err && <div className="notice-banner error">{err}</div>}

        <div className="form-group">
          <label htmlFor="acc-name" className="field-label">
            Account Name
          </label>
          <input
            id="acc-name"
            className="clay-input"
            placeholder="e.g. HDFC Bank, SBI Savings, Cash Wallet"
            maxLength={60}
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="acc-type" className="field-label">
            Account Type
          </label>
          <select
            id="acc-type"
            className="clay-select"
            value={type}
            onChange={e => setType(e.target.value as AccountType)}
          >
            <option value="bank">Bank Account</option>
            <option value="cash">Cash Wallet</option>
            <option value="other">Other Asset Account</option>
          </select>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="acc-op-bal" className="field-label">
              Opening Balance (₹)
            </label>
            <input
              id="acc-op-bal"
              className="clay-input"
              inputMode="decimal"
              placeholder="0"
              value={openingBalance}
              onChange={e => setOpeningBalance(e.target.value)}
            />
            <span className="field-hint">Baseline balance on opening date</span>
          </div>

          <div className="form-group">
            <label htmlFor="acc-op-date" className="field-label">
              Baseline Date
            </label>
            <input
              id="acc-op-date"
              type="date"
              className="clay-input"
              value={openingDate}
              onChange={e => setOpeningDate(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Saving...' : editAccount ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
