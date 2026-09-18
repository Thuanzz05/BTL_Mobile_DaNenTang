import { z } from 'zod';

export const identifier = z
  .string()
  .trim()
  .min(1)
  .max(36)
  .regex(/^[a-zA-Z0-9-]+$/);
const text = (max: number) => z.string().trim().min(1).max(max);
const password = z
  .string()
  .min(6)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Mật khẩu tối đa 72 byte');
const url = z
  .string()
  .max(500)
  .refine((value) => /^(https?:\/\/|\/(?!\/))/.test(value), 'URL không hợp lệ')
  .nullable()
  .optional();
const example = z
  .object({
    cau_tieng_anh: text(5000),
    cau_tieng_viet: text(5000),
    thu_tu_hien_thi: z.number().int().min(0).optional(),
  })
  .strict();
export const topicSchema = z
  .object({
    ten: text(255),
    mo_ta: z.string().max(5000).nullable().optional(),
    hinh_anh: url,
    trang_thai: z.enum(['active', 'inactive']).optional(),
    thu_tu_hien_thi: z.number().int().min(0).optional(),
  })
  .strict();
export const wordStatusSchema = z.enum(['active', 'inactive']);
export const wordSchema = z
  .object({
    chu_de_id: identifier,
    tu_tieng_anh: text(120),
    nghia_tieng_viet: text(255),
    phien_am: z.string().max(120).nullable().optional(),
    loai_tu: z.enum([
      'danh-tu',
      'dong-tu',
      'tinh-tu',
      'trang-tu',
      'gioi-tu',
      'lien-tu',
      'dai-tu',
      'tham-tu',
    ]),
    url_am_thanh: url,
    url_hinh_anh: url,
    trang_thai: wordStatusSchema.optional(),
    thu_tu_hien_thi: z.number().int().min(0).optional(),
    vi_du: z.array(example).max(20).optional(),
  })
  .strict();
export const schemas = {
  register: z
    .object({
      ho_ten: text(150).min(2),
      email: text(150)
        .email()
        .transform((value) => value.toLowerCase()),
      mat_khau: password,
    })
    .strict(),
  login: z
    .object({
      email: text(150)
        .email()
        .transform((value) => value.toLowerCase()),
      mat_khau: password,
    })
    .strict(),
  refresh: z.object({ refreshToken: text(2048) }).strict(),
  profile: z
    .object({
      ho_ten: text(150).min(2).optional(),
      anh_dai_dien: url,
      muc_tieu_hang_ngay: z.union([z.literal(5), z.literal(10), z.literal(20)]).optional(),
    })
    .strict(),
  password: z.object({ mat_khau_cu: password, mat_khau_moi: password }).strict(),
  start: z
    .object({ chu_de_id: identifier, tong_so_tu: z.number().int().min(5).max(50).default(20) })
    .strict(),
  review: z.object({ tong_so_tu: z.number().int().min(1).max(50).default(50) }).strict(),
  result: z
    .object({
      phien_hoc_tap_id: identifier,
      tu_vung_id: identifier,
      trang_thai: z.enum(['da-nho', 'chua-chac', 'chua-nho']),
    })
    .strict(),
  complete: z.object({ phien_hoc_tap_id: identifier }).strict(),
  status: z.object({ trang_thai: z.enum(['active', 'inactive', 'locked']) }).strict(),
};

const positiveQueryNumber = (max: number) =>
  z
    .string()
    .regex(/^[0-9]+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(max));
export const querySchema = z.object({
  page: positiveQueryNumber(1000000).optional(),
  limit: positiveQueryNumber(100).optional(),
  topicId: identifier.optional(),
  search: z.string().trim().max(150).optional(),
  status: z.enum(['active', 'inactive', 'locked']).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  minAttempts: positiveQueryNumber(100000).optional(),
});
