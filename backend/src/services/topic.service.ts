import { prisma } from '../config/database';

export const getAll = async (nguoiDungId?: string) => {
  const topics = await prisma.chuDe.findMany({
    where: { trangThai: 'active' },
    orderBy: { thuTuHienThi: 'asc' },
    include: {
      _count: {
        select: { tuVung: true }
      }
    }
  });

  if (!nguoiDungId) return topics;

  const results = await Promise.all(
    topics.map(async (topic) => {
      const learnedCount = await prisma.tienDoTuVung.count({
        where: {
          nguoiDungId,
          daHoc: true,
          tuVung: { chuDeId: topic.id }
        }
      });
      return { ...topic, learnedCount };
    })
  );

  return results;
};

export const getById = async (id: string, nguoiDungId?: string) => {
  const topic = await prisma.chuDe.findUnique({
    where: { id },
    include: {
      _count: {
        select: { tuVung: true }
      }
    }
  });

  if (!topic) throw new Error('Chủ đề không tồn tại');

  if (nguoiDungId) {
    const learnedCount = await prisma.tienDoTuVung.count({
      where: {
        nguoiDungId,
        daHoc: true,
        tuVung: { chuDeId: topic.id }
      }
    });
    return { ...topic, learnedCount };
  }

  return topic;
};
