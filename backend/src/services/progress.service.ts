import { prisma } from '../config/database';

export const getOverall = async (nguoiDungId: string) => {
  const progresses = await prisma.tienDoTuVung.findMany({
    where: { nguoiDungId, daHoc: true }
  });

  const tongSoTuDaHoc = progresses.length;
  const daNho = progresses.filter(p => p.trangThaiNho === 'da_nho' || p.trangThaiNho === 'thuoc_long').length;
  const chuaChac = progresses.filter(p => p.trangThaiNho === 'chua_chac').length;
  const chuaNho = progresses.filter(p => p.trangThaiNho === 'chua_nho' || p.trangThaiNho === 'chua_hoc').length;

  const tyLe = tongSoTuDaHoc > 0 ? (daNho / tongSoTuDaHoc) * 100 : 0;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const homNay = await prisma.phienHocTap.count({
    where: { nguoiDungId, trangThai: 'hoan_thanh', ketThucLuc: { gte: todayStart, lt: todayEnd } }
  });

  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const tuanNay = await prisma.phienHocTap.count({
    where: { nguoiDungId, trangThai: 'hoan_thanh', ketThucLuc: { gte: weekStart } }
  });

  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 30);
  const thangNay = await prisma.phienHocTap.count({
    where: { nguoiDungId, trangThai: 'hoan_thanh', ketThucLuc: { gte: monthStart } }
  });

  return { tongSoTuDaHoc, daNho, chuaChac, chuaNho, tyLe, homNay, tuanNay, thangNay };
};

export const getToday = async (nguoiDungId: string) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const resultsToday = await prisma.ketQuaHoc.findMany({
    where: {
      ngayTao: { gte: todayStart },
      phienHocTap: { nguoiDungId }
    }
  });

  return { wordsLearnedToday: resultsToday.length };
};

export const getByTopic = async (nguoiDungId: string, chuDeId: string) => {
  const progresses = await prisma.tienDoTuVung.findMany({
    where: { nguoiDungId, daHoc: true, tuVung: { chuDeId } }
  });

  return { 
    chuDeId,
    tongSoTuDaHoc: progresses.length,
    daNho: progresses.filter(p => p.trangThaiNho === 'da_nho' || p.trangThaiNho === 'thuoc_long').length,
    chuaChac: progresses.filter(p => p.trangThaiNho === 'chua_chac').length,
    chuaNho: progresses.filter(p => p.trangThaiNho === 'chua_nho' || p.trangThaiNho === 'chua_hoc').length
  };
};
