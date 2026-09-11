import { Router } from 'express';
import { ProgressController } from '../controllers/progress.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/progress:
 *   get:
 *     summary: Lấy tiến độ học tập tổng thể
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tiến độ học tập tổng hợp (hôm nay, tuần, tháng, theo chủ đề)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tong_so_tu_da_hoc:
 *                       type: integer
 *                     da_nho:
 *                       type: integer
 *                     chua_chac:
 *                       type: integer
 *                     chua_nho:
 *                       type: integer
 *                     ty_le:
 *                       type: integer
 *                     hom_nay:
 *                       type: integer
 *                     tuan_nay:
 *                       type: integer
 *                     thang_nay:
 *                       type: integer
 */
router.get('/', authMiddleware, ProgressController.getProgress);

/**
 * @swagger
 * /api/progress/topics:
 *   get:
 *     summary: Lấy tiến độ học tập theo từng chủ đề
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topicId
 *         schema:
 *           type: string
 *         description: Lọc theo chủ đề cụ thể
 *     responses:
 *       200:
 *         description: Tiến độ theo chủ đề
 */
router.get('/topics', authMiddleware, ProgressController.getProgressByTopic);

/**
 * @swagger
 * /api/progress/review:
 *   get:
 *     summary: Lấy danh sách từ cần ôn tập
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Danh sách từ cần ôn theo SRS
 */
router.get('/review', authMiddleware, ProgressController.getWordsToReview);

export default router;
