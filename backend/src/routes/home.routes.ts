import { Router } from 'express';
import { HomeController } from '../controllers/home.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Trang chủ yêu cầu đăng nhập để lấy đúng dữ liệu của người học
router.get('/dashboard', authMiddleware, HomeController.getDashboard);

/**
 * @swagger
 * /api/home/dashboard:
 *   get:
 *     summary: Trang chủ gồm hồ sơ, tiến độ hôm nay, chủ đề phổ biến và số từ cần ôn
 *     tags: [Home]
 *     responses:
 *       200:
 *         description: Dữ liệu trang chủ theo tài khoản đăng nhập
 */

export default router;
