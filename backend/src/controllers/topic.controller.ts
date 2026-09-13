import { NextFunction, Request, Response } from 'express';
import { TopicService } from '../services/topic.service';
import { ResponseUtil } from '../utils/response.util';

export class TopicController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;
      const topics = await TopicService.getAllTopics(
        req.user?.vai_tro === 'admin' ? (status as string) : 'active'
      );
      return ResponseUtil.success(res, topics, 'Lấy danh sách chủ đề thành công');
    } catch (error: any) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const topic = await TopicService.getTopicById(id);

      if (!topic || (req.user?.vai_tro !== 'admin' && topic.trang_thai !== 'active')) {
        return ResponseUtil.notFound(res, 'Không tìm thấy chủ đề');
      }

      return ResponseUtil.success(res, topic, 'Lấy thông tin chủ đề thành công');
    } catch (error: any) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const topic = await TopicService.createTopic(data);
      return ResponseUtil.success(res, topic, 'Tạo chủ đề thành công', 201);
    } catch (error: any) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;
      const topic = await TopicService.updateTopic(id, data);

      if (!topic) {
        return ResponseUtil.notFound(res, 'Không tìm thấy chủ đề');
      }

      return ResponseUtil.success(res, topic, 'Cập nhật chủ đề thành công');
    } catch (error: any) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await TopicService.deleteTopic(id);
      return ResponseUtil.success(res, null, 'Xóa chủ đề thành công');
    } catch (error: any) {
      return next(error);
    }
  }
}
