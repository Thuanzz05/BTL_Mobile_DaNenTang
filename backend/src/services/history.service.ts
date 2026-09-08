import { prisma } from '../config/database';

export const getHistory = async (nguoiDungId: string, limit: number = 20, page: number = 1) => {
  const skip = (page - 1) * limit;

  const [total, sessions] = await Promise.all([
    prisma.phienHocTap.count({ where: { nguoiDungId } }),
    prisma.phienHocTap.findMany({
      where: { nguoiDungId },
      orderBy: { batDauLuc: 'desc' },
      skip,
      take: limit,
      include: {
        chuDe: { select: { ten: true } },
        ketQuaHoc: { select: { trangThai: true } }
      }
    })
  ]);

  const history = sessions.map(session => {
    const daNho = session.ketQuaHoc.filter(k => k.trangThai === 'da_nho').length;
    const chuaChac = session.ketQuaHoc.filter(k => k.trangThai === 'chua_chac').length;
    const chuaNho = session.ketQuaHoc.filter(k => k.trangThai === 'chua_nho').length;

    return {
      id: session.id,
      chuDe: session.chuDe.ten,
      batDauLuc: session.batDauLuc,
      ketThucLuc: session.ketThucLuc,
      trangThai: session.trangThai,
      tongSoTu: session.tongSoTu,
      ketQua: { daNho, chuaChac, chuaNho }
    };
  });

  return { total, page, limit, data: history };
};

export const getSessionDetail = async (phienHocTapId: string) => {
  const session = await prisma.phienHocTap.findUnique({
    where: { id: phienHocTapId },
    include: {
      chuDe: true,
      ketQuaHoc: {
        include: { tuVung: true }
      }
    }
  });

  if (!session) throw new Error('Phiên học không tồn tại');
  return session;
};
