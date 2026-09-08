import { prisma } from '../config/database';

export const getAll = async (nguoiDungId: string) => {
  return await prisma.yeuThich.findMany({
    where: { nguoiDungId },
    include: {
      tuVung: {
        include: { viDu: true }
      }
    },
    orderBy: { ngayTao: 'desc' }
  });
};

export const toggle = async (nguoiDungId: string, tuVungId: string) => {
  const existing = await prisma.yeuThich.findUnique({
    where: { nguoiDungId_tuVungId: { nguoiDungId, tuVungId } }
  });

  if (existing) {
    await prisma.yeuThich.delete({
      where: { nguoiDungId_tuVungId: { nguoiDungId, tuVungId } }
    });
    return { added: false };
  } else {
    await prisma.yeuThich.create({
      data: { nguoiDungId, tuVungId }
    });
    return { added: true };
  }
};

export const remove = async (id: string, nguoiDungId: string) => {
  const record = await prisma.yeuThich.findUnique({ where: { id } });
  if (!record || record.nguoiDungId !== nguoiDungId) {
    throw new Error('Bản ghi yêu thích không tồn tại hoặc không thuộc quyền sở hữu');
  }

  await prisma.yeuThich.delete({ where: { id } });
  return { success: true };
};
