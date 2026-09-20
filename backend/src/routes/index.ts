import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { querySchema } from '../validations/request.schemas';
import achievementRoutes from './achievement.routes';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import favoriteRoutes from './favorite.routes';
import historyRoutes from './history.routes';
import homeRoutes from './home.routes';
import learningRoutes from './learning.routes';
import progressRoutes from './progress.routes';
import topicRoutes from './topic.routes';
import wordRoutes from './word.routes';
import quizRoutes from './quiz.routes';
import webAuthRoutes from './web-auth.routes';

const router = Router();
router.use(validate(querySchema, 'query'));

// Mount routes
router.use('/auth', authRoutes);
router.use('/web-auth', webAuthRoutes);
router.use('/topics', topicRoutes);
router.use('/words', wordRoutes);
router.use('/learning', learningRoutes);
router.use('/quiz', quizRoutes);
router.use('/progress', progressRoutes);
router.use('/history', historyRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/home', homeRoutes);
router.use('/achievements', achievementRoutes);
router.use('/admin', adminRoutes);

export default router;
