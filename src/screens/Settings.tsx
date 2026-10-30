import React, { useState } from 'react'
import {
  CheckCircle2,
  Download,
  Moon,
  ShieldCheck,
  Sun,
  SunMoon,
  Upload
} from 'lucide-react'
import { useStore } from '../store'
import {
  createBackupPayload,
  downloadFile,
  monthName,
  parseHisaabBackup,
  toP,
  toRupeeString,
  today
} from '../lib'

export function Settings({
  theme,
  setTheme
}: {
  theme: string
  setTheme: (t: string) => void
}) {
  const { tx, accounts, categories, goals, cfg, saveCfg, restoreBackupData } = useStore()
  const [month, setMonth] = useState(today().slice(0, 7))

  const [tg, setTg] = useState(toRupeeString(cfg.targets[month] || 0))
  const [bd, setBd] = useState(toRupeeString(cfg.budgets[month] || 0))
  const [em, setEm] = useState(cfg.email || '')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')

  const pickMonth = (m: string) => {
    setMonth(m)
    setTg(toRupeeString(cfg.targets[m] || 0))
    setBd(toRupeeString(cfg.budgets[m] || 0))
  }

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await saveCfg({
        ...cfg,
        targets: { ...cfg.targets, [month]: toP(tg) },
        budgets: { ...cfg.budgets, [month]: toP(bd) },
        email: em.trim()
      })
      setMsgType('success')
      setMsg('Settings saved successfully.')
      setTimeout(() => setMsg(''), 4000)
    } catch (err) {
      console.error(err)
      setMsgType('error')
      setMsg('Failed to save settings.')
    }
  }

  const handleDownloadBackup = async () => {
    try {
      const payload = createBackupPayload(cfg, tx, accounts, categories, goals)
      const filename = `hisaab-backup-${today()}.json`
      downloadFile(filename, JSON.stringify(payload, null, 2), 'application/json')

      await saveCfg({
        ...cfg,
        lastBackup: new Date().toISOString()
      })
      setMsgType('success')
      setMsg('Full backup file downloaded. Keep it in a secure location such as Google Drive or an encrypted drive.')
    } catch (err) {
      console.error(err)
      setMsgType('error')
      setMsg('Failed to create backup.')
    }
  }

  const handleRestoreFile = async (f?: File) => {
    if (!f) return
    try {
      const text = await f.text()
      const result = parseHisaabBackup(text)

      const haveTx = new Set(tx.map(x => x.id))
      const newTx = result.tx.filter(x => !haveTx.has(x.id))

      const haveAcc = new Set(accounts.map(x => x.id))
      const newAcc = result.accounts.filter(x => !haveAcc.has(x.id))

      const haveCat = new Set(categories.map(x => x.name.toLowerCase()))
      const newCat = result.categories.filter(x => !haveCat.has(x.name.toLowerCase()))

      const haveGoal = new Set(goals.map(x => x.id))
      const newGoal = result.goals.filter(x => !haveGoal.has(x.id))

      const confirmText =
        `Backup Validation (Version ${result.version}):\n` +
        `• ${result.tx.length} transactions found (${newTx.length} new to add)\n` +
        `• ${result.accounts.length} accounts found (${newAcc.length} new)\n` +
        `• ${result.categories.length} categories found (${newCat.length} new)\n` +
        `• ${result.goals.length} goals found (${newGoal.length} new)\n` +
        (result.skipped > 0 ? `• ${result.skipped} invalid records were safely skipped\n` : '') +
        `\nExisting records are never overwritten. Proceed with safe restore?`

      if (!confirm(confirmText)) return

      const restored = await restoreBackupData(result)
      setMsgType('success')
      setMsg(
        `Restoration complete: Added ${restored.addedTx} transactions, ${restored.addedAccounts} accounts, ${restored.addedCategories} categories, and ${restored.addedGoals} goals.${result.skipped > 0 ? ` (${result.skipped} invalid entries were skipped).` : ''}`
      )
    } catch (err: any) {
      console.error(err)
      setMsgType('error')
      setMsg(err?.message || 'That file is not a valid Hisaab backup. No records were modified.')
    }
  }

  return (
    <div className="settings-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Settings & Privacy</h1>
          <p className="page-subtitle">Configure preferences, appearance, and data management.</p>
        </div>
      </header>

      {msg && (
        <div className={`notice-banner ${msgType === 'error' ? 'error' : 'success'}`}>
          {msgType === 'success' && <CheckCircle2 size={18} />}
          <span>{msg}</span>
        </div>
      )}

      {/* Monthly Targets & Budgets */}
      <section className="clay-card settings-section">
        <h2 className="section-title-clean">Financial Targets for {monthName(month)}</h2>

        <form onSubmit={handleSavePreferences}>
          <div className="form-group">
            <label htmlFor="settings-month" className="field-label">
              Selected Month
            </label>
            <input
              id="settings-month"
              type="month"
              className="clay-input"
              value={month}
              onChange={e => e.target.value && pickMonth(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="settings-target" className="field-label">
                Savings Target (₹)
              </label>
              <input
                id="settings-target"
                className="clay-input"
                inputMode="decimal"
                placeholder="0"
                value={tg}
                onChange={e => setTg(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="settings-budget" className="field-label">
                Spending Limit (₹)
              </label>
              <input
                id="settings-budget"
                className="clay-input"
                inputMode="decimal"
                placeholder="0"
                value={bd}
                onChange={e => setBd(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="settings-email" className="field-label">
              Gmail Address for Pre-filling Reports
            </label>
            <input
              id="settings-email"
              type="email"
              className="clay-input"
              placeholder="e.g. your.email@gmail.com"
              value={em}
              onChange={e => setEm(e.target.value)}
            />
          </div>

          <button type="submit" className="btn primary wide-btn" style={{ marginTop: '12px' }}>
            Save Preferences
          </button>
        </form>
      </section>

      {/* Appearance */}
      <section className="clay-card settings-section">
        <h2 className="section-title-clean">Appearance & Theme</h2>
        <p className="small muted" style={{ marginBottom: '14px' }}>
          Choose your visual preference. Hisaab uses subtle claymorphism with soft, eye-friendly tones.
        </p>

        <div className="clay-segment theme-seg" role="group" aria-label="Theme selection">
          <button
            type="button"
            className={`clay-seg-btn ${theme === 'auto' ? 'active' : ''}`}
            onClick={() => setTheme('auto')}
          >
            <SunMoon size={16} /> Auto (System)
          </button>
          <button
            type="button"
            className={`clay-seg-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={16} /> Light
          </button>
          <button
            type="button"
            className={`clay-seg-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={16} /> Dark
          </button>
        </div>
      </section>

      {/* Backup and Restore */}
      <section className="clay-card settings-section">
        <h2 className="section-title-clean">Data Backup & Restoration</h2>
        <p className="small muted" style={{ marginBottom: '16px' }}>
          Export a complete, encrypted-ready JSON snapshot of your accounts, categories, transactions, budgets, and savings goals.
        </p>

        <div className="form-actions-stacked">
          <button
            type="button"
            className="btn secondary wide-btn"
            onClick={handleDownloadBackup}
          >
            <Download size={18} /> Download Full Backup ({tx.length} transactions, {accounts.length} accounts)
          </button>

          <label className="btn secondary wide-btn file-input-label">
            <Upload size={18} /> Restore or Import Backup File
            <input
              type="file"
              accept=".json,application/json"
              hidden
              onChange={e => {
                handleRestoreFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
        </div>

        {cfg.lastBackup && (
          <p className="small muted" style={{ marginTop: '12px' }}>
            Last backup downloaded: {new Date(cfg.lastBackup).toLocaleString('en-IN')}
          </p>
        )}
      </section>

      {/* Honest Privacy Architecture */}
      <section className="clay-card settings-section privacy-card">
        <div className="privacy-header">
          <ShieldCheck size={22} className="gain" />
          <h2 className="section-title-clean" style={{ margin: 0 }}>
            Privacy-First Architecture
          </h2>
        </div>

        <p className="small" style={{ lineHeight: '1.6', marginTop: '10px' }}>
          <b>100% Local & Private:</b> Your financial transactions, account balances, and budgets are stored exclusively in your browser’s local IndexedDB database (<code>hisaab-app</code>).
        </p>
        <p className="small" style={{ lineHeight: '1.6' }}>
          <b>No Remote Servers:</b> There is no remote backend, no telemetry, no tracking analytics, and no cloud database. Hisaab never transmits your financial data anywhere.
        </p>
        <p className="small" style={{ lineHeight: '1.6' }}>
          <b>Data Safety:</b> Data is stored locally in the browser sandbox. Because standard browser storage is not encrypted at rest by default, anyone with physical access to your unlocked device could inspect the local database. Always maintain device passcode protection and download regular backup files.
        </p>
      </section>
    </div>
  )
}

export default Settings
