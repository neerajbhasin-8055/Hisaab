import { useState } from 'react'
import { Mail, Printer } from 'lucide-react'
import { useStore } from '../store'
import { ScopeSelect } from '../components'
import { Scope, addDays, byCategory, fmt, inScope, monthEnd, monthName, sum, today } from '../lib'
export default function Reports({ initial }: { initial?: string }) {
  const { tx, cfg } = useStore(); const m0 = initial || today().slice(0, 7)
  const [from, setFrom] = useState(m0 + '-01'), [to, setTo] = useState(monthEnd(m0)), [scope, setScope] = useState<Scope>('all')
  const a = inScope(tx, scope).filter(x => x.date >= from && x.date <= to).sort((x, y) => (x.date + (x.time || '') < y.date + (y.time || '') ? -1 : 1))
  const inc = sum(a, 'in'), ex = sum(a, 'out'), ms = from.slice(0, 7), full = from === ms + '-01' && to === monthEnd(ms), tg = cfg.targets[ms] || 0, bd = cfg.budgets[ms] || 0
  const mail = 'mailto:' + encodeURIComponent(cfg.email) + '?subject=' + encodeURIComponent('Monthly Financial Report — ' + monthName(ms)) + '&body=' + encodeURIComponent(`Hello,\n\nMy Hisaab report for ${from} to ${to} is attached.\n\nIncome: ${fmt(inc)}\nExpenses: ${fmt(ex)}\nNet: ${fmt(inc - ex)}\n`)
  return <><div className="noprint"><h1>Your reports</h1><p className="page-subtitle">A considered view of where your money goes.</p>
    <div className="grid"><label className="small">From<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label className="small">To<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label></div>
    <div className="grid"><button className="btn" onClick={() => { setFrom(today()); setTo(today()) }}>Today</button><button className="btn" onClick={() => { const m = today().slice(0, 7); setFrom(m + '-01'); setTo(monthEnd(m)) }}>This month</button>
      <button className="btn" onClick={() => { const d = addDays(today().slice(0, 7) + '-01', -1); setFrom(d.slice(0, 7) + '-01'); setTo(d) }}>Last month</button><ScopeSelect value={scope} onChange={setScope} /></div>
    <div className="grid"><button className="btn primary" onClick={() => window.print()}><Printer /> Print or save PDF</button><a className="btn" href={mail}><Mail /> Gmail draft</a></div>
    <p className="small muted">In the print window choose “Save as PDF”. Gmail cannot attach it for you: open the draft, attach the saved file, and press Send yourself. Opening the draft does not send anything.{!cfg.email && ' Save your Gmail address in Settings to prefill the recipient.'}</p></div>
    <section className="card"><h2>Hisaab report: {from} to {to}</h2><p className="small">Generated {today()} · {scope === 'all' ? 'Combined' : scope}</p>
      <div className="grid"><div><span className="muted small">Income</span><br /><b className="gain">{fmt(inc)}</b></div><div><span className="muted small">Expenses</span><br /><b className="loss">{fmt(ex)}</b></div><div><span className="muted small">Net cash flow</span><br /><b>{fmt(inc - ex)}</b></div>
        {full && tg > 0 && <div><span className="muted small">Savings target {fmt(tg)}</span><br /><b>{inc - ex >= tg ? 'Surplus ' + fmt(inc - ex - tg) : 'Remaining ' + fmt(tg - (inc - ex))}</b></div>}{full && bd > 0 && <div><span className="muted small">Budget {fmt(bd)}</span><br /><b>{ex > bd ? 'Over by ' + fmt(ex - bd) : 'Left ' + fmt(bd - ex)}</b></div>}</div>
      <h2>Expenses by category</h2><table><tbody>{byCategory(a).map(([c, v]) => <tr key={c}><td>{c}</td><td className="r">{fmt(v)}</td></tr>)}{!ex && <tr><td>No expenses in this period.</td></tr>}</tbody></table>
      <h2>Personal, business and shared</h2><table><thead><tr><th></th><th className="r">In</th><th className="r">Out</th><th className="r">Net</th></tr></thead><tbody>{(['personal', 'business', 'shared'] as const).map(c => { const s = a.filter(x => x.cls === c); return <tr key={c}><td>{c}</td><td className="r">{fmt(sum(s, 'in'))}</td><td className="r">{fmt(sum(s, 'out'))}</td><td className="r">{fmt(sum(s, 'in') - sum(s, 'out'))}</td></tr> })}</tbody></table>
      <h2>All transactions ({a.length})</h2><table><thead><tr><th>Date</th><th>Details</th><th className="r">Amount</th></tr></thead><tbody>{a.map(x => <tr key={x.id}><td>{x.date}{x.time ? ' ' + x.time : ''}</td><td>{x.cat} {x.note}<br /><span className="muted small">{x.cls} · {x.method}</span></td><td className={'r ' + (x.type === 'in' ? 'gain' : 'loss')}>{x.type === 'in' ? '+' : '−'}{fmt(x.amt)}</td></tr>)}{!a.length && <tr><td colSpan={3}>No transactions in this period.</td></tr>}</tbody></table>
      <p className="small muted">Net cash flow is money in minus money out. It leaves out costs you did not record, so it is not accounting profit.</p></section></>
}
