import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get user's favorite words
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite words
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/', authMiddleware, (req, res) => {
  res.json({ success: true, data: [], message: 'Get favorites - Coming soon' });
});

/**
 * @swagger
 * /api/favorites/{wordId}:
 *   post:
 *     summary: Add word to favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: wordId
 *         required: true
 *         schema:
 *           type: string
 *         description: Word ID to favorite
 *     responses:
 *       201:
 *         description: Word added to favorites
 *       400:
 *         description: Word already in favorites
 */
router.post('/:wordId', authMiddleware, (req, res) => {
  res.status(201).json({ success: true, message: 'Add favorite - Coming soon' });
});

/**
 * @swagger
 * /api/favorites/{wordId}:
 *   delete:
 *     summary: Remove word from favorites
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
 *         description: Word removed from favorites
 */
router.delete('/:wordId', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Remove favorite - Coming soon' });
});

export default router;
