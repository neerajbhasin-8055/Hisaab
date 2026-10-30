import React, { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { useStore } from '../store'
import { toP, toRupeeString, monthName, today } from '../lib/format'
import { CategoryBudget } from '../types'

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  currentMonth: string
  editCategoryBudget?: CategoryBudget | null
}

export function BudgetModal({
  isOpen,
  onClose,
  currentMonth,
  editCategoryBudget
}: BudgetModalProps) {
  const { categories, categoryBudgets, cfg, saveCfg, saveCategoryBudget } = useStore()
  const [budgetType, setBudgetType] = useState<'overall' | 'category'>('overall')
  const [overallAmount, setOverallAmount] = useState('')
  const [selectedCatId, setSelectedCatId] = useState('')
  const [categoryAmount, setCategoryAmount] = useState('')
  const [err, setErr] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const expenseCategories = categories.filter(c => c.type === 'out')

  useEffect(() => {
    if (isOpen) {
      setErr('')
      setSubmitting(false)
      const currentOverall = cfg.budgets[currentMonth] || 0
      setOverallAmount(currentOverall > 0 ? toRupeeString(currentOverall) : '')

      if (editCategoryBudget) {
        setBudgetType('category')
        setSelectedCatId(editCategoryBudget.categoryId)
        setCategoryAmount(toRupeeString(editCategoryBudget.amount))
      } else {
        setBudgetType('overall')
        setSelectedCatId(expenseCategories[0]?.id || '')
        setCategoryAmount('')
      }
    }
  }, [isOpen, currentMonth, editCategoryBudget, cfg.budgets])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      if (budgetType === 'overall') {
        const p = toP(overallAmount)
        await saveCfg({
          ...cfg,
          budgets: {
            ...cfg.budgets,
            [currentMonth]: p
          }
        })
      } else {
        if (!selectedCatId) {
          setErr('Please select a category.')
          return
        }
        const p = toP(categoryAmount)
        if (p <= 0) {
          setErr('Category budget must be greater than zero.')
          return
        }

        const budgetRecord: CategoryBudget = {
          id: editCategoryBudget?.id || `${currentMonth}:${selectedCatId}`,
          month: currentMonth,
          categoryId: selectedCatId,
          amount: p
        }
        await saveCategoryBudget(budgetRecord)
      }
      onClose()
    } catch (error) {
      console.error(error)
      setErr('Failed to save budget.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Budget"
      subtitle={`Plan your spending limits for ${monthName(currentMonth)}.`}
    >
      <form onSubmit={handleSubmit} className="budget-form">
        {err && <div className="notice-banner error">{err}</div>}

        <div className="clay-segment" role="group" aria-label="Budget type">
          <button
            type="button"
            className={`clay-seg-btn ${budgetType === 'overall' ? 'active' : ''}`}
            onClick={() => setBudgetType('overall')}
          >
            Monthly Overall Budget
          </button>
          <button
            type="button"
            className={`clay-seg-btn ${budgetType === 'category' ? 'active' : ''}`}
            onClick={() => setBudgetType('category')}
          >
            Category Budget
          </button>
        </div>

        {budgetType === 'overall' ? (
          <div className="form-group">
            <label htmlFor="overall-bd" className="field-label">
              Total Monthly Spending Limit (₹)
            </label>
            <input
              id="overall-bd"
              className="clay-input"
              inputMode="decimal"
              placeholder="e.g. 35,000"
              autoFocus
              value={overallAmount}
              onChange={e => setOverallAmount(e.target.value)}
            />
            <span className="field-hint">
              This limit covers all expenses recorded in {monthName(currentMonth)}. Internal transfers are excluded.
            </span>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="cat-bd-select" className="field-label">
                Expense Category
              </label>
              <select
                id="cat-bd-select"
                className="clay-select"
                value={selectedCatId}
                onChange={e => setSelectedCatId(e.target.value)}
              >
                {expenseCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cat-bd-amount" className="field-label">
                Category Spending Limit (₹)
              </label>
              <input
                id="cat-bd-amount"
                className="clay-input"
                inputMode="decimal"
                placeholder="e.g. 8,000"
                value={categoryAmount}
                onChange={e => setCategoryAmount(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Budget'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
