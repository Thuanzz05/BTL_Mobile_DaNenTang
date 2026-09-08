import { Router } from 'express';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/words:
 *   get:
 *     summary: Get all words
 *     tags: [Words]
 *     parameters:
 *       - in: query
 *         name: topicId
 *         schema:
 *           type: string
 *         description: Filter by topic ID
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filter by difficulty level
 *     responses:
 *       200:
 *         description: List of words
 */
router.get('/', (req, res) => {
  res.json({ success: true, data: [], message: 'Get words - Coming soon' });
});

/**
 * @swagger
 * /api/words/{id}:
 *   get:
 *     summary: Get word by ID
 *     tags: [Words]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Word details with examples
 */
router.get('/:id', (req, res) => {
  res.json({ success: true, data: {}, message: 'Get word detail - Coming soon' });
});

/**
 * @swagger
 * /api/words:
 *   post:
 *     summary: Create new word (Admin only)
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
 *               - topicId
 *               - word
 *               - vietnameseMeaning
 *               - partOfSpeech
 *             properties:
 *               topicId:
 *                 type: string
 *               word:
 *                 type: string
 *                 example: cat
 *               pronunciation:
 *                 type: string
 *                 example: /kæt/
 *               vietnameseMeaning:
 *                 type: string
 *                 example: con mèo
 *               partOfSpeech:
 *                 type: string
 *                 enum: [noun, verb, adjective, adverb]
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *     responses:
 *       201:
 *         description: Word created successfully
 */
router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  res.status(201).json({ success: true, data: {}, message: 'Create word - Coming soon' });
});

export default router;
