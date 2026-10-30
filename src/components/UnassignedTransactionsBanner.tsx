import React, { useState } from 'react'
import { useStore } from '../store'
import { Modal } from './Modal'
import { ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react'
import { fmt } from '../lib/format'

export function UnassignedTransactionsBanner() {
  const { tx, accounts, batchAssignAccount } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const unassigned = tx.filter(t => !t.accountId || t.accountId === 'unassigned')
  const activeAccounts = accounts.filter(a => !a.isArchived)

  if (unassigned.length === 0) return null

  const handleBatchAssign = async () => {
    if (!selectedAccountId) return
    try {
      setAssigning(true)
      const ids = unassigned.map(t => t.id)
      await batchAssignAccount(ids, selectedAccountId)
      setSuccessMsg(`Successfully assigned ${ids.length} transactions.`)
      setTimeout(() => {
        setIsOpen(false)
        setSuccessMsg('')
      }, 1200)
    } catch (err) {
      console.error(err)
    } finally {
      setAssigning(false)
    }
  }

  return (
    <>
      <div className="notice-banner info clay-notice">
        <HelpCircle size={18} />
        <div className="notice-body">
          <span>
            You have <b>{unassigned.length}</b> historical {unassigned.length === 1 ? 'transaction' : 'transactions'} without an assigned account.
          </span>
          <button type="button" className="link-btn" onClick={() => setIsOpen(true)}>
            Assign accounts <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Assign Historical Transactions"
        subtitle="Organize transactions from your previous Hisaab version."
      >
        <div className="unassigned-modal-body">
          {successMsg ? (
            <div className="notice-banner success">
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          ) : (
            <>
              <p className="modal-text">
                Hisaab preserves your previous transactions without making guesses about which bank or cash wallet held the funds.
              </p>

              <div className="unassigned-preview-list">
                {unassigned.slice(0, 5).map(t => (
                  <div key={t.id} className="unassigned-row">
                    <div>
                      <b>{t.cat}</b>
                      <span className="unassigned-meta">{t.date} · {t.method} {t.note ? `· ${t.note}` : ''}</span>
                    </div>
                    <span className={`unassigned-amt ${t.type === 'in' ? 'gain' : 'loss'}`}>
                      {t.type === 'in' ? '+' : '−'}{fmt(t.amt)}
                    </span>
                  </div>
                ))}
                {unassigned.length > 5 && (
                  <p className="small muted text-center">
                    ...and {unassigned.length - 5} more transactions
                  </p>
                )}
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label htmlFor="batch-acc-select" className="field-label">
                  Batch assign all {unassigned.length} transactions to:
                </label>
                <select
                  id="batch-acc-select"
                  className="clay-select"
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                >
                  <option value="">Choose an account...</option>
                  {activeAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type === 'bank' ? 'Bank' : 'Cash'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setIsOpen(false)}
                >
                  Keep Unassigned
                </button>
                <button
                  type="button"
                  className="btn primary"
                  disabled={!selectedAccountId || assigning}
                  onClick={handleBatchAssign}
                >
                  {assigning ? 'Assigning...' : 'Assign All Now'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
