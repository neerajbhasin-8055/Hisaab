import React, { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { useStore } from '../store'
import { Goal } from '../types'
import { toP, toRupeeString } from '../lib/format'
import { CATEGORY_COLORS } from '../lib/constants'

interface GoalModalProps {
  isOpen: boolean
  onClose: () => void
  editGoal?: Goal | null
}

export function GoalModal({ isOpen, onClose, editGoal }: GoalModalProps) {
  const { saveGoal } = useStore()
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[0])
  const [err, setErr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setErr('')
      setSubmitting(false)
      if (editGoal) {
        setName(editGoal.name)
        setTargetAmount(toRupeeString(editGoal.targetAmount))
        setCurrentAmount(toRupeeString(editGoal.currentAmount || 0))
        setTargetDate(editGoal.targetDate || '')
        setColor(editGoal.color || CATEGORY_COLORS[0])
      } else {
        setName('')
        setTargetAmount('')
        setCurrentAmount('0')
        setTargetDate('')
        setColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)])
      }
    }
  }, [isOpen, editGoal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErr('Please enter a goal name.')
      return
    }

    const targetP = toP(targetAmount)
    if (targetP <= 0) {
      setErr('Target amount must be greater than zero.')
      return
    }

    const currentP = toP(currentAmount)

    try {
      setSubmitting(true)
      const goalRecord: Goal = {
        id: editGoal?.id || crypto.randomUUID(),
        name: name.trim(),
        targetAmount: targetP,
        currentAmount: currentP,
        targetDate: targetDate || undefined,
        color,
        created: editGoal?.created || Date.now(),
        modified: Date.now()
      }

      await saveGoal(goalRecord)
      onClose()
    } catch (error) {
      console.error(error)
      setErr('Failed to save savings goal.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
      subtitle="Track your progress toward what matters to you."
    >
      <form onSubmit={handleSubmit} className="goal-form">
        {err && <div className="notice-banner error">{err}</div>}

        <div className="form-group">
          <label htmlFor="goal-name" className="field-label">
            Goal Name
          </label>
          <input
            id="goal-name"
            className="clay-input"
            placeholder="e.g. Emergency Fund, Travel Fund, New Laptop"
            maxLength={60}
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label htmlFor="goal-target" className="field-label">
              Target Amount (₹)
            </label>
            <input
              id="goal-target"
              className="clay-input"
              inputMode="decimal"
              placeholder="e.g. 50,000"
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="goal-current" className="field-label">
              Current Saved (₹)
            </label>
            <input
              id="goal-current"
              className="clay-input"
              inputMode="decimal"
              placeholder="0"
              value={currentAmount}
              onChange={e => setCurrentAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="goal-date" className="field-label">
            Target Completion Date (Optional)
          </label>
          <input
            id="goal-date"
            type="date"
            className="clay-input"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="field-label">Accent Theme</label>
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

        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Saving...' : editGoal ? 'Save Goal' : 'Create Goal'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
