import { Router } from 'express';
import { LearningController } from '../controllers/learning.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { ProgressController } from '../controllers/progress.controller';
import { validate } from '../middlewares/validate.middleware';
import { schemas } from '../validations/request.schemas';

const router = Router();

/**
 * @swagger
 * /api/learning/start:
 *   post:
 *     summary: Bắt đầu phiên học mới
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chu_de_id
 *             properties:
 *               chu_de_id:
 *                 type: string
 *                 description: ID chủ đề muốn học
 *               tong_so_tu:
 *                 type: integer
 *                 default: 20
 *                 minimum: 5
 *                 maximum: 50
 *                 description: Số từ mỗi phiên (5-50)
 *     responses:
 *       201:
 *         description: Tạo phiên học thành công
 */
router.post('/start', authMiddleware, validate(schemas.start), LearningController.startSession);
router.post(
  '/review/start',
  authMiddleware,
  validate(schemas.review),
  LearningController.startReviewSession
);

/**
 * @swagger
 * /api/learning/result:
 *   post:
 *     summary: Nộp kết quả học từng từ
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phien_hoc_tap_id
 *               - tu_vung_id
 *               - trang_thai
 *             properties:
 *               phien_hoc_tap_id:
 *                 type: string
 *               tu_vung_id:
 *                 type: string
 *               trang_thai:
 *                 type: string
 *                 enum: [da-nho, chua-chac, chua-nho]
 *     responses:
 *       200:
 *         description: Lưu kết quả thành công
 */
router.post('/result', authMiddleware, validate(schemas.result), LearningController.submitResult);

/**
 * @swagger
 * /api/learning/complete:
 *   post:
 *     summary: Hoàn thành phiên học
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phien_hoc_tap_id
 *             properties:
 *               phien_hoc_tap_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Hoàn thành phiên học, trả về tóm tắt kết quả
 */
router.post(
  '/complete',
  authMiddleware,
  validate(schemas.complete),
  LearningController.completeSession
);

/**
 * @swagger
 * /api/learning/result/{sessionId}:
 *   get:
 *     summary: Lấy kết quả chi tiết phiên học
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
 *         description: Kết quả chi tiết phiên học
 */
router.get('/result/:sessionId', authMiddleware, LearningController.getSessionResult);

/**
 * @swagger
 * /api/learning/review:
 *   get:
 *     summary: Lấy danh sách từ cần ôn tập hôm nay (SRS)
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Danh sách từ cần ôn
 */
router.get('/review', authMiddleware, LearningController.getReviewWords);

/**
 * @swagger
 * /api/learning/progress:
 *   get:
 *     summary: Lấy tiến độ học tập
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tiến độ học tập
 */
router.get('/progress', authMiddleware, ProgressController.getProgress);

/**
 * @swagger
 * /api/learning/review/start:
 *   post:
 *     summary: Tạo phiên ôn từ các từ đến hạn, kể cả từ đã nhớ
 *     tags: [Learning]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tong_so_tu:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 50
 *     responses:
 *       201:
 *         description: Phiên ôn và danh sách từ cố định
 *       404:
 *         description: Không có từ đến hạn ôn
 */

export default router;
