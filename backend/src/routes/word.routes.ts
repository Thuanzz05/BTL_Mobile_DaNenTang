import { Router } from 'express';
import { WordController } from '../controllers/word.controller';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/words:
 *   get:
 *     summary: Lấy danh sách từ vựng
 *     tags: [Words]
 *     parameters:
 *       - in: query
 *         name: topicId
 *         schema:
 *           type: string
 *         description: Lọc theo chủ đề
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo từ hoặc nghĩa
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
 *         description: Danh sách từ vựng
 */
router.get('/', WordController.getAll);

/**
 * @swagger
 * /api/words/{id}:
 *   get:
 *     summary: Lấy chi tiết từ vựng kèm ví dụ
 *     tags: [Words]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết từ vựng
 *       404:
 *         description: Không tìm thấy từ
 */
router.get('/:id', WordController.getById);

/**
 * @swagger
 * /api/words:
 *   post:
 *     summary: Tạo từ vựng mới (Admin)
 *     tags: [Words]
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
 *               - tu_tieng_anh
 *               - nghia_tieng_viet
 *               - loai_tu
 *             properties:
 *               chu_de_id:
 *                 type: string
 *               tu_tieng_anh:
 *                 type: string
 *                 example: Apple
 *               phien_am:
 *                 type: string
 *                 example: "/ˈæpəl/"
 *               loai_tu:
 *                 type: string
 *                 enum: [danh-tu, dong-tu, tinh-tu, trang-tu, gioi-tu, lien-tu, dai-tu, tham-tu]
 *               nghia_tieng_viet:
 *                 type: string
 *                 example: Quả táo
 *               thu_tu_hien_thi:
 *                 type: integer
 *               vi_du:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     cau_tieng_anh:
 *                       type: string
 *                     cau_tieng_viet:
 *                       type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', authMiddleware, adminMiddleware, WordController.create);

/**
 * @swagger
 * /api/words/{id}:
 *   put:
 *     summary: Cập nhật từ vựng (Admin)
 *     tags: [Words]
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
router.put('/:id', authMiddleware, adminMiddleware, WordController.update);

/**
 * @swagger
 * /api/words/{id}:
 *   delete:
 *     summary: Xóa từ vựng (Admin)
 *     tags: [Words]
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
router.delete('/:id', authMiddleware, adminMiddleware, WordController.delete);

export default router;
