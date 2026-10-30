import React, { useState } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  Sparkles,
  Target,
  Trash2
} from 'lucide-react'
import { useStore } from '../store'
import { Goal } from '../types'
import {
  addMonths,
  calculateGoalProgress,
  fmt,
  formatDateDisplay,
  monthName,
  today
} from '../lib'
import { GoalModal } from '../components/GoalModal'

export function SavingsGoals() {
  const { goals, cfg, tx, deleteGoal, saveCfg } = useStore()
  const [month, setMonth] = useState(today().slice(0, 7))
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetInput, setTargetInput] = useState('')

  // Monthly savings target (preserved from existing cfg.targets[month])
  const monthlyTarget = cfg.targets[month] || 0
  const monthTx = tx.filter(t => t.date.startsWith(month))
  const monthIn = monthTx.filter(t => t.type === 'in').reduce((s, t) => s + t.amt, 0)
  const monthOut = monthTx.filter(t => t.type === 'out').reduce((s, t) => s + t.amt, 0)
  const monthNet = monthIn - monthOut
  const monthlyProgress = calculateGoalProgress(monthlyTarget, Math.max(0, monthNet))

  const handleSaveMonthlyTarget = async () => {
    const p = Math.round(Number(targetInput.replace(/[^\d.-]/g, '')) * 100)
    await saveCfg({
      ...cfg,
      targets: {
        ...cfg.targets,
        [month]: isFinite(p) && p > 0 ? p : 0
      }
    })
    setEditingTarget(false)
  }

  // Days remaining calculation
  const getDaysRemaining = (targetDate?: string) => {
    if (!targetDate) return null
    const target = new Date(targetDate + 'T00:00:00Z').getTime()
    const now = new Date(today() + 'T00:00:00Z').getTime()
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'Passed'
    if (diff === 0) return 'Today'
    return `${diff} days left`
  }

  return (
    <div className="savings-goals-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="page-subtitle">Track targets for emergency funds, major purchases, and future security.</p>
        </div>

        <button
          type="button"
          className="btn primary"
          onClick={() => {
            setEditingGoal(null)
            setIsModalOpen(true)
          }}
        >
          <Plus size={16} /> New Goal
        </button>
      </header>

      {/* Monthly Target Stepper & Card (Preserves existing cfg.targets functionality) */}
      <section className="clay-card monthly-target-card">
        <div className="between">
          <div className="month-stepper-compact">
            <button
              type="button"
              className="icon-btn small"
              onClick={() => setMonth(addMonths(month, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <b>{monthName(month)} Savings Target</b>
            <button
              type="button"
              className="icon-btn small"
              onClick={() => setMonth(addMonths(month, 1))}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            className="btn secondary small"
            onClick={() => {
              setTargetInput(monthlyTarget > 0 ? String(monthlyTarget / 100) : '')
              setEditingTarget(true)
            }}
          >
            {monthlyTarget > 0 ? 'Edit Target' : 'Set Target'}
          </button>
        </div>

        {editingTarget ? (
          <div className="inline-edit-target" style={{ marginTop: '14px' }}>
            <label htmlFor="target-input-field" className="field-label small">
              Target monthly savings (₹):
            </label>
            <div className="form-actions-inline">
              <input
                id="target-input-field"
                className="clay-input"
                inputMode="decimal"
                placeholder="e.g. 25,000"
                autoFocus
                value={targetInput}
                onChange={e => setTargetInput(e.target.value)}
              />
              <button type="button" className="btn primary" onClick={handleSaveMonthlyTarget}>
                Save
              </button>
              <button type="button" className="btn secondary" onClick={() => setEditingTarget(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : monthlyTarget > 0 ? (
          <div className="target-progress-block" style={{ marginTop: '14px' }}>
            <div className="between">
              <span className="small muted">
                Actual Net Cash Flow: <b>{fmt(monthNet)}</b>
              </span>
              <b className={monthNet >= monthlyTarget ? 'gain' : ''}>
                {monthlyProgress.isAchieved ? 'Target Achieved 🎉' : `${fmt(monthlyTarget - monthNet)} remaining`}
              </b>
            </div>

            <div className="clay-progress-track" style={{ margin: '8px 0 10px' }}>
              <div
                className="clay-progress-fill"
                style={{ width: `${Math.min(100, monthlyProgress.percent)}%` }}
              />
            </div>

            <div className="between small muted">
              <span>{monthlyProgress.percent}% of {fmt(monthlyTarget)}</span>
              <span>{monthNet >= monthlyTarget ? `Surplus: ${fmt(monthNet - monthlyTarget)}` : `Goal: ${fmt(monthlyTarget)}`}</span>
            </div>
          </div>
        ) : (
          <p className="small muted" style={{ marginTop: '10px' }}>
            Set a monthly savings target to monitor how much cash surplus you achieve each month.
          </p>
        )}
      </section>

      {/* Savings Goals List */}
      <section className="section-container">
        <div className="section-head">
          <h2 className="section-heading">Dedicated Savings Goals</h2>
          <span className="small muted">{goals.length} {goals.length === 1 ? 'goal' : 'goals'} created</span>
        </div>

        <div className="savings-goals-grid">
          {goals.length > 0 ? (
            goals.map(goal => {
              const prog = calculateGoalProgress(goal.targetAmount, goal.currentAmount)
              const daysLeft = getDaysRemaining(goal.targetDate)

              return (
                <div
                  key={goal.id}
                  className={`clay-card goal-card-item ${prog.isAchieved ? 'achieved' : ''}`}
                >
                  <div className="between goal-card-header">
                    <div className="goal-title-wrap">
                      <div
                        className="goal-icon-dot"
                        style={{ backgroundColor: goal.color || 'var(--emerald)' }}
                      />
                      <h3 className="goal-title">{goal.name}</h3>
                    </div>

                    <div className="goal-actions-top">
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Edit goal"
                        onClick={() => {
                          setEditingGoal(goal)
                          setIsModalOpen(true)
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        aria-label="Delete goal"
                        onClick={() => {
                          if (confirm(`Delete the goal "${goal.name}"?`)) {
                            deleteGoal(goal.id)
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="goal-amount-block">
                    <div className="goal-current-amount">{fmt(goal.currentAmount)}</div>
                    <span className="small muted">
                      saved of {fmt(goal.targetAmount)} target
                    </span>
                  </div>

                  <div className="clay-progress-track" style={{ margin: '14px 0 10px' }}>
                    <div
                      className="clay-progress-fill"
                      style={{
                        width: `${prog.percent}%`,
                        backgroundColor: goal.color || undefined
                      }}
                    />
                  </div>

                  <div className="between small goal-card-footer">
                    <b>{prog.percent}% Complete</b>
                    {prog.isAchieved ? (
                      <span className="gain goal-status-tag">
                        <CheckCircle2 size={13} /> Achieved
                      </span>
                    ) : (
                      <span className="muted">Remaining: {fmt(prog.remaining)}</span>
                    )}
                  </div>

                  {goal.targetDate && (
                    <div className="goal-target-date-line small muted">
                      <span>Target date: {formatDateDisplay(goal.targetDate)}</span>
                      {daysLeft && <span className="days-left-badge">{daysLeft}</span>}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="clay-card empty-state" style={{ gridColumn: '1 / -1' }}>
              <Target size={32} className="empty-icon" />
              <p className="empty-title">No savings goals yet</p>
              <span className="small muted">
                Create dedicated savings goals for your emergency cushion, vacation, or major milestones.
              </span>
              <button
                type="button"
                className="btn primary"
                style={{ marginTop: '16px' }}
                onClick={() => {
                  setEditingGoal(null)
                  setIsModalOpen(true)
                }}
              >
                <Plus size={16} /> Create Your First Goal
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Goal Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingGoal(null)
        }}
        editGoal={editingGoal}
      />
    </div>
  )
}

export default SavingsGoals
