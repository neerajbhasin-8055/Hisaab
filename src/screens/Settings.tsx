import { useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useStore } from '../store'
import { download, monthName, parseBackup, toP, today } from '../lib'
export default function Settings({ theme, setTheme }: { theme: string; setTheme: (t: string) => void }) {
  const { tx, cfg, saveCfg, addMany } = useStore(); const [month, setMonth] = useState(today().slice(0, 7))
  const [tg, setTg] = useState(String((cfg.targets[month] || 0) / 100 || '')), [bd, setBd] = useState(String((cfg.budgets[month] || 0) / 100 || '')), [em, setEm] = useState(cfg.email), [msg, setMsg] = useState('')
  const pick = (m: string) => { setMonth(m); setTg(String((cfg.targets[m] || 0) / 100 || '')); setBd(String((cfg.budgets[m] || 0) / 100 || '')) }
  const saveAll = async () => { await saveCfg({ ...cfg, targets: { ...cfg.targets, [month]: toP(tg) }, budgets: { ...cfg.budgets, [month]: toP(bd) }, email: em.trim() }); setMsg('Settings saved.') }
  const backup = async () => { download('hisaab-backup-' + today() + '.json', JSON.stringify({ app: 'hisaab', version: 1, exported: new Date().toISOString(), cfg, tx }), 'application/json'); await saveCfg({ ...cfg, lastBackup: new Date().toISOString() }); setMsg('Backup downloaded. Keep the file somewhere safe, such as Google Drive.') }
  const restore = async (f?: File) => {
    if (!f) return
    try {
      const r = parseBackup(await f.text()), have = new Set(tx.map(x => x.id)), fresh = r.tx.filter(x => !have.has(x.id))
      if (!confirm(`This backup has ${r.tx.length} valid records${r.skipped ? ` (${r.skipped} invalid skipped)` : ''}. ${fresh.length} are new and will be added. Existing records are never overwritten. Continue?`)) return
      await addMany(fresh); await saveCfg({ ...cfg, targets: { ...r.targets, ...cfg.targets }, budgets: { ...r.budgets, ...cfg.budgets }, email: cfg.email || r.email })
      setMsg(`Restored ${fresh.length} records.${r.skipped ? ` ${r.skipped} invalid records were skipped.` : ''}`)
    } catch { setMsg('That file is not a valid Hisaab backup. Nothing was changed.') }
  }
  return <><h1>Settings</h1>{msg && <div className="card notice" role="status">{msg}</div>}
    <section className="card"><h2>Targets for {monthName(month)}</h2><label>Month<input type="month" value={month} onChange={e => e.target.value && pick(e.target.value)} /></label>
      <label>Savings target (₹)<input inputMode="decimal" value={tg} onChange={e => setTg(e.target.value)} /></label><label>Spending budget (₹)<input inputMode="decimal" value={bd} onChange={e => setBd(e.target.value)} /></label>
      <label>Gmail address for reports<input type="email" value={em} onChange={e => setEm(e.target.value)} /></label><button className="btn primary wide" onClick={saveAll}>Save settings</button></section>
    <section className="card"><h2>Appearance</h2><div className="seg">{['auto', 'light', 'dark'].map(t => <button key={t} className={theme === t ? 'on' : ''} onClick={() => setTheme(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div></section>
    <section className="card"><h2>Backup and restore</h2><button className="btn wide" onClick={backup}><Download /> Download full backup</button>
      <label className="btn wide"><Upload /> Restore or import a backup<input type="file" accept=".json,application/json" hidden onChange={e => { restore(e.target.files?.[0]); e.target.value = '' }} /></label>
      <p className="small muted">Moving from the earlier Hisaab page? Open it, tap “Download full backup”, then restore that file here. Browsers keep each website’s data separate, so it cannot be copied automatically.</p></section>
    <section className="card"><h2>Privacy</h2><p className="small">Your records are stored only on this device and are never sent anywhere. They are not encrypted, so anyone using your unlocked phone can open them. Clearing browser data, reinstalling or losing the phone can erase them, so back up regularly.</p></section></>
}
