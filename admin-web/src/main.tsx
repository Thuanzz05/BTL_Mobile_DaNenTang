import { StrictMode, useEffect, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { session } from './services/api';
import { ApiError } from './services/admin-session';
import { AdminLayout } from './layouts/admin-layout';
import { LoginPage } from './pages/login';
import { DashboardPage } from './pages/dashboard';
import { TopicsPage } from './pages/topics';
import { WordsPage } from './pages/words';
import { WordEditorPage } from './pages/word-editor';
import { UsersPage } from './pages/users';
import { StatisticsPage } from './pages/statistics';
import { AccountPage } from './pages/account';
import { AchievementsPage } from './pages/achievements';
import { AchievementRecipientsPage } from './pages/achievement-recipients';
import { Notice } from './components/ui';
import './styles/app.css';

function App() {
  const auth = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  async function restore() {
    setReady(false);
    setError('');

    try {
      await session.restore();
    } catch (failure) {
      if (!(failure instanceof ApiError) || ![401, 403].includes(failure.status)) {
        setError((failure as Error).message);
      }
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    void restore();
  }, []);

  if (!ready) {
    return (
      <div className="boot-screen" role="status">
        Đang mở Wordleaf…
      </div>
    );
  }
  if (error && !auth) {
    return (
      <div className="boot-screen">
        <h1>Chưa thể kết nối</h1>
        <Notice>{error}</Notice>
        <button
          className="button"
          onClick={() => {
            void restore();
          }}
        >
          Thử lại
        </button>
      </div>
    );
  }
  if (!auth) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/topics" element={<TopicsPage />} />
        <Route path="/words" element={<WordsPage />} />
        <Route path="/words/new" element={<WordEditorPage />} />
        <Route path="/words/:id/edit" element={<WordEditorPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/achievements/:id/recipients" element={<AchievementRecipientsPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
