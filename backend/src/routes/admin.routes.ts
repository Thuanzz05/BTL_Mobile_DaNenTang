import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { TopicController } from '../controllers/topic.controller';
import { WordController } from '../controllers/word.controller';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { schemas, topicSchema, wordSchema } from '../validations/request.schemas';
import { uploadAudio, uploadImage } from '../middlewares/upload.middleware';
import { UploadController } from '../controllers/upload.controller';

const router = Router();

// Áp dụng auth + admin middleware cho tất cả route admin
router.use(authMiddleware, adminMiddleware);
router.post('/upload/image', uploadImage, UploadController.uploadImage);
router.post('/upload/audio', uploadAudio, UploadController.uploadAudio);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Lấy thống kê dashboard admin
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Số liệu tổng hợp và biểu đồ 7 ngày
 */
router.get('/dashboard', AdminController.getDashboard);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Danh sách người dùng (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên hoặc email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, locked]
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
 *         description: Danh sách người dùng có phân trang
 */
router.get('/users', AdminController.getUsers);

/**
 * @swagger
 * /api/admin/users/{userId}/status:
 *   put:
 *     summary: Cập nhật trạng thái người dùng (khóa/mở khóa)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trang_thai
 *             properties:
 *               trang_thai:
 *                 type: string
 *                 enum: [active, locked, inactive]
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 */
router.put('/users/:userId/status', validate(schemas.status), AdminController.updateUserStatus);

/**
 * @swagger
 * /api/admin/statistics:
 *   get:
 *     summary: Thống kê chi tiết (chủ đề phổ biến, từ phổ biến, hoạt động)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê chi tiết
 */
router.get('/statistics', AdminController.getStatistics);

/**
 * @swagger
 * /api/admin/quiz-statistics:
 *   get:
 *     summary: Thống kê lượt trả lời đúng/sai và từ cần luyện từ dữ liệu quiz thật
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *       - { in: query, name: minAttempts, schema: { type: integer, minimum: 1, default: 5 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *     responses:
 *       200: { description: Khoảng ngày theo giờ Việt Nam, tổng quan, từ cần luyện và hoạt động theo ngày }
 *       400: { description: Ngày không tồn tại, khoảng đảo ngược hoặc vượt 366 ngày }
 */
router.get('/quiz-statistics', AdminController.getQuizStatistics);

/**
 * @swagger
 * /api/admin/topics:
 *   get:
 *     summary: Lấy tất cả chủ đề (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách chủ đề
 */
router.get('/topics', TopicController.getAll);

/**
 * @swagger
 * /api/admin/topics:
 *   post:
 *     summary: Tạo chủ đề mới (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ten
 *             properties:
 *               ten:
 *                 type: string
 *               mo_ta:
 *                 type: string
 *               hinh_anh:
 *                 type: string
 *               trang_thai:
 *                 type: string
 *                 enum: [active, inactive]
 *               thu_tu_hien_thi:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tạo chủ đề thành công
 */
router.post('/topics', validate(topicSchema), TopicController.create);

/**
 * @swagger
 * /api/admin/topics/{id}:
 *   put:
 *     summary: Cập nhật chủ đề (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/topics/:id', validate(topicSchema.partial()), TopicController.update);

/**
 * @swagger
 * /api/admin/topics/{id}:
 *   delete:
 *     summary: Xóa chủ đề (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/topics/:id', TopicController.delete);

/**
 * @swagger
 * /api/admin/words:
 *   get:
 *     summary: Lấy danh sách từ vựng (Admin, có filter)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         description: Trạng thái riêng của từ; bỏ qua để xem cả từ hiện và ẩn
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *       - in: query
 *         name: topicId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách từ vựng
 */
router.get('/words', WordController.getAll);

/**
 * @swagger
 * /api/admin/words:
 *   post:
 *     summary: Tạo từ vựng mới (Admin)
 *     description: Nhận trang_thai là active hoặc inactive; mặc định active nếu không gửi.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/words', validate(wordSchema), WordController.create);

/**
 * @swagger
 * /api/admin/words/{id}:
 *   put:
 *     summary: Cập nhật từ vựng (Admin)
 *     description: Gửi riêng trang_thai để ẩn/hiện từ và giữ nguyên ví dụ, lịch sử, tiến độ. Chỉ ảnh hưởng thư viện và phiên học mới.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trang_thai:
 *                 type: string
 *                 enum: [active, inactive]
 *           example: { trang_thai: inactive }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/words/:id', validate(wordSchema.partial()), WordController.update);

/**
 * @swagger
 * /api/admin/words/{id}:
 *   delete:
 *     summary: Xóa từ vựng (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/words/:id', WordController.delete);

/**
 * @swagger
 * /api/admin/upload/image:
 *   post:
 *     summary: Upload ảnh JPG/PNG tối đa 2 MB (admin)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: URL ảnh trong data.url
 *       400:
 *         description: File không đúng định dạng
 *       413:
 *         description: File vượt giới hạn
 * /api/admin/upload/audio:
 *   post:
 *     summary: Upload âm thanh MP3 tối đa 5 MB (admin)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: URL âm thanh trong data.url
 *       400:
 *         description: File không đúng định dạng
 *       413:
 *         description: File vượt giới hạn
 */

export default router;
