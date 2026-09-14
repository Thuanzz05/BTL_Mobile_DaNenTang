import { useState } from 'react';
import type { FormEvent } from 'react';
import { Eye, LockKeyhole, Search, UnlockKeyhole } from 'lucide-react';
import { api, jsonBody } from '../services/api';
import type { Learner, Page } from '../types';
import { useQuery } from '../hooks/use-query';
import {
  Confirm,
  Empty,
  Modal,
  Notice,
  PageHeader,
  Pagination,
  QueryState,
  Status,
} from '../components/ui';

export function UsersPage() {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Learner | null>(null);
  const [changing, setChanging] = useState<{ user: Learner; status: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const params = new URLSearchParams({ search, page: String(page), limit: '15' });
  if (status) {
    params.set('status', status);
  }
  const query = useQuery(params.toString(), () => api<Page<Learner>>('/admin/users?' + params));

  function find(event: FormEvent) {
    event.preventDefault();
    setSearch(draft.trim());
    setPage(1);
  }

  async function changeStatus() {
    if (!changing || busy) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api(
        '/admin/users/' + changing.user.id + '/status',
        jsonBody('PUT', { trang_thai: changing.status })
      );
      setChanging(null);
      setNotice('Đã cập nhật trạng thái người dùng.');
      query.reload();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="CỘNG ĐỒNG HỌC TẬP"
        title="Người dùng"
        description="Theo dõi tài khoản người học và quản lý quyền truy cập."
      />
      {notice && <Notice success>{notice}</Notice>}
      <section className="panel table-panel">
        <div className="toolbar">
          <form className="search-form" onSubmit={find}>
            <label className="search-field">
              <Search size={18} />
              <input
                maxLength={150}
                aria-label="Tìm người dùng"
                placeholder="Tìm tên hoặc email…"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </label>
            <button className="button secondary">Tìm kiếm</button>
          </form>
          <select
            aria-label="Lọc trạng thái người dùng"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
            <option value="inactive">Tạm ngưng</option>
          </select>
        </div>
        <QueryState {...query} retry={query.reload} />
        {query.data && (
          <>
            {query.data.items.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Người học</th>
                      <th>Ngày tham gia</th>
                      <th>Phiên học</th>
                      <th>Trạng thái</th>
                      <th className="align-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.items.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="entity-cell">
                            <span className="avatar learner-avatar">
                              {user.ho_ten.slice(0, 1).toUpperCase()}
                            </span>
                            <div>
                              <strong>{user.ho_ten}</strong>
                              <p className="cell-description">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>{new Date(user.ngay_tao).toLocaleDateString('vi-VN')}</td>
                        <td>{user.so_phien_hoc}</td>
                        <td>
                          <Status value={user.trang_thai} />
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="icon-button"
                              aria-label={'Xem ' + user.ho_ten}
                              onClick={() => setSelected(user)}
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={
                                (user.trang_thai === 'active' ? 'Khóa ' : 'Mở khóa ') + user.ho_ten
                              }
                              onClick={() => {
                                setError('');
                                setChanging({
                                  user,
                                  status: user.trang_thai === 'active' ? 'locked' : 'active',
                                });
                              }}
                            >
                              {user.trang_thai === 'active' ? (
                                <LockKeyhole size={17} />
                              ) : (
                                <UnlockKeyhole size={17} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="Không tìm thấy người dùng" />
            )}
            <Pagination
              page={page}
              pages={query.data.pagination.totalPages}
              total={query.data.pagination.total}
              onChange={setPage}
            />
          </>
        )}
      </section>
      <p className="hint page-hint">
        Khóa tài khoản sẽ thu hồi phiên đăng nhập hiện tại. Lịch sử và tiến độ học vẫn được giữ lại.
      </p>
      {selected && (
        <Modal title="Thông tin người học" onClose={() => setSelected(null)}>
          <dl className="details-list">
            <dt>Họ tên</dt>
            <dd>{selected.ho_ten}</dd>
            <dt>Email</dt>
            <dd>{selected.email}</dd>
            <dt>Trạng thái</dt>
            <dd>
              <Status value={selected.trang_thai} />
            </dd>
            <dt>Đăng nhập</dt>
            <dd>{selected.phuong_thuc_dang_nhap === 'local' ? 'Email và mật khẩu' : 'Google'}</dd>
            <dt>Ngày tham gia</dt>
            <dd>{new Date(selected.ngay_tao).toLocaleString('vi-VN')}</dd>
            <dt>Số phiên học</dt>
            <dd>{selected.so_phien_hoc}</dd>
          </dl>
          <div className="form-actions">
            <button className="button secondary" onClick={() => setSelected(null)}>
              Đóng
            </button>
          </div>
        </Modal>
      )}
      {changing && (
        <Confirm
          title={(changing.status === 'active' ? 'Mở khóa ' : 'Khóa ') + changing.user.ho_ten + '?'}
          description={
            changing.status === 'active'
              ? 'Người học có thể đăng nhập lại và tiếp tục học.'
              : 'Người học sẽ không thể truy cập tài khoản cho đến khi được mở khóa.'
          }
          action={changing.status === 'active' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
          busy={busy}
          error={error}
          onClose={() => setChanging(null)}
          onConfirm={() => {
            void changeStatus();
          }}
        />
      )}
    </>
  );
}
