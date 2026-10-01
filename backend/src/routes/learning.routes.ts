import { Router } from 'express';
import { LearningController } from '../controllers/learning.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { ProgressController } from '../controllers/progress.controller';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';
import { identifier, schemas } from '../validations/request.schemas';

const router = Router();
// Chỉ giữ API kết quả để đọc/hoàn tất phiên cũ; không tạo phiên tự đánh giá mới.
router.post(['/start', '/review/start'], authMiddleware, (_req, res) =>
  res.status(410).json({
    success: false,
    message: 'Dùng /learning/flashcards/start để học và /quiz/review/start để ôn tập.',
    error: { code: 'LEGACY_LEARNING_DISABLED' },
  })
);
router.post(
  '/flashcards/start',
  authMiddleware,
  validate(z.object({ chu_de_id: identifier }).strict()),
  LearningController.startFlashcards
);
router.post(
  '/flashcards/view',
  authMiddleware,
  validate(z.object({ phien_hoc_tap_id: identifier, tu_vung_id: identifier }).strict()),
  LearningController.viewFlashcard
);
router.post(
  '/flashcards/complete',
  authMiddleware,
  validate(schemas.complete),
  LearningController.completeFlashcards
);

/**
 * @swagger
 * /api/learning/start:
 *   post:
 *     deprecated: true
 *     summary: API cũ đã đóng, dùng /api/learning/flashcards/start
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
 *       410:
 *         description: API đã đóng
 */

/**
 * @swagger
 * /api/learning/result:
 *   post:
 *     deprecated: true
 *     summary: Chỉ hoàn tất kết quả của phiên tự đánh giá đã tồn tại
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
 *     deprecated: true
 *     summary: API cũ đã đóng, dùng /api/quiz/review/start
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
 *       410:
 *         description: API đã đóng
 */

/**
 * @swagger
 * /api/learning/flashcards/start:
 *   post:
 *     summary: Tạo hoặc tiếp tục phiên flashcard từ chưa học theo mục tiêu 5, 10, 20 từ
 *     tags: [Learning]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chu_de_id]
 *             properties:
 *               chu_de_id: { type: string }
 *     responses:
 *       201: { description: ID phiên và danh sách từ kèm ví dụ, da_xem_luc }
 *       404: { description: Chủ đề không hiển thị hoặc không còn từ mới }
 * /api/learning/flashcards/view:
 *   post:
 *     summary: Lưu thẻ đã xem theo thứ tự, gửi lại không ghi trùng
 *     tags: [Learning]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phien_hoc_tap_id, tu_vung_id]
 *             properties:
 *               phien_hoc_tap_id: { type: string }
 *               tu_vung_id: { type: string }
 *     responses:
 *       200: { description: Đã lưu thẻ }
 *       409: { description: Thẻ không đúng thứ tự hoặc phiên đã đóng }
 * /api/learning/flashcards/complete:
 *   post:
 *     summary: Hoàn thành phiên đã xem đủ thẻ, đưa từ mới vào ngăn 1 và hẹn ôn sau 1 ngày
 *     tags: [Learning]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phien_hoc_tap_id]
 *             properties:
 *               phien_hoc_tap_id: { type: string }
 *     responses:
 *       200: { description: Đã lưu phiên, kết quả, tiến độ và kiểm tra huy hiệu }
 *       409: { description: Chưa xem hết thẻ }
 */

export default router;
