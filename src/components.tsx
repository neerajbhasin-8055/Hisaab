import { Briefcase, Car, Coffee, CreditCard, HeartPulse, Home, MoreHorizontal, Package, Pencil, Plane, Receipt, ShoppingBag, Smartphone, Trash2, Users, Wallet } from 'lucide-react'
import { Tx, fmt } from './lib'
const categoryIcon = (category: string, type: string) => {
  const c = category.toLowerCase()
  if (/tea|snack|food|grocer/.test(c)) return Coffee
  if (/rent|house|household|utilit|electric/.test(c)) return Home
  if (/transport|fuel|travel/.test(c)) return /travel/.test(c) ? Plane : Car
  if (/medical|health/.test(c)) return HeartPulse
  if (/shop/.test(c)) return ShoppingBag
  if (/business|sales|customer|material|packag/.test(c)) return Briefcase
  if (/phone|internet/.test(c)) return Smartphone
  if (/emi|loan|payment|refund|salary/.test(c)) return CreditCard
  if (/repair|maintenance/.test(c)) return Package
  if (/family|shared/.test(c)) return Users
  if (/other/.test(c)) return MoreHorizontal
  return type === 'in' ? Wallet : Receipt
}
export function TxRows({ items, onEdit, onDelete }: { items: Tx[]; onEdit?: (id: string) => void; onDelete?: (id: string) => void }) {
  if (!items.length) return <div className="empty-state"><Receipt size={27} /><p>Nothing here yet.</p><span className="small">Your transactions will appear here.</span></div>
  return <>{items.map(x => {
    const Icon = categoryIcon(x.cat, x.type)
    return <div className="row" key={x.id}>
      <div className="tx-main"><div className="row-icon"><Icon size={19} strokeWidth={1.8} /></div><div><b>{x.cat}</b><div className="tx-meta">{x.date}{x.time ? ' · ' + x.time : ''} · {x.cls} · {x.method}</div>{x.note && <div className="small muted">{x.note}</div>}</div></div>
      <div className="right"><b className={x.type === 'in' ? 'gain' : 'loss'}>{x.type === 'in' ? '+' : '−'}{fmt(x.amt)}</b>
        {onEdit && onDelete && <div className="acts"><button className="icon" aria-label="Edit" onClick={() => onEdit(x.id)}><Pencil size={16} /></button><button className="icon danger" aria-label="Delete" onClick={() => onDelete(x.id)}><Trash2 size={16} /></button></div>}
      </div></div>
  })}</>
}
export const ScopeSelect = ({ value, onChange }: { value: string; onChange: (v: any) => void }) => (
  <select className="scope-select" aria-label="View" value={value} onChange={e => onChange(e.target.value)}><option value="all">Combined</option><option value="personal">Personal</option><option value="business">Business</option></select>)
