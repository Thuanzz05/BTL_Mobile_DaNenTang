import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { uploadRoot } from '../config/upload';
import { AppError } from '../utils/app-error';
import { UuidUtil } from '../utils/uuid.util';

export class UploadService {
  /**
   * Kiểm tra định dạng và lưu file với tên do backend tạo
   */
  static async save(file?: Express.Multer.File) {
    if (!file) {
      throw new AppError('Vui lòng gửi file trong trường file', 400, 'FILE_REQUIRED');
    }

    // Đối chiếu MIME với chữ ký file, không tin tên file do client cung cấp
    const extension = this.getExtension(file);

    if (!extension) {
      throw new AppError('Chỉ nhận ảnh JPG/PNG hợp lệ', 400, 'INVALID_FILE_TYPE');
    }

    // Tên ngẫu nhiên giúp tránh ghi đè và đường dẫn không hợp lệ
    const name = UuidUtil.generate() + '.' + extension;
    const directory = path.join(uploadRoot, 'images');

    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, name), file.buffer, { flag: 'wx' });

    return {
      url: '/uploads/images/' + name,
      size: file.size,
    };
  }

  /**
   * Nhận diện các định dạng được phép từ phần đầu dữ liệu
   */
  private static getExtension(file: Express.Multer.File) {
    const bytes = file.buffer;

    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    if (
      file.mimetype === 'image/png' &&
      bytes.length >= 24 &&
      bytes.subarray(0, 8).equals(pngSignature)
    ) {
      return 'png';
    }

    if (
      file.mimetype === 'image/jpeg' &&
      bytes.length >= 4 &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255
    ) {
      return 'jpg';
    }

    return undefined;
  }
}
