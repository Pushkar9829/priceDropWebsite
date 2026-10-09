import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button, ErrorBanner, Input } from '../../components/ui';
import { Logo } from '../../components/site/SiteLayout';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../lib/hooks';

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="theme-dark grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
        </div>
      </div>
      <div className="relative hidden overflow-hidden border-l border-white/5 bg-[#121414] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(40rem_30rem_at_80%_10%,rgb(47_201_127/0.35),transparent),radial-gradient(30rem_20rem_at_10%_90%,rgb(16_185_129/0.35),transparent)]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-[#fafafa]">
          <p className="max-w-md text-3xl leading-tight font-bold">
            Compare every store. <span className="text-[#2fc97f]">Buy at the right moment.</span>
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-600">
            {['Compare Amazon, Flipkart, Croma & more', 'Full price history on every product', 'Alerts the moment your target is hit'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-400" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-1 bottom-0 grid size-10 place-items-center rounded-lg text-slate-400 hover:text-slate-600"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
      </button>
    </div>
  );
}

const afterLogin = (user, from) => from || (user.role === 'ADMIN' ? '/admin' : '/');

export function Login() {
  useDocumentTitle('Sign in');
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to={afterLogin(user, from)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const u = await login(form.email.trim(), form.password);
      navigate(afterLogin(u, from), { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your watchlist and alerts."
      footer={
        <>
          New here?{' '}
          <Link to="/register" state={{ from }} className="font-semibold text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner error={error} />
        <Input label="Email" name="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export function Register() {
  useDocumentTitle('Create account');
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to={afterLogin(user, from)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate(from || '/', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your free account"
      subtitle="Track prices and get alerted when they drop."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={{ from }} className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner error={error} />
        <Input label="Name" name="name" autoComplete="name" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Email" name="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}

export { PasswordInput };
