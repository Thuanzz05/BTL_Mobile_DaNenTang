import { prisma } from '../config/database';
import { calculateNextReviewDate, mapApiStatusToPrisma } from '../utils/srs.util';

export const startSession = async (nguoiDungId: string, chuDeId: string, tongSoTu: number) => {
  const words = await prisma.tuVung.findMany({
    where: { chuDeId },
    take: tongSoTu,
    include: { viDu: true }
  });

  if (words.length === 0) {
    throw new Error('Chủ đề này hiện chưa có từ vựng nào');
  }

  const session = await prisma.phienHocTap.create({
    data: {
      nguoiDungId,
      chuDeId,
      tongSoTu: words.length,
      trangThai: 'dang_hoc'
    }
  });

  return { session, words };
};

export const saveResult = async (data: { phienHocTapId: string; tuVungId: string; trangThai: string }) => {
  const session = await prisma.phienHocTap.findUnique({
    where: { id: data.phienHocTapId }
  });

  if (!session) throw new Error('Phiên học không tồn tại');
  if (session.trangThai !== 'dang_hoc') throw new Error('Phiên học đã kết thúc');

  const prismaStatus = mapApiStatusToPrisma(data.trangThai) as any;

  const result = await prisma.ketQuaHoc.create({
    data: {
      phienHocTapId: data.phienHocTapId,
      tuVungId: data.tuVungId,
      trangThai: prismaStatus
    }
  });

  const currentProgress = await prisma.tienDoTuVung.findUnique({
    where: { nguoiDungId_tuVungId: { nguoiDungId: session.nguoiDungId, tuVungId: data.tuVungId } }
  });

  const newReviewCount = (currentProgress?.soLanOnTap || 0) + 1;
  const nextReviewDate = calculateNextReviewDate(prismaStatus, newReviewCount);

  await prisma.tienDoTuVung.upsert({
    where: { nguoiDungId_tuVungId: { nguoiDungId: session.nguoiDungId, tuVungId: data.tuVungId } },
    update: {
      daHoc: true,
      soLanOnTap: newReviewCount,
      trangThaiNho: prismaStatus,
      ngayOnTapTiepTheo: nextReviewDate,
      lanOnTapCuoi: new Date(),
    },
    create: {
      nguoiDungId: session.nguoiDungId,
      tuVungId: data.tuVungId,
      daHoc: true,
      soLanOnTap: 1,
      trangThaiNho: prismaStatus,
      ngayOnTapTiepTheo: nextReviewDate,
      lanOnTapCuoi: new Date(),
    }
  });

  return result;
};

export const completeSession = async (phienHocTapId: string, nguoiDungId: string) => {
  const session = await prisma.phienHocTap.findUnique({ where: { id: phienHocTapId } });
  if (!session || session.nguoiDungId !== nguoiDungId) {
    throw new Error('Phiên học không hợp lệ');
  }

  const updatedSession = await prisma.phienHocTap.update({
    where: { id: phienHocTapId },
    data: {
      trangThai: 'hoan_thanh',
      ketThucLuc: new Date()
    }
  });

  await prisma.hoatDongHocTap.create({
    data: {
      nguoiDungId,
      loaiHoatDong: 'hoan_thanh_phien',
      moTa: `Hoàn thành phiên học chủ đề ID: ${session.chuDeId}`,
      diemKinhNghiem: 10
    }
  });

  return updatedSession;
};

export const getSessionResult = async (phienHocTapId: string) => {
  const session = await prisma.phienHocTap.findUnique({
    where: { id: phienHocTapId },
    include: { chuDe: true }
  });

  if (!session) throw new Error('Phiên học không tồn tại');

  const results = await prisma.ketQuaHoc.findMany({
    where: { phienHocTapId },
    include: { tuVung: true }
  });

  const daNho = results.filter(r => r.trangThai === 'da_nho').length;
  const chuaChac = results.filter(r => r.trangThai === 'chua_chac').length;
  const chuaNho = results.filter(r => r.trangThai === 'chua_nho').length;
  const tongSoTu = daNho + chuaChac + chuaNho;
  const tyLe = tongSoTu > 0 ? (daNho / tongSoTu) * 100 : 0;

  const danhSachTuChuaNho = results
    .filter(r => r.trangThai === 'chua_nho')
    .map(r => r.tuVung);

  return {
    tongSoTu,
    daNho,
    chuaChac,
    chuaNho,
    tyLe,
    danhSachTuChuaNho
  };
};

export const getReviewWords = async (nguoiDungId: string) => {
  const reviews = await prisma.tienDoTuVung.findMany({
    where: {
      nguoiDungId,
      trangThaiNho: { in: ['chua_nho', 'chua_chac'] as any[] },
      ngayOnTapTiepTheo: { lte: new Date() }
    },
    include: {
      tuVung: {
        include: { viDu: true }
      }
    },
    orderBy: { ngayOnTapTiepTheo: 'asc' },
    take: 50
  });

  return {
    soTuCanOn: reviews.length,
    danhSachTu: reviews.map(r => r.tuVung)
  };
};
