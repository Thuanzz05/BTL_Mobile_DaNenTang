import { useState } from 'react';
import type { FormEvent } from 'react';
import { BarChart3 } from 'lucide-react';
import { api } from '../services/api';
import type { QuizReport, Statistics } from '../types';
import { useQuery } from '../hooks/use-query';
import { Empty, PageHeader, QueryState } from '../components/ui';

export function StatisticsPage() {
  const legacy = useQuery('statistics', () => api<Statistics>('/admin/statistics'));
  const [filters, setFilters] = useState({ from: '', to: '', minAttempts: '5' });
  const [applied, setApplied] = useState('minAttempts=5');
  const report = useQuery(applied, () => api<QuizReport>('/admin/quiz-statistics?' + applied));
  const summary = report.data?.tong_quan;

  function apply(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({ minAttempts: filters.minAttempts });
    if (filters.from) {
      params.set('from', filters.from);
    }
    if (filters.to) {
      params.set('to', filters.to);
    }
    setApplied(params.toString());
  }

  return (
    <>
      <PageHeader
        eyebrow="HIỂU THÊM VỀ VIỆC HỌC"
        title="Thống kê"
        description="Theo dõi nội dung phổ biến và nhận diện những từ cần luyện thêm."
      />
      <QueryState {...legacy} retry={legacy.reload} />
      {legacy.data && (
        <section className="two-columns">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">TỪ HOẠT ĐỘNG HỌC</p>
                <h2>Chủ đề được quan tâm</h2>
              </div>
              <BarChart3 size={20} />
            </div>
            {legacy.data.chu_de_pho_bien.length ? (
              <div className="ranking">
                {legacy.data.chu_de_pho_bien.map((topic, index) => (
                  <div key={topic.id}>
                    <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
                    <strong>{topic.ten}</strong>
                    <span>{topic.luot_hoc} phiên</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty title="Chưa có chủ đề" />
            )}
          </article>
          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">TỪ KẾT QUẢ ĐÃ LƯU</p>
                <h2>Từ được luyện nhiều</h2>
              </div>
              <span className="chip">10 từ đầu</span>
            </div>
            {legacy.data.tu_pho_bien.length ? (
              <div className="ranking">
                {legacy.data.tu_pho_bien.map((word, index) => (
                  <div key={word.id}>
                    <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
                    <strong>
                      {word.tu_tieng_anh}
                      <small>{word.nghia_tieng_viet}</small>
                    </strong>
                    <span>{word.luot_hoc} lượt</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty title="Chưa có từ vựng" />
            )}
          </article>
        </section>
      )}

      <section className="panel quiz-report">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">ĐỘ CHÍNH XÁC TRẮC NGHIỆM</p>
            <h2>Những từ cần luyện thêm</h2>
          </div>
          <span className="chip">Lượt trả lời thực tế</span>
        </div>
        <p className="muted">
          Chỉ tính các câu được server chấm qua luồng trắc nghiệm mới. Phiên học cũ vẫn xuất hiện
          trong thống kê hoạt động.
        </p>
        <form className="report-filters" onSubmit={apply}>
          <label>
            Từ ngày
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters({ ...filters, from: event.target.value })}
            />
          </label>
          <label>
            Đến ngày
            <input
              type="date"
              min={filters.from || undefined}
              value={filters.to}
              onChange={(event) => setFilters({ ...filters, to: event.target.value })}
            />
          </label>
          <label>
            Lượt tối thiểu / từ
            <input
              type="number"
              min={1}
              max={100000}
              step={1}
              required
              value={filters.minAttempts}
              onChange={(event) => setFilters({ ...filters, minAttempts: event.target.value })}
            />
          </label>
          <button className="button secondary">Áp dụng</button>
        </form>
        <QueryState {...report} retry={report.reload} />
        {summary && (
          <>
            <p className="hint">
              Từ {report.data!.tu_ngay} đến {report.data!.den_ngay} · Giờ Việt Nam
            </p>
            <div className="report-summary">
              <div>
                <strong>{summary.so_luot}</strong>
                <span>Lượt trả lời</span>
              </div>
              <div>
                <strong>{summary.so_luot_dung}</strong>
                <span>Lượt đúng</span>
              </div>
              <div>
                <strong>{summary.so_luot_sai}</strong>
                <span>Lượt sai</span>
              </div>
              <div>
                <strong>{summary.ty_le_dung === null ? '—' : summary.ty_le_dung + '%'}</strong>
                <span>Tỷ lệ đúng</span>
              </div>
            </div>
            {report.data!.tu_can_luyen.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Từ vựng</th>
                      <th>Chủ đề</th>
                      <th>Lượt trả lời</th>
                      <th>Lượt sai</th>
                      <th>Tỷ lệ sai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.data!.tu_can_luyen.map((word) => (
                      <tr key={word.id}>
                        <td>
                          <strong>{word.tu_tieng_anh}</strong>
                          <p className="cell-description">{word.nghia_tieng_viet}</p>
                        </td>
                        <td>{word.chu_de_ten}</td>
                        <td>{word.so_luot}</td>
                        <td>{word.so_luot_sai}</td>
                        <td>
                          <span className="badge inactive">{word.ty_le_sai}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title={
                  summary.so_luot
                    ? 'Chưa có từ đạt ngưỡng thống kê'
                    : 'Chưa có lượt trả lời trắc nghiệm'
                }
              >
                {summary.so_luot
                  ? 'Giảm số lượt tối thiểu hoặc chọn khoảng ngày khác.'
                  : 'Dữ liệu sẽ xuất hiện khi ứng dụng bắt đầu sử dụng luồng trắc nghiệm mới.'}
              </Empty>
            )}
          </>
        )}
      </section>
    </>
  );
}
