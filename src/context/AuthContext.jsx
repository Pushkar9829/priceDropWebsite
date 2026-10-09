import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, setUnauthorizedHandler, tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(() => Boolean(tokenStore.get()));

  const clear = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Any 401 on an authenticated request (expired token, password changed) signs the user out
  useEffect(() => {
    setUnauthorizedHandler(clear);
    return () => setUnauthorizedHandler(null);
  }, [clear]);

  useEffect(() => {
    if (!tokenStore.get()) return;
    let cancelled = false;
    let retry;
    const load = (attempt) =>
      authApi
        .me()
        .then((me) => !cancelled && setUser(me))
        .catch((err) => {
          if (cancelled) return;
          // Only a real auth failure signs the user out — offline/5xx/429 (e.g. host waking up) keep the token
          if (err?.status === 401) clear();
          else if (attempt < 2) retry = setTimeout(() => load(attempt + 1), 4000 * (attempt + 1));
        })
        .finally(() => !cancelled && setBooting(false));
    load(0);
    return () => {
      cancelled = true;
      clearTimeout(retry);
    };
  }, [clear]);

  // Sign-out / sign-in in another tab applies here too
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'pc_token') return;
      if (!e.newValue) setUser(null);
      else authApi.me().then(setUser).catch(() => {});
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const applySession = useCallback(({ token, user: nextUser }) => {
    tokenStore.set(token);
    setUser(nextUser);
    return nextUser;
  }, []);

  const login = useCallback((email, password) => authApi.login({ email, password }).then(applySession), [applySession]);
  const register = useCallback((body) => authApi.register(body).then(applySession), [applySession]);
  const changePassword = useCallback((body) => authApi.changePassword(body).then(applySession), [applySession]);
  const updateProfile = useCallback((body) => authApi.updateMe(body).then(setUser), []);

  const logout = useCallback(async () => {
    authApi.logout().catch(() => {});
    clear();
  }, [clear]);

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      changePassword,
      updateProfile,
    }),
    [user, booting, login, register, logout, changePassword, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
