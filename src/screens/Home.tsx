import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useStore } from '../store'
import { TxRows, ScopeSelect } from '../components'
import { Scope, addDays, addMonths, byCategory, fmt, inScope, monthName, newest, sum, today } from '../lib'
export default function Home({ go }: { go: (t: string, extra?: string) => void }) {
  const { tx, cfg } = useStore(); const [month, setMonth] = useState(today().slice(0, 7)); const [scope, setScope] = useState<Scope>('all')
  const all = inScope(tx, scope), mt = all.filter(x => x.date.startsWith(month)), inc = sum(mt, 'in'), ex = sum(mt, 'out'), net = inc - ex
  const tg = cfg.targets[month] || 0, bd = cfg.budgets[month] || 0, pct = tg > 0 ? Math.max(0, Math.round(net / tg * 100)) : 0
  const status = tg <= 0 ? 'No target set' : net > tg ? 'Exceeded' : net === tg ? 'Achieved' : 'In progress'
  const td = today(), cats = byCategory(mt), prev = addMonths(td.slice(0, 7), -1)
  const trend = [5, 4, 3, 2, 1, 0].map(i => { const m = addMonths(td.slice(0, 7), -i), a = all.filter(x => x.date.startsWith(m)); return { m: m.slice(5), Income: sum(a, 'in') / 100, Expenses: sum(a, 'out') / 100 } })
  const needBackup = tx.length > 0 && (!cfg.lastBackup || Date.now() - new Date(cfg.lastBackup).getTime() > 30 * 864e5)
  return <>
    <header className="top"><div className="brand-lockup"><div className="brand-mark">h.</div><div><h1>Hisaab</h1><p className="page-subtitle">A clearer view of your money.</p></div></div><ScopeSelect value={scope} onChange={setScope} /></header>
    <div className="stepper"><button className="icon" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft /></button><b>{monthName(month)}</b><button className="icon" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight /></button></div>
    {tx.some(x => x.date.startsWith(prev)) && month === td.slice(0, 7) && <div className="card notice">Last month’s report is ready to create. <button className="link" onClick={() => go('reports', prev)}>Open report</button></div>}
    {needBackup && <div className="card notice">Your data lives only on this phone. <button className="link" onClick={() => go('settings')}>Back up now</button></div>}
    <section className="card hero"><div className="hero-label">MONTHLY NET CASH FLOW</div><div className={'big ' + (net < 0 ? 'loss' : '')}>{fmt(net)}</div><div className="muted">Income minus expenses · {monthName(month)}</div>
      {tg > 0 ? <><div className="bar"><i style={{ width: Math.min(100, pct) + '%' }} /></div><div className="hero-foot"><span>{pct}% of {fmt(tg)} · <b>{status}</b></span><span>{net >= tg ? 'Above target: ' + fmt(net - tg) : 'Remaining: ' + fmt(tg - net)}</span></div></> : <div className="small">Set a savings target in Settings to track progress.</div>}
    </section>
    <div className="dashboard-grid"><div className="card metric"><span className="metric-label"><i className="metric-dot" /> Money in</span><b className="gain">{fmt(inc)}</b></div><div className="card metric"><span className="metric-label"><i className="metric-dot" style={{background:'var(--loss)'}} /> Money out</span><b className="loss">{fmt(ex)}</b></div>
      <div className="card metric"><span className="metric-label">Today’s spend</span><b>{fmt(sum(all.filter(x => x.date === td), 'out'))}</b></div><div className="card metric"><span className="metric-label">Last 7 days</span><b>{fmt(sum(all.filter(x => x.date >= addDays(td, -6) && x.date <= td), 'out'))}</b></div></div>
    {bd > 0 && <div className="card"><div className="muted small">Monthly budget {fmt(bd)}</div><div className={'bar ' + (ex > bd ? 'over' : '')}><i style={{ width: Math.min(100, ex / bd * 100) + '%' }} /></div><b className={ex > bd ? 'loss' : ''}>{ex > bd ? 'Over budget by ' + fmt(ex - bd) : fmt(bd - ex) + ' left'}</b></div>}
    <button className="btn primary wide" onClick={() => go('add')}><Plus /> Add transaction</button>
    <div className="section-title"><h2>Spending by category</h2><span className="small muted">This month</span></div>
    <div className="card">{cats.length ? cats.map(([c, v]) => <div key={c}><div className="between"><span>{c}</span><b>{fmt(v)}</b></div><div className="bar"><i style={{ width: v / cats[0][1] * 100 + '%' }} /></div></div>) : <p className="muted">No expenses this month yet. Tap “Add transaction” to record the first one.</p>}</div>
    <div className="section-title"><h2>Cash flow trend</h2><span className="small muted">Last 6 months</span></div>
    <div className="card dashboard-chart"><ResponsiveContainer><BarChart data={trend}><XAxis dataKey="m" tickLine={false} axisLine={false} /><Tooltip formatter={(v: number) => '₹' + v.toLocaleString('en-IN')} /><Bar dataKey="Income" fill="var(--emerald)" radius={[4, 4, 0, 0]} /><Bar dataKey="Expenses" fill="var(--gold)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
    <div className="section-title"><h2>Recent activity</h2><button className="link" onClick={() => go('history')}>View all</button></div><div className="card"><TxRows items={[...all].sort(newest).slice(0, 5)} /></div>
    <p className="small muted">Savings here means cash in minus cash out recorded in Hisaab. It is not accounting profit.</p></>
}
