import { fetchBuiltinCatalog } from './catalog-api';
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { loadDatabase, saveDatabase, replaceAccount } from './store';
import type { Account, Database } from './store';

type AppState = {
  db: Database;
  account: Account | null;
  commit: (db: Database) => void;
  update: (account: Account) => void;
  notify: (message: string) => void;
  toast: string;
  clearToast: () => void;
  logTarget: { workId: string; logId?: string } | null;
  openLog: (workId: string, logId?: string) => void;
  closeLog: () => void;
};
const State = createContext<AppState | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [logTarget, setLogTarget] = useState<{ workId: string; logId?: string } | null>(null);
  const openLog = useCallback(
    (workId: string, logId?: string) => setLogTarget({ workId, logId }),
    [],
  );
  const closeLog = useCallback(() => setLogTarget(null), []);
  const [db, setDb] = useState(loadDatabase);
  const [catalogRevision, setCatalogRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetchBuiltinCatalog(controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setCatalogRevision((v) => v + 1);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const [toast, setToast] = useState('');
  const commit = useCallback((next: Database) => {
    try {
      saveDatabase(next);
    } catch {
      throw new Error(
        'Could not save on this device. Check that storage is available and try again.',
      );
    }
    setDb(next);
  }, []);
  const notify = useCallback((message: string) => setToast(message), []);
  const update = useCallback(
    (account: Account) => commit(replaceAccount(db, account)),
    [commit, db],
  );
  const clearToast = useCallback(() => setToast(''), []);
  const value = useMemo(
    () => ({
      db,
      account: db.accounts.find((a) => a.id === db.activeId) ?? null,
      commit,
      update,
      notify,
      toast,
      clearToast,
      logTarget,
      openLog,
      closeLog,
    }),
    [db, commit, update, notify, toast, clearToast, logTarget, openLog, closeLog, catalogRevision],
  );
  return <State.Provider value={value}>{children}</State.Provider>;
}
export function useStore() {
  const state = useContext(State);
  if (!state) throw Error('StoreProvider missing');
  return state;
}
