import { useState, useSyncExternalStore } from 'react';
import type { FormEvent } from 'react';
import { LockKeyhole, Save, ShieldCheck } from 'lucide-react';
import { api, jsonBody, session } from '../services/api';
import { Notice, PageHeader } from '../components/ui';

export function AccountPage() {
  const auth = useSyncExternalStore(session.subscribe, session.getSnapshot)!;
  const [name, setName] = useState(auth.user.ho_ten);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (busy) {
      return;
    }
    setBusy('profile');
    setError('');
    setNotice('');

    try {
      await session.updateProfile(name);
      setNotice('Đã cập nhật hồ sơ.');
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy('');
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (busy) {
      return;
    }
    setError('');
    setNotice('');

    if (newPassword !== confirm) {
      setError('Mật khẩu nhập lại chưa khớp.');
      return;
    }
    if (new TextEncoder().encode(newPassword).length > 72) {
      setError('Mật khẩu tối đa 72 byte.');
      return;
    }

    setBusy('password');
    try {
      await api(
        '/auth/change-password',
        jsonBody('POST', { mat_khau_cu: oldPassword, mat_khau_moi: newPassword })
      );
      await session.logout().catch(() => undefined);
      session.clear();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy('');
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="KHÔNG GIAN CÁ NHÂN"
        title="Tài khoản"
        description="Cập nhật thông tin và bảo vệ quyền truy cập quản trị của bạn."
      />
      {error && <Notice>{error}</Notice>}
      {notice && <Notice success>{notice}</Notice>}
      <div className="account-grid">
        <section className="panel account-card">
          <span className="profile-avatar">{auth.user.ho_ten.slice(0, 1).toUpperCase()}</span>
          <h2>{auth.user.ho_ten}</h2>
          <p className="muted">{auth.user.email}</p>
          <span className="badge active">
            <ShieldCheck size={14} />
            Quản trị viên
          </span>
          <hr />
          <p className="hint">Quyền quản lý nội dung và tài khoản người học trong Wordleaf.</p>
        </section>
        <div className="editor-primary">
          <section className="panel">
            <div className="panel-heading">
              <h2>Thông tin hồ sơ</h2>
            </div>
            <form onSubmit={saveProfile}>
              <label>
                Họ tên
                <input
                  required
                  minLength={2}
                  maxLength={150}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label>
                Email
                <input value={auth.user.email} disabled />
              </label>
              <div className="form-actions">
                <button className="button" disabled={!!busy}>
                  <Save size={17} />
                  {busy === 'profile' ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Đổi mật khẩu</h2>
              <LockKeyhole size={20} />
            </div>
            <p className="muted">Sau khi đổi mật khẩu, bạn sẽ đăng nhập lại trên các thiết bị.</p>
            <form onSubmit={changePassword}>
              <label>
                Mật khẩu hiện tại
                <input
                  required
                  minLength={6}
                  type="password"
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                />
              </label>
              <div className="form-grid">
                <label>
                  Mật khẩu mới
                  <input
                    required
                    minLength={6}
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </label>
                <label>
                  Nhập lại mật khẩu mới
                  <input
                    required
                    minLength={6}
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                  />
                </label>
              </div>
              <div className="form-actions">
                <button className="button secondary" disabled={!!busy}>
                  {busy === 'password' ? 'Đang cập nhật…' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
