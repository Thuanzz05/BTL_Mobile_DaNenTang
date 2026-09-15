import { useState } from 'react';
import type { FormEvent } from 'react';
import { Eye, EyeOff, ArrowRight, Leaf, BookOpen, ShieldCheck } from 'lucide-react';
import { session } from '../services/api';
import { Notice } from '../components/ui';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await session.login(email, password);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brand-mark">
            <Leaf size={28} />
          </span>
          <span>wordleaf</span>
        </div>
        <div className="story-copy">
          <span className="story-pill">
            <BookOpen size={16} /> Không gian dành cho người tạo nội dung
          </span>
          <h1>
            Gieo từ mới.
            <br />
            <em>Nuôi kiến thức.</em>
          </h1>
          <p>
            Quản lý thư viện từ vựng, đồng hành cùng người học và nhìn thấy sự tiến bộ mỗi ngày.
          </p>
          <div className="word-art">
            <span className="word-art-number">01 / WORD OF THE DAY</span>
            <Leaf size={42} strokeWidth={1.3} />
            <strong>grow</strong>
            <span>/ɡrəʊ/ · động từ</span>
            <p>lớn lên, phát triển</p>
            <div className="word-art-line" />
          </div>
        </div>
        <p className="story-footer">Một nơi để những điều nhỏ bé trở nên có ý nghĩa.</p>
      </section>
      <section className="login-form-section">
        <div className="login-form-wrap">
          <span className="login-icon">
            <ShieldCheck size={25} />
          </span>
          <p className="eyebrow">WORDLEAF ADMIN</p>
          <h2>Chào mừng trở lại</h2>
          <p className="muted">Đăng nhập để tiếp tục chăm chút không gian học tập.</p>
          <form onSubmit={submit}>
            <label>
              Email quản trị
              <input
                type="email"
                autoComplete="username"
                placeholder="ten@wordleaf.vn"
                required
                maxLength={150}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Mật khẩu
              <div className="password-input">
                <input
                  type={visible ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && <Notice>{error}</Notice>}
            <button className="button full" disabled={busy}>
              {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="login-help">
            Dành cho tài khoản quản trị đã được cấp quyền.
            <br />
            Cần hỗ trợ truy cập? Liên hệ người quản lý dự án.
          </p>
        </div>
      </section>
    </main>
  );
}
