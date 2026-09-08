import { Router } from 'express';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import favoriteRoutes from './favorite.routes';
import historyRoutes from './history.routes';
import learningRoutes from './learning.routes';
import topicRoutes from './topic.routes';
import wordRoutes from './word.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/topics', topicRoutes);
router.use('/words', wordRoutes);
router.use('/learning', learningRoutes);
router.use('/history', historyRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/admin', adminRoutes);

export default router;
