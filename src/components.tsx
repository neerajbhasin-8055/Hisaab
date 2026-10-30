import React from 'react'
import {
  ArrowRightLeft,
  Pencil,
  Receipt,
  Trash2
} from 'lucide-react'
import { Tx } from './types'
import { fmt } from './lib/format'
import { CategoryIcon } from './components/CategoryIcon'
import { useStore } from './store'

export * from './components/CategoryIcon'
export * from './components/Modal'
export * from './components/ScopeSelect'
export * from './components/TransactionModal'
export * from './components/AccountModal'
export * from './components/CategoryModal'
export * from './components/SafeDeleteCategoryModal'
export * from './components/GoalModal'
export * from './components/BudgetModal'
export * from './components/UnassignedTransactionsBanner'

export function TxRows({
  items,
  onEdit,
  onDelete
}: {
  items: Tx[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const { accounts, categories } = useStore()
  const accountMap = new Map<string, string>()
  accounts.forEach(a => accountMap.set(a.id, a.name))

  const categoryMap = new Map<string, { icon?: string; color?: string }>()
  categories.forEach(c => categoryMap.set(c.name.toLowerCase(), { icon: c.icon, color: c.color }))

  if (!items.length) {
    return (
      <div className="empty-state">
        <Receipt size={32} strokeWidth={1.5} className="empty-icon" />
        <p className="empty-title">No transactions found</p>
        <span className="small muted">Transactions matching your criteria will appear here.</span>
      </div>
    )
  }

  return (
    <div className="tx-list" role="list">
      {items.map(x => {
        const isTransfer = x.type === 'transfer'
        const fromAccName = x.accountId
          ? x.accountId === 'unassigned'
            ? 'Legacy Unassigned'
            : accountMap.get(x.accountId) || 'Account'
          : 'Unassigned'
        const toAccName = x.toAccountId ? accountMap.get(x.toAccountId) || 'Account' : ''

        const catData = categoryMap.get(x.cat.toLowerCase())
        const iconName = isTransfer ? 'ArrowRightLeft' : catData?.icon || 'Receipt'

        return (
          <div className="tx-row-item" key={x.id} role="listitem">
            <div className="tx-left">
              <div
                className="tx-icon-clay"
                style={catData?.color ? { borderColor: catData.color + '40' } : undefined}
              >
                {isTransfer ? (
                  <ArrowRightLeft size={18} strokeWidth={1.8} />
                ) : (
                  <CategoryIcon name={iconName} size={18} />
                )}
              </div>

              <div className="tx-info">
                <div className="tx-title-row">
                  <b className="tx-title">
                    {isTransfer ? `Transfer: ${fromAccName} → ${toAccName}` : x.cat}
                  </b>
                  <span className={`tx-badge-cls ${x.cls}`}>{x.cls}</span>
                </div>

                <div className="tx-meta-row">
                  <span className="tx-meta-date">{x.date}{x.time ? ` · ${x.time}` : ''}</span>
                  <span className="meta-separator">·</span>
                  <span className="tx-meta-acc">
                    {isTransfer ? 'Transfer' : fromAccName}
                  </span>
                  <span className="meta-separator">·</span>
                  <span className="tx-meta-method">{x.method}</span>
                </div>

                {x.note && <div className="tx-note-text">{x.note}</div>}
              </div>
            </div>

            <div className="tx-right">
              <div
                className={`tx-amount-val ${
                  isTransfer ? 'transfer' : x.type === 'in' ? 'gain' : 'loss'
                }`}
              >
                {isTransfer ? '⇄ ' : x.type === 'in' ? '+' : '−'}
                {fmt(x.amt)}
              </div>

              {onEdit && onDelete && (
                <div className="tx-actions">
                  <button
                    type="button"
                    className="action-icon-btn"
                    aria-label="Edit transaction"
                    onClick={() => onEdit(x.id)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="action-icon-btn danger"
                    aria-label="Delete transaction"
                    onClick={() => onDelete(x.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
