import { query } from '../config/database';
import { learningPeriodStarts } from '../utils/calendar.util';
import { LearningService } from './learning.service';

export class ProgressService {
  /**
   * Đếm tiến độ từ đã học, không tính từ chỉ được yêu thích
   */
  static async getUserProgress(userId: string) {
    const rows = await query<any[]>(
      `SELECT COUNT(*) AS total_learned,
      COALESCE(SUM(trang_thai_nho = 'thuoc-long'), 0) AS mastered,
      COALESCE(SUM(trang_thai_nho = 'da-nho'), 0) AS remembered,
      COALESCE(SUM(trang_thai_nho = 'chua-chac'), 0) AS uncertain,
      COALESCE(SUM(trang_thai_nho = 'chua-nho'), 0) AS forgotten
      FROM tien_do_tu_vung WHERE nguoi_dung_id = ? AND da_hoc = TRUE`,
      [userId]
    );

    return Object.fromEntries(Object.entries(rows[0]).map(([key, value]) => [key, Number(value)]));
  }

  /**
   * Tổng hợp tiến độ theo chủ đề, gồm cả chủ đề chưa có từ
   */
  static async getProgressByTopic(userId: string, topicId?: string) {
    return query(
      `SELECT c.id AS topic_id, c.ten AS topic_name, COUNT(t.id) AS total_words,
      COUNT(CASE WHEN p.da_hoc = TRUE THEN 1 END) AS learned_words,
      COUNT(CASE WHEN p.trang_thai_nho = 'thuoc-long' THEN 1 END) AS mastered_words
      FROM chu_de c LEFT JOIN tu_vung t ON c.id = t.chu_de_id
      LEFT JOIN tien_do_tu_vung p ON t.id = p.tu_vung_id AND p.nguoi_dung_id = ?
      WHERE c.trang_thai = 'active' ${topicId ? 'AND c.id = ?' : ''}
      GROUP BY c.id ORDER BY c.thu_tu_hien_thi, c.id`,
      topicId ? [userId, topicId] : [userId]
    );
  }

  /**
   * Thống kê ngày, tuần và tháng từ lịch sử đánh giá theo giờ Việt Nam
   */
  static async getSummary(userId: string) {
    const starts = learningPeriodStarts();
    const [overall, byTopic, counts] = await Promise.all([
      this.getUserProgress(userId),
      this.getProgressByTopic(userId),
      query<any[]>(
        `SELECT
        COUNT(DISTINCT CASE WHEN k.ngay_tao >= ? THEN k.tu_vung_id END) AS hom_nay,
        COUNT(DISTINCT CASE WHEN k.ngay_tao >= ? THEN k.tu_vung_id END) AS tuan_nay,
        COUNT(DISTINCT CASE WHEN k.ngay_tao >= ? THEN k.tu_vung_id END) AS thang_nay
        FROM ket_qua_hoc k JOIN phien_hoc_tap p ON k.phien_hoc_tap_id = p.id
        WHERE p.nguoi_dung_id = ? AND k.ngay_tao <= NOW()`,
        [starts.today, starts.week, starts.month, userId]
      ),
    ]);
    const remembered = overall.mastered + overall.remembered;

    return {
      tong_so_tu_da_hoc: overall.total_learned,
      da_nho: remembered,
      chua_chac: overall.uncertain,
      chua_nho: overall.forgotten,
      ty_le: overall.total_learned ? Math.round((100 * remembered) / overall.total_learned) : 0,
      hom_nay: Number(counts[0].hom_nay),
      tuan_nay: Number(counts[0].tuan_nay),
      thang_nay: Number(counts[0].thang_nay),
      theo_chu_de: byTopic,
    };
  }

  /**
   * Dùng chung quy tắc đến hạn ôn với luồng học
   */
  static async getWordsToReview(userId: string, limit = 20) {
    return LearningService.getReviewWords(userId, limit);
  }
}
