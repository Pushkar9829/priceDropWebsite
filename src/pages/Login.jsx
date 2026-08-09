import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('user@pricecompare.local');
  const [password, setPassword] = useState('User@12345');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate(location.state?.from || '/watchlist', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container flex justify-center py-16">
      <div className="w-full max-w-md rounded-md border border-line bg-elevated p-8 shadow-[var(--shadow-soft)]">
        <h1 className="text-2xl">Welcome back</h1>
        <p className="muted mt-2">Log in to manage watchlists and price alerts.</p>
        {error ? <div className="error-banner mt-4">{error}</div> : null}
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Log in'}
          </button>
        </form>
        <p className="muted mt-6 text-sm">
          New here?{' '}
          <Link to="/register" className="font-semibold text-teal">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
