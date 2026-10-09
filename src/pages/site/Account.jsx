import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button, Input, StatusBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../lib/hooks';
import { formatDate } from '../../lib/format';
import { PasswordInput } from './Auth';
import { PageHeader } from './Watchlist';

export default function Account() {
  useDocumentTitle('Account');
  const { user, updateProfile, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => setName(user?.name || ''), [user?.name]);

  const saveName = async (e) => {
    e.preventDefault();
    setSavingName(true);
    try {
      await updateProfile({ name: name.trim() });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingName(false);
    }
  };

  const savePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      await changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed — other sessions were signed out');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="container-page max-w-2xl py-8">
      <PageHeader
        title="Account settings"
        action={
          <Button
            variant="secondary"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        }
      />
      <div className="space-y-6">
        <section className="card p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
              {(user?.name || '?').slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="font-semibold">{user?.email}</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <StatusBadge status={user?.role} /> Member since {formatDate(user?.createdAt, false)}
              </p>
            </div>
          </div>
          <form onSubmit={saveName} className="mt-6 flex items-end gap-3">
            <Input label="Display name" name="name" className="flex-1" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" loading={savingName} disabled={name.trim() === user?.name}>
              Save
            </Button>
          </form>
        </section>

        <section className="card p-6">
          <h2 className="font-semibold">Change password</h2>
          <p className="mt-1 text-sm text-slate-500">Changing your password signs you out on other devices.</p>
          <form onSubmit={savePw} className="mt-5 space-y-4">
            <PasswordInput
              label="Current password"
              name="currentPassword"
              autoComplete="current-password"
              required
              value={pw.currentPassword}
              onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <PasswordInput
                label="New password"
                name="newPassword"
                autoComplete="new-password"
                minLength={8}
                required
                value={pw.newPassword}
                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
              />
              <PasswordInput
                label="Confirm new password"
                name="confirm"
                autoComplete="new-password"
                minLength={8}
                required
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              />
            </div>
            <Button type="submit" loading={savingPw}>
              Update password
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
