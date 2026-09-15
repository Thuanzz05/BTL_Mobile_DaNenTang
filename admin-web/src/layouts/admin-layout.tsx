import { useState, useSyncExternalStore } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  FolderOpen,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { session } from '../services/api';
import { Notice } from '../components/ui';

const links = [
  { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/topics', label: 'Chủ đề', icon: FolderOpen },
  { to: '/words', label: 'Từ vựng', icon: BookOpen },
  { to: '/users', label: 'Người dùng', icon: Users },
  { to: '/statistics', label: 'Thống kê', icon: BarChart3 },
  { to: '/account', label: 'Tài khoản', icon: UserRound },
];

export function AdminLayout() {
  const auth = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    setLogoutError('');
    try {
      await session.logout();
    } catch (error) {
      setLogoutError('Chưa thể đăng xuất. ' + (error as Error).message);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="app-shell">
      {open && (
        <button className="sidebar-shade" aria-label="Đóng menu" onClick={() => setOpen(false)} />
      )}
      <aside className={'sidebar ' + (open ? 'is-open' : '')}>
        <NavLink className="brand" to="/dashboard">
          <span className="brand-mark">
            <Leaf size={26} />
          </span>
          <span>
            wordleaf<span className="brand-small">KHÔNG GIAN QUẢN TRỊ</span>
          </span>
        </NavLink>
        <button
          className="mobile-close icon-button"
          aria-label="Đóng menu"
          onClick={() => setOpen(false)}
        >
          <X size={20} />
        </button>
        <p className="nav-label">QUẢN LÝ HỆ THỐNG</p>
        <nav aria-label="Điều hướng chính">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => 'nav-link' + (isActive ? ' selected' : '')}
            >
              <Icon size={20} strokeWidth={1.7} />
              <span>{label}</span>
              <ChevronRight className="nav-chevron" size={15} />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="mini-leaf">
            <Leaf size={20} />
          </span>
          <h3>Mỗi từ, một bước tiến.</h3>
          <p>Chăm chút nội dung hôm nay để việc học ngày mai dễ dàng hơn.</p>
        </div>
        <div className="sidebar-footer">
          <i /> Wordleaf Admin <span>v1.0</span>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Mở menu"
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="topbar-label">
            <span>Không gian làm việc</span>
            <ChevronRight size={14} />
            <strong>Quản trị viên</strong>
          </div>
          <div className="topbar-user">
            <span className="avatar">{auth?.user.ho_ten.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{auth?.user.ho_ten}</strong>
              <span>Quản trị viên</span>
            </div>
            <button
              className="icon-button"
              title="Đăng xuất"
              aria-label="Đăng xuất"
              disabled={loggingOut}
              onClick={() => {
                void logout();
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main id="main-content">
          {logoutError && <Notice>{logoutError}</Notice>}
          <Outlet />
        </main>
        <footer className="page-footer">
          <span>Wordleaf · Học một chút, nhớ thêm nhiều.</span>
          <span>Nội dung được dùng chung với ứng dụng học tập</span>
        </footer>
      </div>
    </div>
  );
}
