import { Router } from 'express';
import { z } from 'zod';
import { AdminAchievementController as controller } from '../controllers/admin-achievement.controller';
import { validate } from '../middlewares/validate.middleware';
import { achievementSchema, achievementUpdateSchema } from '../validations/achievement.schemas';
import { identifier } from '../validations/request.schemas';

// Chỉ mount sau authMiddleware và adminMiddleware của admin.routes.
const router = Router();
const validateId = validate(z.object({ id: identifier }), 'params');

/**
 * @swagger
 * components:
 *   schemas:
 *     AchievementInput:
 *       type: object
 *       required: [tieu_de, mo_ta, bieu_tuong, diem_thuong, loai, moc]
 *       properties:
 *         tieu_de: { type: string, maxLength: 150 }
 *         mo_ta: { type: string, maxLength: 5000 }
 *         bieu_tuong: { type: string, enum: [medal, flame, book, star] }
 *         diem_thuong: { type: integer, minimum: 0, maximum: 1000000 }
 *         loai: { type: string, enum: [completed_sessions, learned_words, streak] }
 *         moc: { type: integer, minimum: 1, maximum: 1000000 }
 *         trang_thai: { type: string, enum: [active, inactive], default: active }
 * /api/admin/achievements:
 *   get:
 *     summary: Tìm thành tích và số người đã đạt (admin)
 *     tags: [Admin]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: type, schema: { type: string, enum: [completed_sessions, learned_words, streak] } }
 *       - { in: query, name: status, schema: { type: string, enum: [active, inactive] } }
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100 } }
 *     responses:
 *       200: { description: items và pagination; mỗi thành tích có so_nguoi_dat }
 *       403: { description: Yêu cầu quyền admin }
 *   post:
 *     summary: Thêm thành tích (admin)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AchievementInput' }
 *     responses:
 *       201: { description: Đã thêm thành tích }
 *       400: { description: Dữ liệu không hợp lệ }
 * /api/admin/achievements/{id}:
 *   parameters:
 *     - { in: path, name: id, required: true, schema: { type: string } }
 *   put:
 *     summary: Sửa thành tích hoặc bật/tắt cấp mới (admin)
 *     description: Gửi các trường muốn sửa. Sau khi đã trao, không đổi loai, moc hoặc diem_thuong. Tắt cấp mới vẫn giữ huy hiệu và điểm đã nhận.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               tieu_de: { type: string, maxLength: 150 }
 *               mo_ta: { type: string, maxLength: 5000 }
 *               bieu_tuong: { type: string, enum: [medal, flame, book, star] }
 *               diem_thuong: { type: integer, minimum: 0, maximum: 1000000 }
 *               loai: { type: string, enum: [completed_sessions, learned_words, streak] }
 *               moc: { type: integer, minimum: 1, maximum: 1000000 }
 *               trang_thai: { type: string, enum: [active, inactive] }
 *     responses:
 *       200: { description: Đã cập nhật }
 *       404: { description: Không tìm thấy thành tích }
 *       409: { description: Điều kiện và điểm thưởng của thành tích đã trao bị khóa }
 *   delete:
 *     summary: Xóa thành tích chưa có người nhận (admin)
 *     tags: [Admin]
 *     responses:
 *       200: { description: Đã xóa }
 *       404: { description: Không tìm thấy thành tích }
 *       409: { description: Đã có người nhận; hãy tắt cấp mới }
 * /api/admin/achievements/{id}/recipients:
 *   get:
 *     summary: Người đã đạt thành tích, có tìm kiếm và phân trang (admin)
 *     tags: [Admin]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: search, schema: { type: string }, description: Tên hoặc email người nhận }
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100 } }
 *     responses:
 *       200: { description: achievement với tổng so_nguoi_dat; items với ngày mở khóa và pagination }
 *       404: { description: Không tìm thấy thành tích }
 */
router.get('/', controller.list);
router.post('/', validate(achievementSchema), controller.create);
router.get('/:id/recipients', validateId, controller.recipients);
router.put('/:id', validateId, validate(achievementUpdateSchema), controller.update);
router.delete('/:id', validateId, controller.remove);

export default router;
