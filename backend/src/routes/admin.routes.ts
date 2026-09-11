import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { TopicController } from '../controllers/topic.controller';
import { WordController } from '../controllers/word.controller';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Áp dụng auth + admin middleware cho tất cả route admin
router.use(authMiddleware, adminMiddleware);

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
router.put('/users/:userId/status', AdminController.updateUserStatus);

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
router.post('/topics', TopicController.create);

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
router.put('/topics/:id', TopicController.update);

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
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/words', WordController.create);

/**
 * @swagger
 * /api/admin/words/{id}:
 *   put:
 *     summary: Cập nhật từ vựng (Admin)
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
router.put('/words/:id', WordController.update);

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

export default router;
