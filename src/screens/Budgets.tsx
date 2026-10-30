import React, { useState } from 'react'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Plus,
  Trash2,
  TrendingDown
} from 'lucide-react'
import { useStore } from '../store'
import {
  addMonths,
  calculateBudgetProgress,
  fmt,
  monthName,
  today
} from '../lib'
import { BudgetModal } from '../components/BudgetModal'
import { CategoryBudget } from '../types'

export function Budgets() {
  const { cfg, categoryBudgets, categories, tx, deleteCategoryBudget } = useStore()
  const [month, setMonth] = useState(today().slice(0, 7))
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null)

  // Overall monthly budget
  const overallLimit = cfg.budgets[month] || 0

  // Qualifying expenses for this month (strictly type === 'out', exclude transfers!)
  const monthExpenses = tx.filter(t => t.date.startsWith(month) && t.type === 'out')
  const totalSpent = monthExpenses.reduce((s, t) => s + t.amt, 0)
  const overallProgress = calculateBudgetProgress(overallLimit, totalSpent)

  // Category budgets for this month
  const activeCategoryBudgets = categoryBudgets.filter(b => b.month === month)
  const categoryMap = new Map<string, string>()
  categories.forEach(c => categoryMap.set(c.id, c.name))

  return (
    <div className="budgets-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">Plan spending limits and keep overspending in check.</p>
        </div>

        <button
          type="button"
          className="btn primary"
          onClick={() => {
            setEditingBudget(null)
            setIsModalOpen(true)
          }}
        >
          <Plus size={16} /> Set Budget
        </button>
      </header>

      {/* Month Stepper */}
      <div className="month-stepper-clay">
        <button
          type="button"
          className="stepper-arrow-btn"
          aria-label="Previous month"
          onClick={() => setMonth(addMonths(month, -1))}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="stepper-center">
          <span className="stepper-month-name">{monthName(month)}</span>
        </div>
        <button
          type="button"
          className="stepper-arrow-btn"
          aria-label="Next month"
          onClick={() => setMonth(addMonths(month, 1))}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Monthly Overall Budget Card */}
      <section className="clay-card budget-overview-hero">
        <div className="between">
          <div>
            <span className="field-label">Overall Monthly Budget</span>
            <div className="budget-hero-amount">
              {overallLimit > 0 ? fmt(overallLimit) : 'No limit set'}
            </div>
          </div>
          <button
            type="button"
            className="btn secondary small"
            onClick={() => {
              setEditingBudget(null)
              setIsModalOpen(true)
            }}
          >
            {overallLimit > 0 ? 'Edit Limit' : 'Set Limit'}
          </button>
        </div>

        {overallLimit > 0 ? (
          <div className="budget-hero-progress-section">
            <div className={`clay-progress-track ${overallProgress.isOver ? 'danger' : ''}`}>
              <div
                className={`clay-progress-fill ${overallProgress.isOver ? 'danger' : ''}`}
                style={{ width: `${Math.min(100, overallProgress.percent)}%` }}
              />
            </div>

            <div className="between budget-hero-foot">
              <span>
                Spent: <b>{fmt(overallProgress.spent)}</b> ({overallProgress.percent}%)
              </span>
              <b className={overallProgress.isOver ? 'loss' : 'gain'}>
                {overallProgress.isOver
                  ? `Over budget by ${fmt(overallProgress.overAmount)}`
                  : `${fmt(overallProgress.remaining)} remaining`}
              </b>
            </div>

            {overallProgress.isOver && (
              <div className="notice-banner warning" style={{ marginTop: '12px' }}>
                <AlertCircle size={16} />
                <span>
                  You have exceeded your overall spending limit for {monthName(month)} by {fmt(overallProgress.overAmount)}.
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="small muted" style={{ marginTop: '12px' }}>
            Set a monthly spending budget to track total outflows and receive overspending alerts.
          </p>
        )}
      </section>

      {/* Category Budgets Section */}
      <section className="section-container">
        <div className="section-head">
          <h2 className="section-heading">Category budgets</h2>
          <span className="small muted">Per-category limits for {monthName(month)}</span>
        </div>

        <div className="category-budgets-grid">
          {activeCategoryBudgets.length > 0 ? (
            activeCategoryBudgets.map(cb => {
              const catName = categoryMap.get(cb.categoryId) || 'Unknown Category'
              const spentInCat = monthExpenses
                .filter(t => t.cat === catName)
                .reduce((s, t) => s + t.amt, 0)
              const prog = calculateBudgetProgress(cb.amount, spentInCat)

              return (
                <div key={cb.id} className="clay-card category-budget-item">
                  <div className="between">
                    <div>
                      <b className="cat-budget-title">{catName}</b>
                      <span className="small muted block">Budget: {fmt(cb.amount)}</span>
                    </div>

                    <div className="cat-budget-actions">
                      <button
                        type="button"
                        className="icon-btn danger"
                        aria-label="Remove category budget"
                        title="Remove category budget"
                        onClick={() => deleteCategoryBudget(cb.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className={`clay-progress-track ${prog.isOver ? 'danger' : ''}`} style={{ margin: '12px 0 8px' }}>
                    <div
                      className={`clay-progress-fill ${prog.isOver ? 'danger' : ''}`}
                      style={{ width: `${Math.min(100, prog.percent)}%` }}
                    />
                  </div>

                  <div className="between small">
                    <span className="muted">Spent: {fmt(prog.spent)} ({prog.percent}%)</span>
                    <b className={prog.isOver ? 'loss' : 'gain'}>
                      {prog.isOver ? `Over by ${fmt(prog.overAmount)}` : `${fmt(prog.remaining)} left`}
                    </b>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="clay-card empty-state" style={{ gridColumn: '1 / -1' }}>
              <PieChart size={32} className="empty-icon" />
              <p className="empty-title">No category budgets set for this month</p>
              <span className="small muted">
                Set individual limits on Groceries, Dining out, Fuel, or Shopping to control specific categories.
              </span>
              <button
                type="button"
                className="btn secondary"
                style={{ marginTop: '16px' }}
                onClick={() => {
                  setEditingBudget(null)
                  setIsModalOpen(true)
                }}
              >
                <Plus size={16} /> Add Category Budget
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentMonth={month}
        editCategoryBudget={editingBudget}
      />
    </div>
  )
}

export default Budgets
