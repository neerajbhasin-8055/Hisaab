import React, { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import {
  Download,
  FileText,
  LayoutDashboard,
  List,
  Menu,
  PieChart,
  Plus,
  RefreshCw,
  Settings as Cog,
  Tag,
  Target,
  Wallet,
  WifiOff,
  X
} from 'lucide-react'
import { useStore } from './store'
import Home from './screens/Home'
import Add from './screens/Add'
import History from './screens/History'
import Accounts from './screens/Accounts'
import Categories from './screens/Categories'
import Budgets from './screens/Budgets'
import SavingsGoals from './screens/SavingsGoals'
import Reports from './screens/Reports'
import Settings from './screens/Settings'
import { TransactionModal } from './components/TransactionModal'
import { Kind, Tx } from './types'

export type NavTab =
  | 'home'
  | 'history'
  | 'accounts'
  | 'categories'
  | 'budgets'
  | 'goals'
  | 'reports'
  | 'settings'
  | 'add'

export default function App() {
  const { ready, error, tx } = useStore()
  const [tab, setTab] = useState<NavTab>('home')
  const [editId, setEditId] = useState<string | null>(null)
  const [repParam, setRepParam] = useState<string | undefined>()
  const [accountParam, setAccountParam] = useState<string | undefined>()
  const [categoryParam, setCategoryParam] = useState<string | undefined>()

  const [theme, setThemeState] = useState(localStorage.getItem('theme') || 'auto')
  const [online, setOnline] = useState(navigator.onLine)
  const [inst, setInst] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Transaction Modal state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [modalInitialType, setModalInitialType] = useState<Kind>('out')
  const [modalInitialAccount, setModalInitialAccount] = useState<string | undefined>()
  const [modalEditTx, setModalEditTx] = useState<Tx | null>(null)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker
  } = useRegisterSW()

  // Apply theme class and data-theme
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      document.documentElement.dataset.theme =
        theme === 'auto' ? (mq.matches ? 'dark' : 'light') : theme
    }
    applyTheme()
    mq.addEventListener('change', applyTheme)
    return () => mq.removeEventListener('change', applyTheme)
  }, [theme])

  // Network and PWA prompt listeners
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    const bi = (e: Event) => {
      e.preventDefault()
      setInst(e)
    }
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    window.addEventListener('beforeinstallprompt', bi)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
      window.removeEventListener('beforeinstallprompt', bi)
    }
  }, [])

  const setTheme = (t: string) => {
    localStorage.setItem('theme', t)
    setThemeState(t)
  }

  const go = (targetTab: string, extra?: string) => {
    setTab(targetTab as NavTab)
    setEditId(null)
    setMobileMenuOpen(false)

    if (targetTab === 'reports') {
      setRepParam(extra)
    } else if (targetTab === 'accounts') {
      setAccountParam(extra)
    } else if (targetTab === 'history') {
      setAccountParam(extra)
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenAddTx = (initialType: Kind = 'out', accountId?: string) => {
    setModalEditTx(null)
    setModalInitialType(initialType)
    setModalInitialAccount(accountId)
    setIsTxModalOpen(true)
  }

  const handleEditTx = (id: string) => {
    const item = tx.find(x => x.id === id)
    if (item) {
      setModalEditTx(item)
      setIsTxModalOpen(true)
    }
  }

  if (!ready) {
    return (
      <div className="app-loading-screen">
        <div className="loading-spinner-clay" />
        <p className="loading-text">Loading your private financial records...</p>
      </div>
    )
  }

  const navItems = [
    { id: 'home', label: 'Overview', icon: LayoutDashboard },
    { id: 'history', label: 'Transactions', icon: List },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Cog }
  ] as const

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="app-sidebar noprint" aria-label="Sidebar navigation">
        <div className="sidebar-brand-section">
          <div className="brand-lockup">
            <div className="brand-mark">h.</div>
            <div>
              <span className="sidebar-brand-name">Hisaab</span>
              <p className="sidebar-brand-sub">Private Finance</p>
            </div>
          </div>
        </div>

        <div className="sidebar-quick-action">
          <button
            type="button"
            className="btn primary wide-btn sidebar-add-btn"
            onClick={() => handleOpenAddTx('out')}
          >
            <Plus size={18} /> Record Entry
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Desktop menu">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => go(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={19} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="privacy-pill">
            <span className="privacy-dot" /> Local & Private
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main-viewport">
        {/* Mobile Top App Bar */}
        <header className="mobile-top-bar noprint">
          <div className="mobile-brand-wrap" onClick={() => go('home')}>
            <div className="brand-mark small">h.</div>
            <span className="brand-title-mobile">Hisaab</span>
          </div>

          <div className="mobile-top-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(p => !p)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer Dropdown */}
        {mobileMenuOpen && (
          <div
            className="mobile-drawer-overlay noprint"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="mobile-drawer-menu"
              onClick={e => e.stopPropagation()}
            >
              <div className="mobile-drawer-header">
                <b>Navigation</b>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mobile-nav-list">
                {navItems.map(item => {
                  const Icon = item.icon
                  const isActive = tab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`mobile-nav-row ${isActive ? 'active' : ''}`}
                      onClick={() => go(item.id)}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{ marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn primary wide-btn"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleOpenAddTx('out')
                  }}
                >
                  <Plus size={18} /> New Transaction
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="content-container">
          {/* Storage Error Notice */}
          {error && (
            <div className="notice-banner error" role="alert">
              {error}
            </div>
          )}

          {/* Offline Notice */}
          {!online && (
            <div className="notice-banner clay-notice" role="status">
              <WifiOff size={16} />
              <span>You are offline. Hisaab is saving your records locally on this device.</span>
            </div>
          )}

          {/* PWA Update Ready Notice */}
          {needRefresh && (
            <div className="notice-banner clay-notice info">
              <RefreshCw size={16} />
              <span>A new version of Hisaab is available.</span>
              <button
                type="button"
                className="btn secondary small"
                onClick={() => updateServiceWorker(true)}
              >
                Update now
              </button>
            </div>
          )}

          {/* PWA Install Notice */}
          {inst && (
            <div className="notice-banner clay-notice info">
              <Download size={16} />
              <span>Install Hisaab on your phone or desktop for the best offline experience.</span>
              <button
                type="button"
                className="btn primary small"
                onClick={async () => {
                  inst.prompt()
                  await inst.userChoice
                  setInst(null)
                }}
              >
                Install App
              </button>
            </div>
          )}

          {/* Active Screen View */}
          {tab === 'home' && (
            <Home
              go={go}
              onOpenAddTx={handleOpenAddTx}
              onEditTx={handleEditTx}
            />
          )}

          {tab === 'history' && (
            <History
              edit={handleEditTx}
              initialAccountId={accountParam}
              initialCategory={categoryParam}
            />
          )}

          {tab === 'accounts' && (
            <Accounts
              initialTab={accountParam === 'bank' || accountParam === 'cash' ? accountParam : 'all'}
              onOpenTransfer={sourceAccId => handleOpenAddTx('transfer', sourceAccId)}
              onViewAccountTransactions={accId => {
                setAccountParam(accId)
                setTab('history')
              }}
            />
          )}

          {tab === 'categories' && (
            <Categories
              onSelectCategory={catName => {
                setCategoryParam(catName)
                setTab('history')
              }}
            />
          )}

          {tab === 'budgets' && <Budgets />}

          {tab === 'goals' && <SavingsGoals />}

          {tab === 'reports' && (
            <Reports
              key={repParam || 'current'}
              initialMonth={repParam}
            />
          )}

          {tab === 'settings' && (
            <Settings theme={theme} setTheme={setTheme} />
          )}

          {tab === 'add' && (
            <Add
              key={editId ?? 'new'}
              editId={editId}
              done={() => go(editId ? 'history' : 'home')}
            />
          )}
        </main>
      </div>

      {/* Floating Bottom Navigation Bar for Mobile */}
      <nav className="mobile-bottom-dock noprint" aria-label="Mobile Navigation">
        <button
          type="button"
          className={`dock-btn ${tab === 'home' ? 'active' : ''}`}
          onClick={() => go('home')}
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className={`dock-btn ${tab === 'history' ? 'active' : ''}`}
          onClick={() => go('history')}
        >
          <List size={20} />
          <span>History</span>
        </button>

        <button
          type="button"
          className="dock-btn-highlight"
          aria-label="Add transaction"
          onClick={() => handleOpenAddTx('out')}
        >
          <Plus size={24} />
        </button>

        <button
          type="button"
          className={`dock-btn ${tab === 'accounts' ? 'active' : ''}`}
          onClick={() => go('accounts')}
        >
          <Wallet size={20} />
          <span>Accounts</span>
        </button>

        <button
          type="button"
          className={`dock-btn ${
            tab === 'categories' ||
            tab === 'budgets' ||
            tab === 'goals' ||
            tab === 'reports' ||
            tab === 'settings'
              ? 'active'
              : ''
          }`}
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>

      {/* Global Transaction Modal (for Add, Edit, Transfer) */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false)
          setModalEditTx(null)
        }}
        editTx={modalEditTx}
        initialType={modalInitialType}
        initialAccountId={modalInitialAccount}
      />
    </div>
  )
}
