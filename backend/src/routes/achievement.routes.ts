import { Router } from 'express';
import { AchievementController } from '../controllers/achievement.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/achievements:
 *   get:
 *     summary: Lấy thành tích, huy hiệu và tự động mở khóa
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách huy hiệu cùng tiến độ của người dùng
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/', authMiddleware, AchievementController.getAchievements);

export default router;
