import React, { useState } from 'react'
import { Modal } from './Modal'
import { useStore } from '../store'
import { Category } from '../types'
import { AlertTriangle } from 'lucide-react'

interface SafeDeleteCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
}

export function SafeDeleteCategoryModal({
  isOpen,
  onClose,
  category
}: SafeDeleteCategoryModalProps) {
  const { tx, categories, deleteCategory } = useStore()
  const [reassignTo, setReassignTo] = useState('Uncategorised')
  const [deleting, setDeleting] = useState(false)

  if (!category) return null

  // Transactions using this category
  const matchingTx = tx.filter(t => t.cat === category.name)
  const txCount = matchingTx.length

  // Other categories of the same type
  const alternateCategories = categories.filter(
    c => c.id !== category.id && c.type === category.type
  )

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await deleteCategory(category.id, txCount > 0 ? reassignTo : undefined)
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Category"
      subtitle={`Remove "${category.name}"`}
    >
      <div className="safe-delete-content">
        {txCount > 0 ? (
          <>
            <div className="notice-banner warning">
              <AlertTriangle size={18} />
              <div>
                <b>{txCount} {txCount === 1 ? 'transaction uses' : 'transactions use'} this category.</b>
                <p className="small">
                  To protect your financial history, Hisaab will never silently delete your records. Choose what to do with these transactions.
                </p>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label htmlFor="reassign-cat-select" className="field-label">
                Reassign transactions to:
              </label>
              <select
                id="reassign-cat-select"
                className="clay-select"
                value={reassignTo}
                onChange={e => setReassignTo(e.target.value)}
              >
                <option value="Uncategorised">Uncategorised (Default)</option>
                {alternateCategories.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <p className="modal-text">
            No transactions currently use <b>{category.name}</b>. Are you sure you want to delete it?
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
