import { Router } from 'express';
import { FavoriteController } from '../controllers/favorite.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Lấy danh sách từ yêu thích của user
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách từ yêu thích (sắp xếp theo ngày thêm mới nhất)
 */
router.get('/', authMiddleware, FavoriteController.getAll);

/**
 * @swagger
 * /api/favorites/{wordId}:
 *   post:
 *     summary: Thêm/bỏ yêu thích (toggle)
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID từ vựng
 *     responses:
 *       201:
 *         description: Đã thêm vào yêu thích
 *       200:
 *         description: Đã bỏ khỏi yêu thích
 */
router.post('/:wordId', authMiddleware, FavoriteController.toggle);

/**
 * @swagger
 * /api/favorites/{wordId}:
 *   delete:
 *     summary: Xóa từ khỏi yêu thích
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đã bỏ khỏi yêu thích
 */
router.delete('/:wordId', authMiddleware, FavoriteController.remove);

/**
 * @swagger
 * /api/favorites/{wordId}:
 *   put:
 *     summary: Thêm yêu thích, gửi lặp vẫn giữ trạng thái đã thêm
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Từ đã nằm trong danh sách yêu thích
 *       404:
 *         description: Không tìm thấy từ
 */

export default router;
