import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Download, FileText, LayoutDashboard, List, Plus, RefreshCw, Settings as Cog, WifiOff } from 'lucide-react'
import { useStore } from './store'
import Home from './screens/Home'
import Add from './screens/Add'
import History from './screens/History'
import Reports from './screens/Reports'
import Settings from './screens/Settings'
export default function App() {
  const { ready, error } = useStore(); const [tab, setTab] = useState('home'), [editId, setEditId] = useState<string | null>(null), [rep, setRep] = useState<string | undefined>()
  const [theme, setThemeState] = useState(localStorage.getItem('theme') || 'auto'), [online, setOnline] = useState(navigator.onLine), [inst, setInst] = useState<any>(null)
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  useEffect(() => { const mq = matchMedia('(prefers-color-scheme: dark)'), ap = () => document.documentElement.dataset.theme = theme === 'auto' ? (mq.matches ? 'dark' : 'light') : theme; ap(); mq.addEventListener('change', ap); return () => mq.removeEventListener('change', ap) }, [theme])
  useEffect(() => { const on = () => setOnline(true), off = () => setOnline(false), bi = (e: Event) => { e.preventDefault(); setInst(e) }; addEventListener('online', on); addEventListener('offline', off); addEventListener('beforeinstallprompt', bi); return () => { removeEventListener('online', on); removeEventListener('offline', off); removeEventListener('beforeinstallprompt', bi) } }, [])
  const setTheme = (t: string) => { localStorage.setItem('theme', t); setThemeState(t) }
  const go = (t: string, extra?: string) => { setTab(t); setEditId(null); setRep(extra); scrollTo(0, 0) }
  if (!ready) return <main><p>Loading…</p></main>
  const nav = [['home', 'Home', LayoutDashboard], ['history', 'History', List], ['add', 'Add', Plus], ['reports', 'Reports', FileText], ['settings', 'Settings', Cog]] as const
  return <><main>
    {error && <div className="card notice loss" role="alert">{error}</div>}
    {!online && <div className="card notice"><WifiOff size={16} /> You are offline. Hisaab still works and saves on this device.</div>}
    {needRefresh && <div className="card notice"><RefreshCw size={16} /> A new version is ready. <button className="link" onClick={() => updateServiceWorker(true)}>Update now</button></div>}
    {inst && <div className="card notice"><Download size={16} /> Install Hisaab on your home screen. <button className="link" onClick={async () => { inst.prompt(); await inst.userChoice; setInst(null) }}>Install</button></div>}
    {tab === 'home' && <Home go={go} />}{tab === 'add' && <Add key={editId ?? 'new'} editId={editId} done={() => go(editId ? 'history' : 'home')} />}
    {tab === 'history' && <History edit={id => { setEditId(id); setTab('add') }} />}{tab === 'reports' && <Reports key={rep ?? 'now'} initial={rep} />}{tab === 'settings' && <Settings theme={theme} setTheme={setTheme} />}
  </main>
  <nav className="noprint" aria-label="Main">{nav.map(([k, l, I]) => <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k} onClick={() => go(k)}><I size={22} />{l}</button>)}</nav></>
}
