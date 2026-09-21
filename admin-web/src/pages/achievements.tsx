import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Pause, Pencil, Play, Plus, Search, Trash2, Users } from 'lucide-react';
import { api, jsonBody } from '../services/api';
import type { Achievement, Page } from '../types';
import { useQuery } from '../hooks/use-query';
import {
  Confirm,
  Empty,
  Notice,
  PageHeader,
  Pagination,
  QueryState,
  Status,
} from '../components/ui';
import { AchievementForm } from '../components/achievements/achievement-form';
import { AchievementIcon, achievementTypes } from '../components/achievements/achievement-icon';

export function AchievementsPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const type = params.get('type') || '';
  const status = params.get('status') || '';
  const page = Math.max(1, Math.min(1000000, Math.floor(Number(params.get('page')) || 1)));
  const [draft, setDraft] = useState(search);
  useEffect(() => setDraft(search), [search]);
  const [editing, setEditing] = useState<Achievement | null | undefined>();
  const [pending, setPending] = useState<{ item: Achievement; action: 'delete' | 'toggle' } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const queryString = new URLSearchParams({ search, page: String(page), limit: '15' });
  if (type) {
    queryString.set('type', type);
  }
  if (status) {
    queryString.set('status', status);
  }
  const query = useQuery(queryString.toString(), () =>
    api<Page<Achievement>>('/admin/achievements?' + queryString)
  );

  function change(values: Record<string, string>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }
    setParams(next);
  }

  async function confirm() {
    if (!pending || busy) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { item, action } = pending;
      const nextStatus = item.trang_thai === 'active' ? 'inactive' : 'active';
      await api(
        '/admin/achievements/' + item.id,
        action === 'delete' ? { method: 'DELETE' } : jsonBody('PUT', { trang_thai: nextStatus })
      );
      setNotice(
        action === 'delete'
          ? 'Đã xóa thành tích.'
          : nextStatus === 'active'
            ? 'Đã bật cấp thành tích.'
            : 'Đã tạm ngừng cấp mới. Huy hiệu đã nhận được giữ nguyên.'
      );
      setPending(null);
      if (page > 1 && query.data?.items.length === 1 && (action === 'delete' || status)) {
        change({ page: String(page - 1) });
      } else {
        query.reload();
      }
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="GHI NHẬN NỖ LỰC"
        title="Thành tích"
        description="Thiết lập huy hiệu, điều kiện nhận và theo dõi những cột mốc của người học."
        action={
          <button className="button" onClick={() => setEditing(null)}>
            <Plus size={18} />
            Thêm thành tích
          </button>
        }
      />
      {notice && <Notice success>{notice}</Notice>}
      <section className="panel table-panel">
        <div className="toolbar">
          <form
            className="search-form"
            onSubmit={(event) => {
              event.preventDefault();
              change({ search: draft.trim(), page: '1' });
            }}
          >
            <label className="search-field">
              <Search size={18} />
              <input
                aria-label="Tìm thành tích"
                placeholder="Tìm tên thành tích…"
                maxLength={150}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </label>
            <button className="button secondary">Tìm</button>
          </form>
          <select
            aria-label="Lọc loại điều kiện"
            value={type}
            onChange={(event) => change({ type: event.target.value, page: '1' })}
          >
            <option value="">Tất cả điều kiện</option>
            {Object.entries(achievementTypes).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc trạng thái thành tích"
            value={status}
            onChange={(event) => change({ status: event.target.value, page: '1' })}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang cấp</option>
            <option value="inactive">Tạm ngừng cấp</option>
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
                      <th>Huy hiệu</th>
                      <th>Điều kiện</th>
                      <th>Điểm</th>
                      <th>Trạng thái</th>
                      <th>Người đã đạt</th>
                      <th className="align-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="entity-cell">
                            <AchievementIcon value={item.bieu_tuong} />
                            <div>
                              <strong>{item.tieu_de}</strong>
                              <p className="cell-description">{item.mo_ta}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          {item.loai ? achievementTypes[item.loai] : 'Chưa cấu hình'}
                          <span className="cell-note">
                            {item.moc ? `Mốc: ${item.moc.toLocaleString('vi-VN')}` : 'Chưa có mốc'}
                          </span>
                        </td>
                        <td>{item.diem_thuong.toLocaleString('vi-VN')}</td>
                        <td>
                          <Status
                            value={item.trang_thai}
                            label={item.trang_thai === 'active' ? 'Đang cấp' : 'Tạm ngừng cấp'}
                          />
                        </td>
                        <td>
                          <Link
                            className="text-link"
                            to={'/achievements/' + item.id + '/recipients'}
                            aria-label={'Xem người đã đạt ' + item.tieu_de}
                          >
                            <Users size={15} /> {item.so_nguoi_dat} người
                          </Link>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="icon-button"
                              title="Chỉnh sửa"
                              aria-label={'Sửa ' + item.tieu_de}
                              onClick={() => setEditing(item)}
                            >
                              <Pencil size={17} />
                            </button>
                            <button
                              className="icon-button"
                              title={item.trang_thai === 'active' ? 'Tạm ngừng cấp' : 'Bật cấp'}
                              aria-label={
                                (item.trang_thai === 'active' ? 'Tạm ngừng ' : 'Bật cấp ') +
                                item.tieu_de
                              }
                              onClick={() => {
                                setError('');
                                setPending({ item, action: 'toggle' });
                              }}
                            >
                              {item.trang_thai === 'active' ? (
                                <Pause size={17} />
                              ) : (
                                <Play size={17} />
                              )}
                            </button>
                            <button
                              className="icon-button delete"
                              title={
                                item.so_nguoi_dat > 0
                                  ? 'Đã có người nhận, chỉ có thể tắt cấp mới'
                                  : 'Xóa thành tích'
                              }
                              disabled={item.so_nguoi_dat > 0}
                              aria-label={'Xóa ' + item.tieu_de}
                              onClick={() => {
                                setError('');
                                setPending({ item, action: 'delete' });
                              }}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="Không tìm thấy thành tích" />
            )}
            <Pagination
              page={page}
              pages={query.data.pagination.totalPages}
              total={query.data.pagination.total}
              onChange={(next) => change({ page: String(next) })}
            />
          </>
        )}
      </section>
      {editing !== undefined && (
        <AchievementForm
          achievement={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setNotice('Đã lưu thành tích.');
            query.reload();
          }}
        />
      )}
      {pending && (
        <Confirm
          title={
            (pending.action === 'delete'
              ? 'Xóa'
              : pending.item.trang_thai === 'active'
                ? 'Tạm ngừng cấp'
                : 'Bật cấp') +
            ' “' +
            pending.item.tieu_de +
            '”?'
          }
          description={
            pending.action === 'delete'
              ? 'Chỉ xóa được khi chưa có người nhận. Thao tác này không thể hoàn tác.'
              : pending.item.trang_thai === 'active'
                ? 'Ngừng cấp cho người mới. Người đã nhận vẫn giữ huy hiệu và điểm thưởng.'
                : 'Người học đủ điều kiện sẽ được nhận huy hiệu khi mở trang thành tích.'
          }
          action={pending.action === 'delete' ? 'Xóa thành tích' : 'Xác nhận'}
          busy={busy}
          error={error}
          onClose={() => setPending(null)}
          onConfirm={() => {
            void confirm();
          }}
        />
      )}
    </>
  );
}
