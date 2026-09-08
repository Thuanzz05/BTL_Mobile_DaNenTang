import { prisma } from '../config/database';

export const getDashboard = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [tongNguoiDung, tongTuVung, tongChuDe, tongLuotHoc, nguoiDungMoi7Ngay, luotHoc7Ngay] = await Promise.all([
    prisma.nguoiDung.count(),
    prisma.tuVung.count(),
    prisma.chuDe.count(),
    prisma.phienHocTap.count(),
    prisma.nguoiDung.findMany({
      where: { ngayTao: { gte: sevenDaysAgo } },
      select: { id: true, ngayTao: true }
    }),
    prisma.phienHocTap.findMany({
      where: { batDauLuc: { gte: sevenDaysAgo } },
      select: { id: true, batDauLuc: true }
    })
  ]);

  return {
    tongNguoiDung,
    tongTuVung,
    tongChuDe,
    tongLuotHoc,
    nguoiDungMoi7Ngay,
    luotHoc7Ngay
  };
};

export const getTopicStats = async () => {
  const topics = await prisma.chuDe.findMany({
    include: {
      _count: {
        select: { phienHocTap: true }
      }
    },
    orderBy: {
      phienHocTap: { _count: 'desc' }
    },
    take: 10
  });

  return topics.map(t => ({
    id: t.id,
    ten: t.ten,
    sessionCount: t._count.phienHocTap
  }));
};

export const getWordStats = async () => {
  const words = await prisma.tuVung.findMany({
    include: {
      _count: {
        select: { ketQuaHoc: true }
      }
    },
    orderBy: {
      ketQuaHoc: { _count: 'desc' }
    },
    take: 10
  });

  return words.map(w => ({
    id: w.id,
    tuTiengAnh: w.tuTiengAnh,
    learningCount: w._count.ketQuaHoc
  }));
};

export const getLearningStats = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return await prisma.hoatDongHocTap.findMany({
    where: { ngayTao: { gte: sevenDaysAgo } },
    orderBy: { ngayTao: 'asc' }
  });
};
