import { useState } from 'react';
import type { FormEvent } from 'react';
import { api, jsonBody } from '../../services/api';
import type { Achievement, AchievementType } from '../../types';
import { Modal, Notice } from '../ui';
import { AchievementIcon, achievementIcons, achievementTypes } from './achievement-icon';

export function AchievementForm({
  achievement,
  onClose,
  onSaved,
}: {
  achievement: Achievement | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(achievement?.tieu_de || '');
  const [description, setDescription] = useState(achievement?.mo_ta || '');
  const [icon, setIcon] = useState(achievement?.bieu_tuong || 'medal');
  const [points, setPoints] = useState(achievement?.diem_thuong ?? 10);
  const [type, setType] = useState<AchievementType | ''>(
    achievement ? achievement.loai || '' : 'completed_sessions'
  );
  const [target, setTarget] = useState(achievement?.moc ?? 1);
  const [status, setStatus] = useState(achievement?.trang_thai || 'active');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const locked = Number(achievement?.so_nguoi_dat || 0) > 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api(
        '/admin/achievements' + (achievement ? '/' + achievement.id : ''),
        jsonBody(achievement ? 'PUT' : 'POST', {
          tieu_de: title.trim(),
          mo_ta: description.trim(),
          bieu_tuong: icon,
          trang_thai: status,
          ...(!locked ? { loai: type, moc: target, diem_thuong: points } : {}),
        })
      );
      onSaved();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={achievement ? 'Chỉnh sửa thành tích' : 'Thêm thành tích'}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        <label>
          Tên thành tích <span className="required">*</span>
          <input
            required
            maxLength={150}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ví dụ: Bước khởi đầu"
          />
        </label>
        <label>
          Mô tả <span className="required">*</span>
          <textarea
            required
            rows={3}
            maxLength={5000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ví dụ: Hoàn thành phiên học đầu tiên."
          />
        </label>
        <div className="form-grid">
          <label>
            Biểu tượng
            <select value={icon} onChange={(event) => setIcon(event.target.value)}>
              {!achievementIcons.some((item) => item.value === icon) && (
                <option value={icon}>{icon}</option>
              )}
              {achievementIcons.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="achievement-preview">
            <AchievementIcon value={icon} />
            <span className="muted">Xem trước huy hiệu</span>
          </div>
        </div>
        {locked && (
          <p className="notice">
            Đã có người nhận. Điều kiện và điểm thưởng được giữ nguyên để bảo toàn kết quả học tập.
          </p>
        )}
        <fieldset className="achievement-rules" disabled={locked || busy}>
          <legend>Điều kiện nhận huy hiệu</legend>
          <label>
            Loại điều kiện
            <select
              required
              value={type}
              onChange={(event) => setType(event.target.value as AchievementType)}
            >
              <option value="" disabled>
                Chọn điều kiện
              </option>
              {Object.entries(achievementTypes).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              Mốc cần đạt
              <input
                required
                type="number"
                min={1}
                max={1000000}
                step={1}
                value={target}
                onChange={(event) => setTarget(Number(event.target.value))}
              />
            </label>
            <label>
              Điểm thưởng
              <input
                required
                type="number"
                min={0}
                max={1000000}
                step={1}
                value={points}
                onChange={(event) => setPoints(Number(event.target.value))}
              />
            </label>
          </div>
        </fieldset>
        <label>
          Trạng thái cấp thành tích
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as Achievement['trang_thai'])}
          >
            <option value="active">Đang cấp</option>
            <option value="inactive">Tạm ngừng cấp</option>
          </select>
        </label>
        <p className="muted">Tạm ngừng chỉ dừng cấp mới. Người đã nhận vẫn giữ huy hiệu và điểm.</p>
        {error && <Notice>{error}</Notice>}
        <div className="form-actions">
          <button type="button" className="button secondary" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button className="button" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu thành tích'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
