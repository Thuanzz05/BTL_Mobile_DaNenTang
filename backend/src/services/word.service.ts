import { prisma } from '../config/database';

export const getByTopic = async (chuDeId: string, nguoiDungId?: string) => {
  const words = await prisma.tuVung.findMany({
    where: { chuDeId },
    orderBy: { thuTuHienThi: 'asc' }
  });

  if (!nguoiDungId) return words;

  const favoriteIds = new Set(
    (await prisma.yeuThich.findMany({
      where: { nguoiDungId, tuVungId: { in: words.map(w => w.id) } },
      select: { tuVungId: true }
    })).map(f => f.tuVungId)
  );

  return words.map(w => ({
    ...w,
    isFavorite: favoriteIds.has(w.id)
  }));
};

export const getById = async (id: string, nguoiDungId?: string) => {
  const word = await prisma.tuVung.findUnique({
    where: { id },
    include: { viDu: true }
  });

  if (!word) throw new Error('Từ vựng không tồn tại');

  if (nguoiDungId) {
    const isFavorite = await prisma.yeuThich.findUnique({
      where: { nguoiDungId_tuVungId: { nguoiDungId, tuVungId: id } }
    });
    return { ...word, isFavorite: !!isFavorite };
  }

  return word;
};

export const create = async (data: any) => {
  const { viDu, ...wordData } = data;
  return await prisma.tuVung.create({
    data: {
      ...wordData,
      viDu: viDu && viDu.length > 0 ? { create: viDu } : undefined
    },
    include: { viDu: true }
  });
};

export const update = async (id: string, data: any) => {
  return await prisma.tuVung.update({
    where: { id },
    data
  });
};

export const deleteWord = async (id: string) => {
  // Check if in active session (ketQuaHoc -> phienHocTap.trangThai == dang_hoc)
  const activeSessionResults = await prisma.ketQuaHoc.findFirst({
    where: {
      tuVungId: id,
      phienHocTap: {
        trangThai: 'dang_hoc'
      }
    }
  });

  if (activeSessionResults) {
    throw new Error('Không thể xóa từ vựng đang trong phiên học đang diễn ra');
  }

  await prisma.tuVung.delete({ where: { id } });
  return { success: true };
};

export const uploadAudio = async (id: string, filePath: string) => {
  return await prisma.tuVung.update({
    where: { id },
    data: { urlAmThanh: filePath }
  });
};

export const uploadImage = async (id: string, filePath: string) => {
  return await prisma.tuVung.update({
    where: { id },
    data: { urlHinhAnh: filePath }
  });
};
