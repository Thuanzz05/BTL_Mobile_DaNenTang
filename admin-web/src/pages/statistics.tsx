import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Activity, BarChart3 } from 'lucide-react';
import { api } from '../services/api';
import type { QuizReport, Statistics } from '../types';
import { useQuery } from '../hooks/use-query';
import { Empty, PageHeader, QueryState } from '../components/ui';

type BarDatum = {
  id: string;
  label: string;
  detail?: string;
  value: number;
  valueLabel: string;
};

function HorizontalBars({
  rows,
  label,
  tone = 'green',
}: {
  rows: BarDatum[];
  label: string;
  tone?: 'green' | 'blue' | 'danger';
}) {
  const max = Math.max(1, ...rows.map((row) => Number(row.value)));

  return (
    <div
      className={'horizontal-bars ' + tone}
      role="img"
      aria-label={`${label}: ${rows.map((row) => `${row.label} ${row.valueLabel}`).join(', ')}`}
    >
      {rows.map((row) => (
        <div className="horizontal-bar-row" key={row.id}>
          <div className="horizontal-bar-heading">
            <strong>{row.label}</strong>
            <span>{row.valueLabel}</span>
          </div>
          {row.detail && <small>{row.detail}</small>}
          <div className="horizontal-bar-track">
            <span
              style={{
                width: `${row.value ? Math.max(3, (Number(row.value) / max) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function LearningActivityChart({
  rows,
}: {
  rows: { ngay: string; so_phien: number; so_tu: number }[];
}) {
  const max = Math.max(1, ...rows.flatMap((row) => [Number(row.so_phien), Number(row.so_tu)]));

  return (
    <div
      className="learning-chart"
      role="img"
      aria-label={rows
        .map((row) => `${row.ngay}: ${row.so_phien} phiên và ${row.so_tu} từ`)
        .join(', ')}
    >
      {rows.map((row) => (
        <div className="learning-chart-column" key={row.ngay}>
          <div className="learning-chart-values">
            <span>{row.so_phien}</span>
            <span>{row.so_tu}</span>
          </div>
          <div className="learning-chart-bars">
            <i style={{ height: `${(Number(row.so_phien) / max) * 100}%` }} />
            <i style={{ height: `${(Number(row.so_tu) / max) * 100}%` }} />
          </div>
          <time dateTime={row.ngay}>{row.ngay.slice(5).split('-').reverse().join('/')}</time>
        </div>
      ))}
    </div>
  );
}

function QuizActivityChart({ rows }: { rows: QuizReport['hoat_dong'] }) {
  const max = Math.max(1, ...rows.map((row) => Number(row.so_luot)));
  const minWidth = Math.max(560, rows.length * 24);

  return (
    <div className="quiz-activity-scroll">
      <div
        className="quiz-activity-chart"
        style={{ minWidth }}
        role="img"
        aria-label={rows
          .map((row) => `${row.ngay}: đúng ${row.so_luot_dung} trên ${row.so_luot} lượt`)
          .join(', ')}
      >
        {rows.map((row) => (
          <div className="quiz-activity-column" key={row.ngay}>
            <div className="quiz-activity-bars">
              <i className="attempts" style={{ height: `${(Number(row.so_luot) / max) * 100}%` }} />
              <i
                className="correct"
                style={{ height: `${(Number(row.so_luot_dung) / max) * 100}%` }}
              />
            </div>
            <time dateTime={row.ngay}>{row.ngay.slice(5).split('-').reverse().join('/')}</time>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        <>
          <article className="panel statistics-activity">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">NHỊP HỌC 7 NGÀY</p>
                <h2>Hoạt động gần đây</h2>
              </div>
              <Activity size={20} />
            </div>
            <LearningActivityChart rows={legacy.data.hoat_dong_7_ngay} />
            <div className="statistics-legend" aria-hidden="true">
              <span className="sessions">
                <i /> Phiên học
              </span>
              <span className="words">
                <i /> Từ đã học
              </span>
            </div>
          </article>
          <section className="two-columns statistics-rankings">
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">TỪ HOẠT ĐỘNG HỌC</p>
                  <h2>Chủ đề được quan tâm</h2>
                </div>
                <BarChart3 size={20} />
              </div>
              {legacy.data.chu_de_pho_bien.length ? (
                <HorizontalBars
                  label="Chủ đề được quan tâm"
                  rows={legacy.data.chu_de_pho_bien.map((topic) => ({
                    id: topic.id,
                    label: topic.ten,
                    value: Number(topic.luot_hoc),
                    valueLabel: `${topic.luot_hoc} phiên`,
                  }))}
                />
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
                <HorizontalBars
                  label="Từ được luyện nhiều"
                  tone="blue"
                  rows={legacy.data.tu_pho_bien.map((word) => ({
                    id: word.id,
                    label: word.tu_tieng_anh,
                    detail: word.nghia_tieng_viet,
                    value: Number(word.luot_hoc),
                    valueLabel: `${word.luot_hoc} lượt`,
                  }))}
                />
              ) : (
                <Empty title="Chưa có từ vựng" />
              )}
            </article>
          </section>
        </>
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
            <div className="quiz-overview">
              <div className="accuracy-visual">
                <div
                  className="accuracy-ring"
                  style={
                    {
                      '--accuracy': `${(summary.ty_le_dung ?? 0) * 3.6}deg`,
                    } as CSSProperties
                  }
                  role="img"
                  aria-label={`Tỷ lệ đúng ${summary.ty_le_dung ?? 0}%`}
                >
                  <strong>{summary.ty_le_dung === null ? '—' : summary.ty_le_dung + '%'}</strong>
                  <span>Tỷ lệ đúng</span>
                </div>
                <dl className="quiz-metrics">
                  <div>
                    <dt>Lượt trả lời</dt>
                    <dd>{summary.so_luot}</dd>
                  </div>
                  <div>
                    <dt>Trả lời đúng</dt>
                    <dd>{summary.so_luot_dung}</dd>
                  </div>
                  <div>
                    <dt>Trả lời sai</dt>
                    <dd>{summary.so_luot_sai}</dd>
                  </div>
                  <div>
                    <dt>Người học</dt>
                    <dd>{summary.so_nguoi}</dd>
                  </div>
                  <div>
                    <dt>Phiên quiz</dt>
                    <dd>{summary.so_phien}</dd>
                  </div>
                </dl>
              </div>
              <div className="quiz-trend">
                <div className="chart-section-heading">
                  <div>
                    <h3>Lượt trả lời theo ngày</h3>
                    <p>Tổng lượt và số lượt đúng trong khoảng đã chọn.</p>
                  </div>
                  <div className="statistics-legend" aria-hidden="true">
                    <span className="attempts">
                      <i /> Tổng lượt
                    </span>
                    <span className="correct">
                      <i /> Lượt đúng
                    </span>
                  </div>
                </div>
                <QuizActivityChart rows={report.data!.hoat_dong} />
              </div>
            </div>
            {report.data!.tu_can_luyen.length ? (
              <div className="practice-chart">
                <div className="chart-section-heading">
                  <div>
                    <h3>Tỷ lệ sai theo từ</h3>
                    <p>Thanh dài hơn cho biết từ cần được ưu tiên luyện lại.</p>
                  </div>
                  <span className="chip">Sắp xếp theo tỷ lệ sai</span>
                </div>
                <HorizontalBars
                  label="Tỷ lệ sai của các từ cần luyện"
                  tone="danger"
                  rows={report.data!.tu_can_luyen.map((word) => ({
                    id: word.id,
                    label: word.tu_tieng_anh,
                    detail: `Chủ đề: ${word.chu_de_ten}. ${word.nghia_tieng_viet}`,
                    value: Number(word.ty_le_sai),
                    valueLabel: `${word.ty_le_sai}% (${word.so_luot_sai}/${word.so_luot} lượt sai)`,
                  }))}
                />
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
