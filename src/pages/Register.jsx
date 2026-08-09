import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register({ name, email, password });
      navigate('/watchlist', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container flex justify-center py-16">
      <div className="w-full max-w-md rounded-md border border-line bg-elevated p-8 shadow-[var(--shadow-soft)]">
        <h1 className="text-2xl">Join PriceCompare</h1>
        <p className="muted mt-2">Track products and get pinged on price drops.</p>
        {error ? <div className="error-banner mt-4">{error}</div> : null}
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
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
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="muted mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-teal">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
