import React, { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { useStore } from '../store'
import { Category } from '../types'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../lib/constants'
import { CategoryIcon } from './CategoryIcon'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  editCategory?: Category | null
  initialType?: 'in' | 'out'
}

export function CategoryModal({
  isOpen,
  onClose,
  editCategory,
  initialType = 'out'
}: CategoryModalProps) {
  const { categories, saveCategory } = useStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<'in' | 'out'>(initialType)
  const [icon, setIcon] = useState('Receipt')
  const [color, setColor] = useState(CATEGORY_COLORS[0])
  const [err, setErr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setErr('')
      setSubmitting(false)
      if (editCategory) {
        setName(editCategory.name)
        setType(editCategory.type)
        setIcon(editCategory.icon || 'Receipt')
        setColor(editCategory.color || CATEGORY_COLORS[0])
      } else {
        setName('')
        setType(initialType)
        setIcon(initialType === 'in' ? 'Wallet' : 'ShoppingBag')
        setColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)])
      }
    }
  }, [isOpen, editCategory, initialType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setErr('Please enter a category name.')
      return
    }

    // Check for duplicate names (case-insensitive)
    const exists = categories.some(
      c => c.id !== editCategory?.id && c.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (exists) {
      setErr(`A category named "${trimmed}" already exists.`)
      return
    }

    try {
      setSubmitting(true)
      const catRecord: Category = {
        id: editCategory?.id || crypto.randomUUID(),
        name: trimmed,
        type,
        icon,
        color,
        isSystem: editCategory?.isSystem || false,
        created: editCategory?.created || Date.now(),
        modified: Date.now()
      }

      await saveCategory(catRecord)
      onClose()
    } catch (error) {
      console.error(error)
      setErr('Failed to save category.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editCategory ? 'Edit Category' : 'Create Custom Category'}
      subtitle="Tailor your categories to match your spending patterns."
    >
      <form onSubmit={handleSubmit} className="category-form">
        {err && <div className="notice-banner error">{err}</div>}

        {/* Type Toggle */}
        <div className="clay-segment" role="group" aria-label="Category type">
          <button
            type="button"
            className={`clay-seg-btn ${type === 'out' ? 'active expense' : ''}`}
            onClick={() => {
              setType('out')
              if (icon === 'Wallet') setIcon('ShoppingBag')
            }}
          >
            Expense Category
          </button>
          <button
            type="button"
            className={`clay-seg-btn ${type === 'in' ? 'active income' : ''}`}
            onClick={() => {
              setType('in')
              if (icon === 'ShoppingBag' || icon === 'Receipt') setIcon('Wallet')
            }}
          >
            Income Category
          </button>
        </div>

        {/* Category Name */}
        <div className="form-group">
          <label htmlFor="cat-name" className="field-label">
            Category Name
          </label>
          <input
            id="cat-name"
            className="clay-input"
            placeholder="e.g. Groceries, Gym, Office Lunch, Chai & Snacks"
            maxLength={50}
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Icon Selection */}
        <div className="form-group">
          <label className="field-label">Category Icon</label>
          <div className="icon-selector-grid">
            {CATEGORY_ICONS.map(ic => (
              <button
                key={ic}
                type="button"
                className={`icon-choice-btn ${icon === ic ? 'selected' : ''}`}
                onClick={() => setIcon(ic)}
                aria-label={`Select icon ${ic}`}
              >
                <CategoryIcon name={ic} size={20} />
              </button>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div className="form-group">
          <label className="field-label">Muted Color Theme</label>
          <div className="color-selector-row">
            {CATEGORY_COLORS.map(c => (
              <button
                key={c}
                type="button"
                className={`color-choice-btn ${color === c ? 'selected' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Saving...' : editCategory ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
