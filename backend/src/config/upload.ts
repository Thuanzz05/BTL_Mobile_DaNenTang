import path from 'path';

// Dùng chung thư mục lưu file cho middleware static và dịch vụ upload
export const uploadRoot = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')
);
