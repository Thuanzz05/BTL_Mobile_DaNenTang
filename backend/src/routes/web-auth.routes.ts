import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { WebAuthController } from '../controllers/web-auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { schemas } from '../validations/request.schemas';
import { ResponseUtil } from '../utils/response.util';

const router = Router();

// Header tùy chỉnh buộc trình duyệt thực hiện CORS preflight, chặn gửi form CSRF.
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.get('X-Wordleaf-Client') !== 'admin-web') {
    return ResponseUtil.error(res, 'Thiếu xác thực ứng dụng web', 'WEB_CLIENT_REQUIRED', 403);
  }

  const allowed = (process.env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim());
  const origin = req.get('Origin');

  if (origin && !allowed.includes(origin)) {
    return ResponseUtil.error(res, 'Nguồn truy cập web không được phép', 'ORIGIN_DENIED', 403);
  }

  return next();
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    ResponseUtil.error(
      res,
      'Thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.',
      'RATE_LIMITED',
      429
    );
  },
});

/**
 * @swagger
 * /api/web-auth/login:
 *   post:
 *     summary: Đăng nhập admin web, refresh token trong cookie HttpOnly SameSite Strict
 *     tags: [Web Auth]
 *     parameters:
 *       - { in: header, name: X-Wordleaf-Client, required: true, schema: { type: string, enum: [admin-web] } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, mat_khau]
 *             properties:
 *               email: { type: string, format: email }
 *               mat_khau: { type: string, format: password }
 *     responses:
 *       200: { description: user và accessToken; refresh token chỉ ở Set-Cookie }
 *       403: { description: Không phải admin hoặc origin không được phép }
 * /api/web-auth/refresh:
 *   post:
 *     summary: Khôi phục phiên admin từ cookie, cần X-Wordleaf-Client
 *     tags: [Web Auth]
 *     responses:
 *       200: { description: user và accessToken }
 *       401: { description: Cookie hết hạn hoặc bị thu hồi }
 * /api/web-auth/logout:
 *   post:
 *     summary: Thu hồi và xóa cookie, cần X-Wordleaf-Client
 *     tags: [Web Auth]
 *     responses:
 *       200: { description: Đã đăng xuất }
 */
router.post('/login', loginLimiter, validate(schemas.login), WebAuthController.login);
router.post('/refresh', WebAuthController.refresh);
router.post('/logout', WebAuthController.logout);

export default router;
