import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/learning/start:
 *   post:
 *     summary: Start a new learning session
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topicId
 *             properties:
 *               topicId:
 *                 type: string
 *                 description: Topic ID to learn
 *               wordCount:
 *                 type: integer
 *                 default: 10
 *                 description: Number of words in session
 *     responses:
 *       201:
 *         description: Learning session started
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
 *                     sessionId:
 *                       type: string
 *                     words:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.post('/start', authMiddleware, (req, res) => {
  res.status(201).json({ 
    success: true, 
    data: { sessionId: '123', words: [] }, 
    message: 'Start learning - Coming soon' 
  });
});

/**
 * @swagger
 * /api/learning/result:
 *   post:
 *     summary: Submit learning result for a word
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - wordId
 *               - status
 *             properties:
 *               sessionId:
 *                 type: string
 *               wordId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [forgotten, uncertain, remembered, mastered]
 *     responses:
 *       200:
 *         description: Result recorded
 */
router.post('/result', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Submit result - Coming soon' });
});

/**
 * @swagger
 * /api/learning/progress:
 *   get:
 *     summary: Get user learning progress
 *     tags: [Learning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topicId
 *         schema:
 *           type: string
 *         description: Filter by topic
 *     responses:
 *       200:
 *         description: Learning progress statistics
 */
router.get('/progress', authMiddleware, (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      totalWords: 0, 
      mastered: 0, 
      learning: 0 
    }, 
    message: 'Get progress - Coming soon' 
  });
});

export default router;
