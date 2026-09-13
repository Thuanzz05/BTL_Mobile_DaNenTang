import multer from 'multer';

// Chỉ giữ file trong bộ nhớ; UploadService kiểm tra nội dung trước khi ghi xuống ổ đĩa
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
    fields: 0,
    parts: 2,
  },
}).single('file');

export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 0,
    parts: 2,
  },
}).single('file');
