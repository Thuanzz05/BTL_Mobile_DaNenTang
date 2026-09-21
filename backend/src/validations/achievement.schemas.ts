import { z } from 'zod';

export const achievementType = z.enum(['completed_sessions', 'learned_words', 'streak']);

export const achievementSchema = z
  .object({
    tieu_de: z.string().trim().min(1).max(150),
    mo_ta: z.string().trim().min(1).max(5000),
    bieu_tuong: z.enum(['medal', 'flame', 'book', 'star']),
    diem_thuong: z.number().int().min(0).max(1000000),
    loai: achievementType,
    moc: z.number().int().min(1).max(1000000),
    trang_thai: z.enum(['active', 'inactive']).optional(),
  })
  .strict();

export const achievementUpdateSchema = achievementSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Cần ít nhất một trường để cập nhật');

export type AchievementInput = z.infer<typeof achievementSchema>;

// Query chung đã chuyển page/limit thành số trước khi đi vào route admin.
export const achievementListQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  type: achievementType.optional(),
  status: z.enum(['active', 'inactive']).optional(),
  page: z.number().int().min(1).max(1000000).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
