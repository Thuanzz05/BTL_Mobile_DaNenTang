import { NextFunction, Request, Response } from 'express';
import { LearningService } from '../services/learning.service';
import { QuizService } from '../services/quiz.service';
import { ResponseUtil } from '../utils/response.util';

export class QuizController {
  static async start(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await LearningService.startSession(
        req.user!.id,
        req.body.chu_de_id,
        req.body.tong_so_tu,
        'trac_nghiem'
      );
      const data = await QuizService.getSession(req.user!.id, session.phien_hoc_tap_id);
      return ResponseUtil.success(res, data, 'Bắt đầu trắc nghiệm thành công', 201);
    } catch (error) {
      return next(error);
    }
  }

  static async review(req: Request, res: Response, next: NextFunction) {
    try {
      const session = await LearningService.startReviewSession(
        req.user!.id,
        req.body.tong_so_tu,
        'trac_nghiem'
      );
      const data = await QuizService.getSession(req.user!.id, session.phien_hoc_tap_id);
      return ResponseUtil.success(res, data, 'Bắt đầu ôn tập thành công', 201);
    } catch (error) {
      return next(error);
    }
  }

  static async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await QuizService.getSession(req.user!.id, req.params.sessionId);
      return ResponseUtil.success(res, data);
    } catch (error) {
      return next(error);
    }
  }

  static async answer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await QuizService.answer(req.user!.id, req.params.sessionId, req.body);
      return ResponseUtil.success(res, data, 'Đã lưu câu trả lời');
    } catch (error) {
      return next(error);
    }
  }

  static async stop(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await QuizService.stop(req.user!.id, req.params.sessionId);
      return ResponseUtil.success(res, data, 'Đã dừng phiên học');
    } catch (error) {
      return next(error);
    }
  }
}
