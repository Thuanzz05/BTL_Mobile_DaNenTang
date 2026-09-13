import { Router } from 'express';
import { TopicController } from '../controllers/topic.controller';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { topicSchema } from '../validations/request.schemas';

const router = Router();

/**
 * @swagger
 * /api/topics:
 *   get:
 *     summary: Get all topics
 *     tags: [Topics]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of topics
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
router.get('/', optionalAuthMiddleware, TopicController.getAll);

/**
 * @swagger
 * /api/topics/{id}:
 *   get:
 *     summary: Get topic by ID
 *     tags: [Topics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Topic ID
 *     responses:
 *       200:
 *         description: Topic details
 *       404:
 *         description: Topic not found
 */
router.get('/:id', optionalAuthMiddleware, TopicController.getById);

/**
 * @swagger
 * /api/topics:
 *   post:
 *     summary: Create new topic (Admin only)
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ten
 *             properties:
 *               ten:
 *                 type: string
 *                 example: Animals
 *               mo_ta:
 *                 type: string
 *                 example: Learn about animals vocabulary
 *               hinh_anh:
 *                 type: string
 *                 example: /uploads/images/animals.jpg
 *     responses:
 *       201:
 *         description: Topic created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post('/', authMiddleware, adminMiddleware, validate(topicSchema), TopicController.create);

/**
 * @swagger
 * /api/topics/{id}:
 *   put:
 *     summary: Update topic (Admin only)
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ten:
 *                 type: string
 *               mo_ta:
 *                 type: string
 *               trang_thai:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Topic updated successfully
 *       404:
 *         description: Topic not found
 */
router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  validate(topicSchema.partial()),
  TopicController.update
);

/**
 * @swagger
 * /api/topics/{id}:
 *   delete:
 *     summary: Delete topic (Admin only)
 *     tags: [Topics]
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
 *         description: Topic deleted successfully
 *       404:
 *         description: Topic not found
 */
router.delete('/:id', authMiddleware, adminMiddleware, TopicController.delete);

export default router;
