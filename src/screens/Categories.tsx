import React, { useState } from 'react'
import { Plus, Search, Tag, Trash2, Edit2 } from 'lucide-react'
import { useStore } from '../store'
import { Category } from '../types'
import { CategoryIcon } from '../components/CategoryIcon'
import { CategoryModal } from '../components/CategoryModal'
import { SafeDeleteCategoryModal } from '../components/SafeDeleteCategoryModal'
import { fmt } from '../lib/format'

export function Categories({
  onSelectCategory
}: {
  onSelectCategory?: (categoryName: string) => void
}) {
  const { categories, tx } = useStore()
  const [typeTab, setTypeTab] = useState<'out' | 'in'>('out')
  const [query, setQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  // Filter categories by type tab and search query
  const displayedCategories = categories.filter(c => {
    if (c.type !== typeTab) return false
    if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  // Calculate transaction stats for each category
  const getCategoryStats = (catName: string, type: 'in' | 'out') => {
    const matching = tx.filter(t => t.cat === catName && t.type === type)
    const total = matching.reduce((s, t) => s + t.amt, 0)
    return { count: matching.length, total }
  }

  return (
    <div className="categories-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize your spending and income with custom categories.</p>
        </div>

        <button
          type="button"
          className="btn primary"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus size={16} /> New Category
        </button>
      </header>

      {/* Tabs & Search */}
      <div className="categories-control-row">
        <div className="clay-segment" role="group" aria-label="Category type tabs">
          <button
            type="button"
            className={`clay-seg-btn ${typeTab === 'out' ? 'active expense' : ''}`}
            onClick={() => setTypeTab('out')}
          >
            Expense Categories ({categories.filter(c => c.type === 'out').length})
          </button>
          <button
            type="button"
            className={`clay-seg-btn ${typeTab === 'in' ? 'active income' : ''}`}
            onClick={() => setTypeTab('in')}
          >
            Income Categories ({categories.filter(c => c.type === 'in').length})
          </button>
        </div>

        <div className="search-bar-clay compact">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            className="search-input"
            placeholder="Search categories..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="categories-card-grid">
        {displayedCategories.length > 0 ? (
          displayedCategories.map(cat => {
            const stats = getCategoryStats(cat.name, cat.type)

            return (
              <div key={cat.id} className="clay-card category-card-item">
                <div className="category-card-top">
                  <div
                    className="category-icon-clay"
                    style={{
                      backgroundColor: cat.color ? cat.color + '18' : 'var(--surface-2)',
                      borderColor: cat.color ? cat.color + '40' : 'var(--border)'
                    }}
                  >
                    <CategoryIcon name={cat.icon || 'Tag'} size={22} />
                  </div>

                  <div className="category-actions-top">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Edit category"
                      onClick={() => setEditingCategory(cat)}
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      type="button"
                      className="icon-btn danger"
                      aria-label="Delete category"
                      onClick={() => setDeletingCategory(cat)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="category-card-body">
                  <b className="category-card-title">{cat.name}</b>
                  {cat.isSystem && <span className="category-system-tag">Default</span>}

                  <div className="category-stats-row small muted">
                    <span>{stats.count} {stats.count === 1 ? 'transaction' : 'transactions'}</span>
                    <b>{fmt(stats.total)}</b>
                  </div>
                </div>

                {onSelectCategory && (
                  <button
                    type="button"
                    className="btn secondary small wide-btn"
                    style={{ marginTop: '8px' }}
                    onClick={() => onSelectCategory(cat.name)}
                  >
                    View Transactions
                  </button>
                )}
              </div>
            )
          })
        ) : (
          <div className="clay-card empty-state" style={{ gridColumn: '1 / -1' }}>
            <Tag size={32} className="empty-icon" />
            <p className="empty-title">No categories found</p>
            <span className="small muted">
              Create custom categories matching your personal or business spending habits.
            </span>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <CategoryModal
        isOpen={isAddOpen || Boolean(editingCategory)}
        onClose={() => {
          setIsAddOpen(false)
          setEditingCategory(null)
        }}
        editCategory={editingCategory}
        initialType={typeTab}
      />

      {/* Safe Delete Category Modal */}
      <SafeDeleteCategoryModal
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        category={deletingCategory}
      />
    </div>
  )
}

export default Categories
