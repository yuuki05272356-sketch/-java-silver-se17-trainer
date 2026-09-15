const STATE_KEY = 'javaSilver17Trainer:javaEdition:state:v1';
const SESSION_KEY = 'javaSilver17Trainer:javaEdition:activeSession:v1';

const defaultState = () => ({
  version: 1,
  questionStats: {},
  reviewIds: [],
  unknownIds: [],
  examHistory: [],
  lastUpdatedAt: null
});

export class LocalStorageAdapter {
  loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
    } catch (error) {
      console.warn('Failed to load state.', error);
      return defaultState();
    }
  }

  saveState(state) {
    const next = { ...state, lastUpdatedAt: new Date().toISOString() };
    localStorage.setItem(STATE_KEY, JSON.stringify(next));
    return next;
  }

  loadActiveSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('Failed to load session.', error);
      return null;
    }
  }

  saveActiveSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  clearActiveSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  resetAll() {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
}

// 将来Supabase版に差し替えるため、保存処理はUIから分離。
export const storage = new LocalStorageAdapter();
