import React, { useState } from 'react'
import {
  Archive,
  ArrowRightLeft,
  Building,
  Coins,
  Edit2,
  Plus,
  Trash2,
  Wallet
} from 'lucide-react'
import { useStore } from '../store'
import { Account, AccountType } from '../types'
import {
  calculateAccountBalance,
  calculateBankBalance,
  calculateCashBalance,
  calculateTotalBalance,
  fmt,
  formatDateDisplay
} from '../lib'
import { AccountModal } from '../components/AccountModal'

interface AccountsProps {
  initialTab?: 'all' | 'bank' | 'cash'
  onOpenTransfer: (sourceAccountId?: string) => void
  onViewAccountTransactions: (accountId: string) => void
}

export function Accounts({
  initialTab = 'all',
  onOpenTransfer,
  onViewAccountTransactions
}: AccountsProps) {
  const { accounts, tx, archiveAccount, deleteAccount } = useStore()
  const [tab, setTab] = useState<'all' | 'bank' | 'cash'>(initialTab)
  const [showArchived, setShowArchived] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deleteNotice, setDeleteNotice] = useState<string>('')

  // Balance calculations
  const totalBalance = calculateTotalBalance(accounts, tx, showArchived)
  const bankBalance = calculateBankBalance(accounts, tx)
  const cashBalance = calculateCashBalance(accounts, tx)

  // Filter accounts by tab
  const displayedAccounts = accounts.filter(a => {
    if (!showArchived && a.isArchived) return false
    if (tab === 'bank') return a.type === 'bank'
    if (tab === 'cash') return a.type === 'cash'
    return true
  })

  const handleDelete = async (acc: Account) => {
    setDeleteNotice('')
    const res = await deleteAccount(acc.id)
    if (!res.success) {
      setDeleteNotice(res.message || 'Cannot delete account with existing transactions.')
    }
  }

  return (
    <div className="accounts-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Accounts & Cash</h1>
          <p className="page-subtitle">Track your money across bank accounts and cash wallets.</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn secondary"
            onClick={() => onOpenTransfer()}
          >
            <ArrowRightLeft size={16} /> Transfer
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus size={16} /> Add Account
          </button>
        </div>
      </header>

      {/* Delete / Notice Banner */}
      {deleteNotice && (
        <div className="notice-banner warning">
          <span>{deleteNotice}</span>
          <button
            type="button"
            className="link-btn small"
            onClick={() => setDeleteNotice('')}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Row */}
      <div className="balance-cards-grid">
        <div className="clay-card balance-card">
          <div className="balance-card-head">
            <span className="balance-card-label">Total Balance</span>
            <div className="balance-icon-wrap total">
              <Wallet size={18} />
            </div>
          </div>
          <div className="balance-card-amount">{fmt(totalBalance)}</div>
          <span className="balance-card-sub">Active tracked accounts</span>
        </div>

        <div className="clay-card balance-card">
          <div className="balance-card-head">
            <span className="balance-card-label">Bank Accounts</span>
            <div className="balance-icon-wrap bank">
              <Building size={18} />
            </div>
          </div>
          <div className="balance-card-amount">{fmt(bankBalance)}</div>
          <span className="balance-card-sub">Combined bank balance</span>
        </div>

        <div className="clay-card balance-card">
          <div className="balance-card-head">
            <span className="balance-card-label">Cash in Hand</span>
            <div className="balance-icon-wrap cash">
              <Coins size={18} />
            </div>
          </div>
          <div className="balance-card-amount">{fmt(cashBalance)}</div>
          <span className="balance-card-sub">Total physical cash</span>
        </div>
      </div>

      {/* Tab Switcher & Archive Toggle */}
      <div className="between tab-and-toggle-row">
        <div className="clay-segment" role="group" aria-label="Account views">
          <button
            type="button"
            className={`clay-seg-btn ${tab === 'all' ? 'active' : ''}`}
            onClick={() => setTab('all')}
          >
            All Accounts
          </button>
          <button
            type="button"
            className={`clay-seg-btn ${tab === 'bank' ? 'active' : ''}`}
            onClick={() => setTab('bank')}
          >
            Banks
          </button>
          <button
            type="button"
            className={`clay-seg-btn ${tab === 'cash' ? 'active' : ''}`}
            onClick={() => setTab('cash')}
          >
            Cash Wallets
          </button>
        </div>

        <label className="toggle-label small">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={e => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
      </div>

      {/* Accounts List */}
      <div className="account-cards-list">
        {displayedAccounts.length > 0 ? (
          displayedAccounts.map(acc => {
            const currentBal = calculateAccountBalance(acc, tx)
            const accTxCount = tx.filter(
              t => t.accountId === acc.id || t.toAccountId === acc.id
            ).length

            return (
              <div
                key={acc.id}
                className={`clay-card account-card-item ${acc.isArchived ? 'archived' : ''}`}
              >
                <div className="account-card-main">
                  <div className="account-icon-block">
                    {acc.type === 'bank' ? (
                      <Building size={24} className="acc-type-icon bank" />
                    ) : (
                      <Coins size={24} className="acc-type-icon cash" />
                    )}
                  </div>

                  <div className="account-meta-block">
                    <div className="account-name-line">
                      <h3 className="account-title">{acc.name}</h3>
                      <span className={`account-badge-type ${acc.type}`}>
                        {acc.type === 'bank' ? 'Bank' : acc.type === 'cash' ? 'Cash Wallet' : 'Other'}
                      </span>
                      {acc.isArchived && <span className="archived-tag">Archived</span>}
                    </div>

                    <div className="account-details-line small muted">
                      <span>Opening: {fmt(acc.openingBalance)} ({formatDateDisplay(acc.openingDate)})</span>
                      <span> · {accTxCount} transactions</span>
                    </div>
                  </div>
                </div>

                <div className="account-card-right">
                  <div className="account-current-balance-block">
                    <span className="small muted">Current Balance</span>
                    <b className={`account-balance-val ${currentBal < 0 ? 'loss' : ''}`}>
                      {fmt(currentBal)}
                    </b>
                  </div>

                  <div className="account-actions-row">
                    <button
                      type="button"
                      className="btn secondary small"
                      onClick={() => onViewAccountTransactions(acc.id)}
                    >
                      History
                    </button>

                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Transfer from this account"
                      title="Transfer from this account"
                      onClick={() => onOpenTransfer(acc.id)}
                    >
                      <ArrowRightLeft size={15} />
                    </button>

                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Edit account"
                      title="Edit account"
                      onClick={() => setEditingAccount(acc)}
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={acc.isArchived ? 'Unarchive account' : 'Archive account'}
                      title={acc.isArchived ? 'Unarchive account' : 'Archive account'}
                      onClick={() => archiveAccount(acc.id, !acc.isArchived)}
                    >
                      <Archive size={15} />
                    </button>

                    <button
                      type="button"
                      className="icon-btn danger"
                      aria-label="Delete account"
                      title="Delete account"
                      onClick={() => handleDelete(acc)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="clay-card empty-state">
            <Building size={32} className="empty-icon" />
            <p className="empty-title">No accounts found</p>
            <span className="small muted">
              Add your bank accounts or cash wallets to track balances accurately.
            </span>
            <button
              type="button"
              className="btn primary"
              style={{ marginTop: '16px' }}
              onClick={() => setIsAddOpen(true)}
            >
              <Plus size={16} /> Add Your First Account
            </button>
          </div>
        )}
      </div>

      {/* Account Modal for Add / Edit */}
      <AccountModal
        isOpen={isAddOpen || Boolean(editingAccount)}
        onClose={() => {
          setIsAddOpen(false)
          setEditingAccount(null)
        }}
        editAccount={editingAccount}
      />
    </div>
  )
}

export default Accounts
