import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { api } from '../services/api';
import type { AchievementRecipients } from '../types';
import { useQuery } from '../hooks/use-query';
import { Empty, PageHeader, Pagination, QueryState, Status } from '../components/ui';
import { AchievementIcon } from '../components/achievements/achievement-icon';

export function AchievementRecipientsPage() {
  const { id } = useParams();
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ search, page: String(page), limit: '15' });
  const query = useQuery(id + '?' + params, () =>
    api<AchievementRecipients>(
      '/admin/achievements/' + encodeURIComponent(id || '') + '/recipients?' + params
    )
  );
  const achievement = query.data?.achievement;

  return (
    <>
      <PageHeader
        eyebrow="LỊCH SỬ NHẬN HUY HIỆU"
        title="Người đã đạt thành tích"
        description="Xem người nhận và thời điểm mở khóa huy hiệu."
        action={
          <Link className="button secondary" to="/achievements">
            <ArrowLeft size={17} />
            Danh sách thành tích
          </Link>
        }
      />
      {achievement && (
        <section className="panel achievement-summary">
          <div className="entity-cell">
            <AchievementIcon value={achievement.bieu_tuong} />
            <div>
              <h2>{achievement.tieu_de}</h2>
              <p className="muted">{achievement.mo_ta}</p>
            </div>
          </div>
          <div>
            <strong>{achievement.so_nguoi_dat.toLocaleString('vi-VN')} người đã đạt</strong>
            <p className="muted">{achievement.diem_thuong} điểm / huy hiệu</p>
            <Status
              value={achievement.trang_thai}
              label={achievement.trang_thai === 'active' ? 'Đang cấp' : 'Tạm ngừng cấp'}
            />
          </div>
        </section>
      )}
      <section className="panel table-panel">
        <div className="toolbar">
          <form
            className="search-form"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(draft.trim());
              setPage(1);
            }}
          >
            <label className="search-field">
              <Search size={18} />
              <input
                aria-label="Tìm người đã đạt"
                placeholder="Tìm tên hoặc email…"
                maxLength={150}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </label>
            <button className="button secondary">Tìm</button>
          </form>
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
                      <th>Email</th>
                      <th>Ngày nhận (giờ Việt Nam)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.items.map((person) => (
                      <tr key={person.id}>
                        <td>
                          <strong>{person.ho_ten}</strong>
                        </td>
                        <td>{person.email}</td>
                        <td>
                          {new Date(person.ngay_mo_khoa).toLocaleString('vi-VN', {
                            timeZone: 'Asia/Ho_Chi_Minh',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title={
                  search ? 'Không tìm thấy người nhận phù hợp' : 'Chưa có người nhận thành tích này'
                }
              >
                Huy hiệu được cấp khi người học đủ điều kiện và mở trang thành tích.
              </Empty>
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
    </>
  );
}
