import { query } from '../config/database';
import { learningPeriodStarts } from '../utils/calendar.util';
import { AppError } from '../utils/app-error';

const DAY = 86400000;
const OFFSET = 7 * 3600000;

export function localDate(date: Date) {
  return new Date(date.getTime() + OFFSET).toISOString().slice(0, 10);
}

export function reportRange(from?: string, to?: string) {
  const today = learningPeriodStarts().today;
  const start = from ? new Date(from + 'T00:00:00+07:00') : new Date(today.getTime() - 29 * DAY);
  const last = to ? new Date(to + 'T00:00:00+07:00') : today;
  const valid = (input: string | undefined, date: Date) =>
    Number.isFinite(date.getTime()) && (!input || localDate(date) === input);

  if (
    !valid(from, start) ||
    !valid(to, last) ||
    last < start ||
    last.getTime() - start.getTime() >= 366 * DAY
  ) {
    throw new AppError(
      'Khoảng ngày không hợp lệ hoặc vượt quá 366 ngày',
      400,
      'INVALID_DATE_RANGE'
    );
  }

  return {
    start,
    end: new Date(last.getTime() + DAY),
    from: localDate(start),
    to: localDate(last),
  };
}

export function fillDays<T extends { ngay: string }>(
  start: Date,
  end: Date,
  rows: T[],
  empty: Omit<T, 'ngay'>
) {
  const byDay = new Map(rows.map((row) => [row.ngay, row]));
  const result = [];

  for (let date = start.getTime(); date < end.getTime(); date += DAY) {
    const ngay = localDate(new Date(date));
    result.push(byDay.get(ngay) || { ngay, ...empty });
  }

  return result;
}

export class AdminReportService {
  /** Thống kê từ lượt chấm thật; không suy ra độ chính xác từ trạng thái SRS cũ. */
  static async quiz(options: { from?: string; to?: string; minAttempts?: number; limit?: number }) {
    const range = reportRange(options.from, options.to);
    const params = [range.start, range.end];
    const where = 'q.tra_loi_luc >= ? AND q.tra_loi_luc < ? AND q.dung IS NOT NULL';
    const minAttempts = options.minAttempts ?? 5;
    const limit = options.limit ?? 20;

    const [overview, words, activity] = await Promise.all([
      query<any[]>(
        `SELECT COUNT(*) AS so_luot, COALESCE(SUM(q.dung), 0) AS so_luot_dung,
        COUNT(*) - COALESCE(SUM(q.dung), 0) AS so_luot_sai,
        ROUND(100 * AVG(q.dung), 1) AS ty_le_dung,
        COUNT(DISTINCT p.nguoi_dung_id) AS so_nguoi, COUNT(DISTINCT p.id) AS so_phien
        FROM cau_hoi_trac_nghiem q JOIN phien_hoc_tap p ON p.id = q.phien_hoc_tap_id
        WHERE ${where}`,
        params
      ),
      query<any[]>(
        `SELECT t.id, t.tu_tieng_anh, t.nghia_tieng_viet, c.ten AS chu_de_ten,
        COUNT(*) AS so_luot, SUM(q.dung = 0) AS so_luot_sai,
        ROUND(100 * AVG(q.dung = 0), 1) AS ty_le_sai,
        COUNT(DISTINCT p.nguoi_dung_id) AS so_nguoi
        FROM cau_hoi_trac_nghiem q JOIN tu_vung t ON t.id = q.tu_vung_id
        JOIN chu_de c ON c.id = t.chu_de_id
        JOIN phien_hoc_tap p ON p.id = q.phien_hoc_tap_id
        WHERE ${where} GROUP BY t.id, c.ten HAVING COUNT(*) >= ?
        ORDER BY ty_le_sai DESC, so_luot DESC, t.id LIMIT ?`,
        [...params, minAttempts, limit]
      ),
      query<any[]>(
        `SELECT DATE_FORMAT(DATE_ADD(q.tra_loi_luc, INTERVAL 7 HOUR), '%Y-%m-%d') AS ngay,
        COUNT(*) AS so_luot, SUM(q.dung) AS so_luot_dung
        FROM cau_hoi_trac_nghiem q WHERE ${where} GROUP BY ngay ORDER BY ngay`,
        params
      ),
    ]);

    return {
      tu_ngay: range.from,
      den_ngay: range.to,
      mui_gio: 'Asia/Ho_Chi_Minh',
      so_luot_toi_thieu: minAttempts,
      tong_quan: overview[0],
      tu_can_luyen: words,
      hoat_dong: fillDays(range.start, range.end, activity, { so_luot: 0, so_luot_dung: 0 }),
    };
  }
}
