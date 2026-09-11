import { Router } from 'express';
import { HistoryController } from '../controllers/history.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/history:
 *   get:
 *     summary: Lấy lịch sử học tập
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lịch sử học tập với phân trang
 */
router.get('/', authMiddleware, HistoryController.getHistory);

/**
 * @swagger
 * /api/history/{sessionId}:
 *   get:
 *     summary: Lấy chi tiết phiên học
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết phiên học kèm kết quả từng từ
 */
router.get('/:sessionId', authMiddleware, HistoryController.getSessionDetail);

export default router;
