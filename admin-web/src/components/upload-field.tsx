import { useState } from 'react';
import { Upload } from 'lucide-react';
import { api, mediaUrl } from '../services/api';
import { Notice } from './ui';

export function UploadField({
  label,
  kind,
  value,
  onChange,
  onBusy,
}: {
  label: string;
  kind: 'image' | 'audio';
  value: string;
  onChange: (value: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(file?: File) {
    if (!file) {
      return;
    }
    const max = kind === 'image' ? 2 : 5;
    if (file.size > max * 1024 * 1024) {
      setError('Tệp tối đa ' + max + ' MB.');
      return;
    }

    setBusy(true);
    onBusy(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const result = await api<{ url: string }>('/admin/upload/' + kind, { method: 'POST', body });
      onChange(result.url);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }

  return (
    <div className="upload-field">
      <label>
        {label}
        <input
          value={value}
          maxLength={500}
          placeholder="https://… hoặc tải tệp lên"
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <label className={'upload-button' + (busy ? ' disabled' : '')}>
        <Upload size={16} />
        {busy ? 'Đang tải lên…' : 'Chọn tệp'}
        <input
          type="file"
          aria-label={'Tải ' + label.toLowerCase()}
          accept={kind === 'image' ? 'image/png,image/jpeg' : 'audio/mpeg,.mp3'}
          disabled={busy}
          onChange={(event) => {
            void upload(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </label>
      <span className="hint">
        {kind === 'image' ? 'JPG, PNG · tối đa 2 MB' : 'MP3 · tối đa 5 MB'}
      </span>
      {error && <Notice>{error}</Notice>}
      {mediaUrl(value) &&
        (kind === 'image' ? (
          <img className="upload-preview" src={mediaUrl(value)} alt="Ảnh đã chọn" />
        ) : (
          <audio controls preload="none" src={mediaUrl(value)}>
            Trình duyệt không hỗ trợ nghe âm thanh.
          </audio>
        ))}
    </div>
  );
}
