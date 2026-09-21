import { BookOpen, Flame, Medal, Star } from 'lucide-react';
import type { AchievementType } from '../../types';

export const achievementTypes: Record<AchievementType, string> = {
  completed_sessions: 'Phiên học hoàn thành',
  learned_words: 'Từ vựng đã học',
  streak: 'Ngày học liên tiếp',
};

export const achievementIcons = [
  { value: 'medal', label: 'Huy chương', icon: Medal },
  { value: 'flame', label: 'Ngọn lửa', icon: Flame },
  { value: 'book', label: 'Quyển sách', icon: BookOpen },
  { value: 'star', label: 'Ngôi sao', icon: Star },
];

export function AchievementIcon({ value }: { value: string }) {
  const Icon = achievementIcons.find((item) => item.value === value)?.icon || Medal;
  return (
    <span className="entity-image placeholder" aria-hidden="true">
      <Icon size={23} />
    </span>
  );
}
