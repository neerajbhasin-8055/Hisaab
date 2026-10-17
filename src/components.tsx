import { Pencil, Trash2 } from 'lucide-react'
import { Tx, fmt } from './lib'
export function TxRows({ items, onEdit, onDelete }: { items: Tx[]; onEdit?: (id: string) => void; onDelete?: (id: string) => void }) {
  if (!items.length) return <p className="muted">Nothing here yet.</p>
  return <>{items.map(x => (
    <div className="row" key={x.id}>
      <div><b>{x.cat}</b><div className="muted small">{x.date}{x.time ? ' ' + x.time : ''} · {x.cls} · {x.method}</div>{x.note && <div className="small">{x.note}</div>}</div>
      <div className="right"><b className={x.type === 'in' ? 'gain' : 'loss'}>{x.type === 'in' ? '+' : '−'}{fmt(x.amt)}</b>
        {onEdit && onDelete && <div className="acts"><button className="icon" aria-label="Edit" onClick={() => onEdit(x.id)}><Pencil size={18} /></button><button className="icon danger" aria-label="Delete" onClick={() => onDelete(x.id)}><Trash2 size={18} /></button></div>}
      </div></div>))}</>
}
export const ScopeSelect = ({ value, onChange }: { value: string; onChange: (v: any) => void }) => (
  <select aria-label="View" value={value} onChange={e => onChange(e.target.value)}><option value="all">Combined</option><option value="personal">Personal</option><option value="business">Business</option></select>)
