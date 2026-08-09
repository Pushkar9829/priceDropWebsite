import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/shop';
import { clearToken, getToken, setToken, TOKEN_KEY } from '../api/client';

const AuthContext = createContext(null);
const USER_KEY = 'pc_web_user';

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [booting, setBooting] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setBooting(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const me = await authApi.me();
        if (cancelled) return;
        setUser(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
      } catch {
        if (!cancelled) {
          clearToken();
          localStorage.removeItem(USER_KEY);
          setTokenState(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const persist = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setTokenState(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await authApi.login({ email, password });
      persist(data.token, data.user);
      return data.user;
    },
    [persist]
  );

  const register = useCallback(
    async ({ name, email, password }) => {
      const data = await authApi.register({ name, email, password });
      persist(data.token, data.user);
      return data.user;
    },
    [persist]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    clearToken();
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      booting,
      isAuthenticated: !!token && !!user,
      login,
      register,
      logout,
    }),
    [token, user, booting, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
