import { Scope } from '../types'

export function ScopeSelect({
  value,
  onChange
}: {
  value: Scope
  onChange: (v: Scope) => void
}) {
  return (
    <div className="scope-pill-group" role="group" aria-label="Financial scope">
      {(['all', 'personal', 'business'] as const).map(s => (
        <button
          key={s}
          type="button"
          className={`scope-pill ${value === s ? 'active' : ''}`}
          onClick={() => onChange(s)}
        >
          {s === 'all' ? 'Combined' : s === 'personal' ? 'Personal' : 'Business'}
        </button>
      ))}
    </div>
  )
}
