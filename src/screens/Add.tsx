import { useState } from 'react'
import { useStore } from '../store'
import { Cls, EXP, INC, Kind, METHODS, Tx, fmt, toP, today } from '../lib'
export default function Add({ editId, done }: { editId: string | null; done: () => void }) {
  const { tx, saveTx } = useStore(); const e = tx.find(x => x.id === editId)
  const [type, setType] = useState<Kind>(e?.type ?? 'out'), [amt, setAmt] = useState(e ? String(e.amt / 100) : ''), [cat, setCat] = useState(e?.cat ?? 'Tea and snacks')
  const [cls, setCls] = useState<Cls>(e?.cls ?? 'personal'), [method, setMethod] = useState(e?.method ?? 'Cash'), [date, setDate] = useState(e?.date ?? today()), [time, setTime] = useState(e?.time ?? ''), [note, setNote] = useState(e?.note ?? '')
  const [msg, setMsg] = useState(''), [err, setErr] = useState('')
  const flip = (t: Kind) => { setType(t); setCat(t === 'in' ? INC[0] : EXP[1]) }
  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault(); const p = toP(amt)
    if (!p) return setErr('Enter an amount greater than zero.'); if (!date) return setErr('Choose a date.')
    const rec: Tx = { ...(e ?? { id: crypto.randomUUID(), created: Date.now() }), type, amt: p, cat, cls, method, date, time, note: note.trim(), modified: Date.now() }
    await saveTx(rec); setErr('')
    if (e) return done()
    setMsg('Saved ' + fmt(p) + '. Add another, or go back to Home.'); setAmt(''); setNote('')
  }
  return <form onSubmit={submit}><h1>{e ? 'Edit' : 'Add'} transaction</h1>
    {msg && <div className="card notice" role="status">{msg}</div>}{err && <div className="card notice loss" role="alert">{err}</div>}
    <div className="seg"><button type="button" className={type === 'out' ? 'on' : ''} onClick={() => flip('out')}>Expense</button><button type="button" className={type === 'in' ? 'on' : ''} onClick={() => flip('in')}>Income</button></div>
    <label>Amount (₹)<input className="amount" inputMode="decimal" autoFocus placeholder="0" value={amt} onChange={x => setAmt(x.target.value)} /></label>
    <label>{type === 'in' ? 'Source' : 'Category'}<select value={cat} onChange={x => setCat(x.target.value)}>{(type === 'in' ? INC : EXP).map(c => <option key={c}>{c}</option>)}</select></label>
    <div className="grid"><label>For<select value={cls} onChange={x => setCls(x.target.value as Cls)}><option value="personal">Personal</option><option value="business">Business</option><option value="shared">Shared</option></select></label>
      <label>{type === 'in' ? 'Received by' : 'Paid by'}<select value={method} onChange={x => setMethod(x.target.value)}>{METHODS.map(c => <option key={c}>{c}</option>)}</select></label>
      <label>Date<input type="date" value={date} onChange={x => setDate(x.target.value)} /></label><label>Time (optional)<input type="time" value={time} onChange={x => setTime(x.target.value)} /></label></div>
    <label>Note (optional)<input value={note} maxLength={200} onChange={x => setNote(x.target.value)} /></label>
    <div className="grid"><button className="btn primary" type="submit">Save</button><button className="btn" type="button" onClick={done}>{e ? 'Cancel' : 'Back to Home'}</button></div></form>
}
