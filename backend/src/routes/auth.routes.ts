import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { schemas } from '../validations/request.schemas';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     security: []
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ho_ten
 *               - email
 *               - mat_khau
 *             properties:
 *               ho_ten:
 *                 type: string
 *                 example: Nguyen Van A
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               mat_khau:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input or email already exists
 */
router.post('/register', validate(schemas.register), AuthController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     security: []
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - mat_khau
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               mat_khau:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     accessToken:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(schemas.login), AuthController.login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authMiddleware, AuthController.getProfile);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authMiddleware, validate(schemas.refresh), AuthController.logout);
router.post('/refresh', validate(schemas.refresh), AuthController.refreshToken);
router.get('/me', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, validate(schemas.profile), AuthController.updateProfile);
router.post(
  '/change-password',
  authMiddleware,
  validate(schemas.password),
  AuthController.changePassword
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Cấp access token mới từ refresh token còn hiệu lực
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access token mới
 *       401:
 *         description: Token hết hạn hoặc bị thu hồi
 *       403:
 *         description: Tài khoản bị khóa
 * /api/auth/me:
 *   get:
 *     summary: Hồ sơ người dùng hiện tại (tương đương GET /api/auth/profile)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Hồ sơ người dùng
 * /api/auth/profile:
 *   put:
 *     summary: Cập nhật hồ sơ cá nhân
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ho_ten:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 150
 *               anh_dai_dien:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Hồ sơ đã cập nhật
 * /api/auth/change-password:
 *   post:
 *     summary: Đổi mật khẩu và yêu cầu đăng nhập lại
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mat_khau_cu, mat_khau_moi]
 *             properties:
 *               mat_khau_cu:
 *                 type: string
 *                 format: password
 *               mat_khau_moi:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Đã đổi mật khẩu, toàn bộ token cũ hết hiệu lực
 */

export default router;
