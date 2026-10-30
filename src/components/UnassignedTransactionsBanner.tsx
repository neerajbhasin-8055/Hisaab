import React, { useState } from 'react'
import { useStore } from '../store'
import { Modal } from './Modal'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CheckSquare,
  HelpCircle,
  Search,
  Square,
  X
} from 'lucide-react'
import { fmt, formatDateDisplay } from '../lib/format'

export function UnassignedTransactionsBanner() {
  const { tx, accounts, batchAssignAccount } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchAccountId, setBatchAccountId] = useState('')
  const [assignmentByTx, setAssignmentByTx] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')

  const unassigned = tx.filter(t => !t.accountId || t.accountId === 'unassigned')
  const activeAccounts = accounts.filter(a => !a.isArchived)

  if (unassigned.length === 0) return null

  // Filter unassigned by search query
  const filteredUnassigned = unassigned.filter(t => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      t.cat.toLowerCase().includes(q) ||
      (t.note && t.note.toLowerCase().includes(q)) ||
      t.method.toLowerCase().includes(q) ||
      t.date.includes(q)
    )
  })

  // Toggle individual selection checkbox
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Select / Deselect all visible
  const toggleSelectAll = () => {
    const visibleIds = filteredUnassigned.map(t => t.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id))
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allVisibleSelected) visibleIds.forEach(id => next.delete(id))
      else visibleIds.forEach(id => next.add(id))
      return next
    })
  }

  const handleChooseRowAccount = (txId: string, accountId: string) => {
    setAssignmentByTx(prev => ({ ...prev, [txId]: accountId }))
    if (accountId) {
      setSelectedIds(prev => new Set(prev).add(txId))
    }
  }

  const handleApplyIndividualAssignments = async () => {
    const ids = Array.from(selectedIds)
    const missing = ids.filter(id => !assignmentByTx[id])
    if (ids.length === 0 || missing.length > 0) return
    try {
      setAssigning(true)
      const groups = new Map<string, string[]>()
      for (const id of ids) {
        const destination = assignmentByTx[id]
        if (!groups.has(destination)) groups.set(destination, [])
        groups.get(destination)!.push(id)
      }
      for (const [destination, groupIds] of groups) {
        await batchAssignAccount(groupIds, destination)
      }
      setFeedbackMsg(`Assigned ${ids.length} transaction${ids.length === 1 ? '' : 's'} to the selected accounts.`)
      setSelectedIds(new Set())
      setAssignmentByTx(prev => {
        const next = { ...prev }
        ids.forEach(id => delete next[id])
        return next
      })
      setTimeout(() => setFeedbackMsg(''), 3000)
    } catch (err) {
      console.error(err)
      setFeedbackMsg('Could not assign the selected transactions. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  // Assign multiple selected transactions
  const handleAssignSelected = async () => {
    if (!batchAccountId || selectedIds.size === 0) return
    try {
      setAssigning(true)
      const ids = Array.from(selectedIds)
      await batchAssignAccount(ids, batchAccountId)
      const accName = activeAccounts.find(a => a.id === batchAccountId)?.name || 'Account'
      setFeedbackMsg(`Assigned ${ids.length} transactions to ${accName}.`)
      setSelectedIds(new Set())
      setAssignmentByTx(prev => { const next = { ...prev }; ids.forEach(id => delete next[id]); return next })
      setBatchAccountId('')
      setTimeout(() => setFeedbackMsg(''), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setAssigning(false)
    }
  }

  const isAllSelected =
    filteredUnassigned.length > 0 && filteredUnassigned.every(t => selectedIds.has(t.id))
  const selectedHaveAssignments = selectedIds.size > 0 && Array.from(selectedIds).every(id => Boolean(assignmentByTx[id]))

  return (
    <>
      <div className="notice-banner info clay-notice">
        <HelpCircle size={18} />
        <div className="notice-body">
          <span>
            You have <b>{unassigned.length}</b> historical {unassigned.length === 1 ? 'transaction' : 'transactions'} without an assigned account.
          </span>
          <button type="button" className="link-btn" onClick={() => setIsOpen(true)}>
            Choose accounts <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Assign Transactions to Accounts"
        subtitle="Select which account each transaction belongs to, or assign in bulk."
        maxWidth="680px"
      >
        <div className="unassigned-manager">
          {feedbackMsg && (
            <div className="notice-banner success" style={{ marginBottom: '14px' }}>
              <CheckCircle2 size={16} />
              <span>{feedbackMsg}</span>
            </div>
          )}

          <p className="small muted" style={{ marginBottom: '14px' }}>
            Choose an account on each transaction row, tick the transactions you want to update, then apply those individual choices. You can also bulk-assign selected transactions to one account. Nothing changes until you press an Assign button.
          </p>

          {/* Batch Assignment & Search Bar */}
          <div className="clay-card unassigned-batch-toolbar">
            <div className="between toolbar-top-row">
              <button
                type="button"
                className="select-all-btn"
                onClick={toggleSelectAll}
                disabled={filteredUnassigned.length === 0}
              >
                {isAllSelected ? (
                  <CheckSquare size={16} className="gain" />
                ) : (
                  <Square size={16} className="muted" />
                )}
                <span>
                  {selectedIds.size > 0
                    ? `${selectedIds.size} of ${filteredUnassigned.length} selected`
                    : `Select all (${filteredUnassigned.length})`}
                </span>
              </button>

              <div className="search-inline-wrap">
                <Search size={15} className="search-icon-sm" />
                <input
                  type="search"
                  className="clay-input search-input-sm"
                  placeholder="Filter transactions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Batch Action Bar */}
            <div className="batch-action-row">
              <select
                className="clay-select small batch-acc-select"
                value={batchAccountId}
                onChange={e => setBatchAccountId(e.target.value)}
                disabled={selectedIds.size === 0 || assigning}
              >
                <option value="">Choose account for selected...</option>
                {activeAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type === 'bank' ? 'Bank' : a.type === 'cash' ? 'Cash' : 'Other'})
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn primary small"
                disabled={selectedIds.size === 0 || !batchAccountId || assigning}
                onClick={handleAssignSelected}
              >
                Assign {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
              </button>
            </div>
            <div className="batch-action-row individual-assignment-row">
              <span className="small muted">Apply each selected row’s account choice</span>
              <button
                type="button"
                className="btn secondary small"
                disabled={!selectedHaveAssignments || assigning}
                onClick={handleApplyIndividualAssignments}
              >
                Apply individual choices ({selectedIds.size})
              </button>
            </div>
          </div>

          {/* List of Unassigned Transactions */}
          <div className="unassigned-items-scroll-list">
            {filteredUnassigned.length > 0 ? (
              filteredUnassigned.map(t => {
                const isSelected = selectedIds.has(t.id)

                return (
                  <div
                    key={t.id}
                    className={`clay-card unassigned-item-card ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="unassigned-item-left">
                      <button
                        type="button"
                        className="checkbox-btn"
                        onClick={() => toggleSelect(t.id)}
                        aria-label={`Select ${t.cat} transaction`}
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="gain" />
                        ) : (
                          <Square size={18} className="muted" />
                        )}
                      </button>

                      <div className="unassigned-item-details">
                        <div className="unassigned-title-line">
                          <b className="unassigned-cat-name">{t.cat}</b>
                          <span className={`tx-badge-cls ${t.cls}`}>{t.cls}</span>
                        </div>

                        <div className="unassigned-meta-line small muted">
                          <span>{formatDateDisplay(t.date)}{t.time ? ` · ${t.time}` : ''}</span>
                          <span>· {t.method}</span>
                          {t.note && <span className="unassigned-note">· {t.note}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="unassigned-item-right">
                      <div className={`unassigned-amt-badge ${t.type === 'in' ? 'gain' : 'loss'}`}>
                        {t.type === 'in' ? '+' : '−'}{fmt(t.amt)}
                      </div>

                      <select
                        className="clay-select small single-acc-select"
                        value={assignmentByTx[t.id] || ''}
                        onChange={e => handleChooseRowAccount(t.id, e.target.value)}
                        disabled={assigning}
                        aria-label={`Choose account for ${t.cat} transaction`}
                      >
                        <option value="">Choose account...</option>
                        {activeAccounts.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.type === 'bank' ? 'Bank' : 'Cash'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state small">
                {searchQuery ? (
                  <p>No unassigned transactions match your search "{searchQuery}".</p>
                ) : (
                  <div className="all-assigned-celebrate">
                    <CheckCircle2 size={32} className="gain" />
                    <b>All transactions assigned!</b>
                    <p className="small muted">
                      Every transaction is now mapped to a bank account or cash wallet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-actions" style={{ marginTop: '16px' }}>
            <span className="small muted" style={{ marginRight: 'auto', alignSelf: 'center' }}>
              {unassigned.length} unassigned remaining
            </span>
            <button
              type="button"
              className="btn primary"
              onClick={() => setIsOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default UnassignedTransactionsBanner
