import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { uploadRoot } from '../config/upload';
import { AppError } from '../utils/app-error';
import { UuidUtil } from '../utils/uuid.util';

export class UploadService {
  /**
   * Kiểm tra định dạng và lưu file với tên do backend tạo
   */
  static async save(type: 'image' | 'audio', file?: Express.Multer.File) {
    if (!file) {
      throw new AppError('Vui lòng gửi file trong trường file', 400, 'FILE_REQUIRED');
    }

    // Đối chiếu MIME với chữ ký file, không tin tên file do client cung cấp
    const extension = this.getExtension(type, file);

    if (!extension) {
      const message =
        type === 'image' ? 'Chỉ nhận ảnh JPG/PNG hợp lệ' : 'Chỉ nhận âm thanh MP3 hợp lệ';

      throw new AppError(message, 400, 'INVALID_FILE_TYPE');
    }

    // Tên ngẫu nhiên giúp tránh ghi đè và đường dẫn không hợp lệ
    const folder = type === 'image' ? 'images' : 'audio';
    const name = UuidUtil.generate() + '.' + extension;
    const directory = path.join(uploadRoot, folder);

    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, name), file.buffer, { flag: 'wx' });

    return {
      url: '/uploads/' + folder + '/' + name,
      size: file.size,
    };
  }

  /**
   * Nhận diện các định dạng được phép từ phần đầu dữ liệu
   */
  private static getExtension(type: 'image' | 'audio', file: Express.Multer.File) {
    const bytes = file.buffer;

    if (type === 'image') {
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
    }

    if (
      type === 'audio' &&
      ['audio/mpeg', 'audio/mp3'].includes(file.mimetype) &&
      bytes.length >= 10
    ) {
      const hasId3Header = bytes.subarray(0, 3).toString('ascii') === 'ID3';
      const hasMpegHeader = bytes[0] === 255 && (bytes[1] & 0xe0) === 0xe0;

      if (hasId3Header || hasMpegHeader) {
        return 'mp3';
      }
    }

    return undefined;
  }
}
