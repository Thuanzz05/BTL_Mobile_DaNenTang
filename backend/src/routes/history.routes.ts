import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/history:
 *   get:
 *     summary: Get user's learning history
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: topicId
 *         schema:
 *           type: string
 *         description: Filter by topic
 *     responses:
 *       200:
 *         description: Learning history with sessions
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
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 */
router.get('/', authMiddleware, (req, res) => {
  res.json({ 
    success: true, 
    data: { sessions: [], pagination: {} }, 
    message: 'History - Coming soon' 
  });
});

/**
 * @swagger
 * /api/history/{sessionId}:
 *   get:
 *     summary: Get detailed session history
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
 *         description: Session details with all results
 */
router.get('/:sessionId', authMiddleware, (req, res) => {
  res.json({ success: true, data: {}, message: 'Session detail - Coming soon' });
});

export default router;
