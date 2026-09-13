import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { querySchema } from '../validations/request.schemas';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import favoriteRoutes from './favorite.routes';
import historyRoutes from './history.routes';
import homeRoutes from './home.routes';
import learningRoutes from './learning.routes';
import topicRoutes from './topic.routes';
import wordRoutes from './word.routes';

const router = Router();
router.use(validate(querySchema, 'query'));

// Mount routes
router.use('/auth', authRoutes);
router.use('/topics', topicRoutes);
router.use('/words', wordRoutes);
router.use('/learning', learningRoutes);
router.use('/history', historyRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/home', homeRoutes);
router.use('/admin', adminRoutes);

export default router;
