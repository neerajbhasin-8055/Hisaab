import { useState } from 'react'
import { Download } from 'lucide-react'
import { useStore } from '../store'
import { TxRows, ScopeSelect } from '../components'
import { Scope, download, inScope, newest, toCsv, today } from '../lib'
export default function History({ edit }: { edit: (id: string) => void }) {
  const { tx, delTx } = useStore(); const [q, setQ] = useState(''), [ft, setFt] = useState(''), [scope, setScope] = useState<Scope>('all'), [from, setFrom] = useState(''), [to, setTo] = useState('')
  const a = inScope(tx, scope).filter(x => (!ft || x.type === ft) && (!from || x.date >= from) && (!to || x.date <= to) && (!q || (x.cat + ' ' + x.note).toLowerCase().includes(q.toLowerCase()))).sort(newest)
  return <><h1>History</h1><input type="search" placeholder="Search notes and categories" value={q} onChange={e => setQ(e.target.value)} />
    <div className="grid"><select aria-label="Type" value={ft} onChange={e => setFt(e.target.value)}><option value="">All types</option><option value="in">Income</option><option value="out">Expenses</option></select><ScopeSelect value={scope} onChange={setScope} />
      <label className="small">From<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label className="small">To<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label></div>
    <div className="card"><TxRows items={a.slice(0, 300)} onEdit={edit} onDelete={id => { if (confirm('Delete this transaction? This cannot be undone.')) delTx(id) }} /></div>
    {a.length > 300 && <p className="muted small">Showing the newest 300 of {a.length}. Reports and CSV include all.</p>}
    <button className="btn" onClick={() => download('hisaab-transactions-' + today() + '.csv', toCsv(a), 'text/csv')}><Download /> Download CSV ({a.length})</button></>
}
