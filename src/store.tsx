import Dexie, { Table } from 'dexie'
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import type { Cfg, Tx } from './lib'
class DB extends Dexie {
  tx!: Table<Tx, string>; kv!: Table<{ k: string; v: Cfg }, string>
  constructor() { super('hisaab-app'); this.version(1).stores({ tx: 'id,date', kv: 'k' }) }
}
const db = new DB()
const EMPTY: Cfg = { targets: {}, budgets: {}, email: '', lastBackup: '' }
interface Store { ready: boolean; error: string; tx: Tx[]; cfg: Cfg; saveTx: (t: Tx) => Promise<void>; delTx: (id: string) => Promise<void>; saveCfg: (c: Cfg) => Promise<void>; addMany: (t: Tx[]) => Promise<void> }
const Ctx = createContext<Store>(null as unknown as Store)
export const useStore = () => useContext(Ctx)
export function StoreProvider({ children }: { children: ReactNode }) {
  const [tx, setTx] = useState<Tx[]>([]); const [cfg, setCfg] = useState<Cfg>(EMPTY); const [ready, setReady] = useState(false); const [error, setError] = useState('')
  useEffect(() => { (async () => { try { setTx(await db.tx.toArray()); const c = await db.kv.get('cfg'); if (c) setCfg({ ...EMPTY, ...c.v }); navigator.storage?.persist?.() } catch { setError('Storage is blocked in this browser, so records cannot be saved.') } setReady(true) })() }, [])
  const saveTx = useCallback(async (t: Tx) => { await db.tx.put(t); setTx(p => [...p.filter(x => x.id !== t.id), t]) }, [])
  const delTx = useCallback(async (id: string) => { await db.tx.delete(id); setTx(p => p.filter(x => x.id !== id)) }, [])
  const saveCfg = useCallback(async (c: Cfg) => { await db.kv.put({ k: 'cfg', v: c }); setCfg(c) }, [])
  const addMany = useCallback(async (t: Tx[]) => { await db.tx.bulkPut(t); setTx(p => [...p, ...t]) }, [])
  return <Ctx.Provider value={{ ready, error, tx, cfg, saveTx, delTx, saveCfg, addMany }}>{children}</Ctx.Provider>
}
