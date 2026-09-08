import { query } from '../config/database';

export class StatisticsService {
  static async getDashboardStats(userId: string) {
    // Total words learned
    const learnedSql = `
      SELECT COUNT(DISTINCT tu_vung_id) as count
      FROM tien_do_tu_vung
      WHERE nguoi_dung_id = ? AND da_hoc = TRUE
    `;
    const learnedResult: any = await query(learnedSql, [userId]);
    const totalLearned = learnedResult[0]?.count || 0;

    // Total sessions
    const sessionsSql = `
      SELECT COUNT(*) as count
      FROM phien_hoc_tap
      WHERE nguoi_dung_id = ?
    `;
    const sessionsResult: any = await query(sessionsSql, [userId]);
    const totalSessions = sessionsResult[0]?.count || 0;

    // Favorite words
    const favoritesSql = `
      SELECT COUNT(*) as count
      FROM yeu_thich
      WHERE nguoi_dung_id = ?
    `;
    const favoritesResult: any = await query(favoritesSql, [userId]);
    const totalFavorites = favoritesResult[0]?.count || 0;

    // Words to review today
    const reviewSql = `
      SELECT COUNT(*) as count
      FROM tien_do_tu_vung
      WHERE nguoi_dung_id = ? 
        AND ngay_on_tap_tiep_theo <= NOW()
        AND da_hoc = TRUE
    `;
    const reviewResult: any = await query(reviewSql, [userId]);
    const wordsToReview = reviewResult[0]?.count || 0;

    return {
      totalLearned,
      totalSessions,
      totalFavorites,
      wordsToReview
    };
  }

  static async getLearningStreak(userId: string) {
    const sql = `
      SELECT DATE(bat_dau_luc) as date
      FROM phien_hoc_tap
      WHERE nguoi_dung_id = ? AND trang_thai = 'hoan-thanh'
      GROUP BY DATE(bat_dau_luc)
      ORDER BY date DESC
      LIMIT 30
    `;
    
    const results: any = await query(sql, [userId]);
    
    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const row of results) {
      const date = new Date(row.date);
      date.setHours(0, 0, 0, 0);
      
      const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return { streak, recentDates: results };
  }

  static async getAdminStats() {
    const stats = {
      totalUsers: 0,
      totalTopics: 0,
      totalWords: 0,
      totalSessions: 0,
      activeSessions: 0
    };

    const usersSql = `SELECT COUNT(*) as count FROM nguoi_dung WHERE vai_tro = 'user'`;
    const usersResult: any = await query(usersSql);
    stats.totalUsers = usersResult[0]?.count || 0;

    const topicsSql = `SELECT COUNT(*) as count FROM chu_de WHERE trang_thai = 'active'`;
    const topicsResult: any = await query(topicsSql);
    stats.totalTopics = topicsResult[0]?.count || 0;

    const wordsSql = `SELECT COUNT(*) as count FROM tu_vung`;
    const wordsResult: any = await query(wordsSql);
    stats.totalWords = wordsResult[0]?.count || 0;

    const sessionsSql = `SELECT COUNT(*) as count FROM phien_hoc_tap`;
    const sessionsResult: any = await query(sessionsSql);
    stats.totalSessions = sessionsResult[0]?.count || 0;

    const activeSql = `SELECT COUNT(*) as count FROM phien_hoc_tap WHERE trang_thai = 'dang-hoc'`;
    const activeResult: any = await query(activeSql);
    stats.activeSessions = activeResult[0]?.count || 0;

    return stats;
  }
}
