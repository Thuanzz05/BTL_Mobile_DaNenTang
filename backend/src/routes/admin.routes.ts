import { Router } from 'express';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
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
 *                     totalUsers:
 *                       type: integer
 *                     totalTopics:
 *                       type: integer
 *                     totalWords:
 *                       type: integer
 *                     activeSessions:
 *                       type: integer
 */
router.get('/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      totalUsers: 0, 
      totalTopics: 0, 
      totalWords: 0, 
      activeSessions: 0 
    }, 
    message: 'Dashboard - Coming soon' 
  });
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, locked]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ success: true, data: [], message: 'Get users - Coming soon' });
});

/**
 * @swagger
 * /api/admin/users/{userId}/status:
 *   put:
 *     summary: Update user status (Admin only)
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, locked]
 *     responses:
 *       200:
 *         description: User status updated
 */
router.put('/users/:userId/status', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ success: true, message: 'Update user status - Coming soon' });
});

/**
 * @swagger
 * /api/admin/statistics:
 *   get:
 *     summary: Get detailed statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Statistics data
 */
router.get('/statistics', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ success: true, data: {}, message: 'Statistics - Coming soon' });
});

export default router;
