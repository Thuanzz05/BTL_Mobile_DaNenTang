import { Router } from 'express';
import { z } from 'zod';
import { QuizController } from '../controllers/quiz.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { identifier, schemas } from '../validations/request.schemas';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/quiz/start:
 *   post:
 *     summary: Tạo phiên trắc nghiệm được server chấm (từ 5 đến 50 từ)
 *     tags: [Quiz]
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
 *               ma_yeu_cau: { type: string, format: uuid, description: Giữ nguyên mã khi thử tạo lại phiên sau mất mạng }
 *               tong_so_tu: { type: integer, minimum: 5, maximum: 50, default: 20 }
 *     responses:
 *       201: { description: Phiên và câu hỏi đầu tiên; không trả đáp án đúng }
 * /api/quiz/review/start:
 *   post:
 *     summary: Ôn từ đến hạn, hỗ trợ cả phiên chỉ có một từ
 *     tags: [Quiz]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tong_so_tu: { type: integer, minimum: 1, maximum: 50, default: 50 }
 *               ma_yeu_cau: { type: string, format: uuid, description: Giữ nguyên mã khi thử tạo lại phiên sau mất mạng }
 *     responses:
 *       201: { description: Phiên ôn và câu hỏi }
 */
const startRequest = { ma_yeu_cau: z.string().uuid().optional() };
router.post('/start', validate(schemas.start.extend(startRequest)), QuizController.start);
router.post('/review/start', validate(schemas.review.extend(startRequest)), QuizController.review);
router.use('/:sessionId', validate(z.object({ sessionId: identifier }), 'params'));

/**
 * @swagger
 * /api/quiz/{sessionId}:
 *   get:
 *     summary: Khôi phục câu hỏi và tiến độ đang lưu trên server
 *     tags: [Quiz]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: sessionId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Câu hỏi đang làm, số lượt đúng và số từ hoàn thành }
 * /api/quiz/{sessionId}/answers:
 *   post:
 *     summary: Chấm đáp án, lưu lượt trả lời và trả câu tiếp theo
 *     tags: [Quiz]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: sessionId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cau_hoi_id, lua_chon_id, ma_yeu_cau]
 *             properties:
 *               cau_hoi_id: { type: string, format: uuid }
 *               lua_chon_id: { type: string, format: uuid }
 *               ma_yeu_cau: { type: string, format: uuid, description: Giữ nguyên UUID và nội dung khi retry }
 *               thoi_gian_tra_loi_ms: { type: integer, minimum: 0, maximum: 3600000 }
 *     responses:
 *       200: { description: ket_qua và phien; tự hoàn thành khi tất cả từ đạt yêu cầu }
 *       409: { description: Câu đã trả lời hoặc mã yêu cầu bị tái sử dụng với nội dung khác }
 * /api/quiz/{sessionId}/stop:
 *   post:
 *     summary: Dừng phiên, giữ lại lịch sử trả lời
 *     tags: [Quiz]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: sessionId, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Trạng thái phiên sau khi dừng }
 */
router.get('/:sessionId', QuizController.getSession);
router.post(
  '/:sessionId/answers',
  validate(
    z
      .object({
        cau_hoi_id: z.string().uuid(),
        lua_chon_id: z.string().uuid(),
        ma_yeu_cau: z.string().uuid(),
        thoi_gian_tra_loi_ms: z.number().int().min(0).max(3600000).optional(),
      })
      .strict()
  ),
  QuizController.answer
);
router.post('/:sessionId/stop', QuizController.stop);

export default router;
