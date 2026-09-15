import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api, jsonBody, mediaUrl } from '../services/api';
import type { Topic } from '../types';
import { useQuery } from '../hooks/use-query';
import { Confirm, Empty, Modal, Notice, PageHeader, QueryState, Status } from '../components/ui';
import { UploadField } from '../components/upload-field';

function TopicForm({
  topic,
  onClose,
  onSaved,
}: {
  topic: Topic | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(topic?.ten || '');
  const [description, setDescription] = useState(topic?.mo_ta || '');
  const [image, setImage] = useState(topic?.hinh_anh || '');
  const [status, setStatus] = useState(topic?.trang_thai || 'active');
  const [order, setOrder] = useState(topic?.thu_tu_hien_thi || 0);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || uploading) {
      return;
    }
    setBusy(true);
    setError('');

    try {
      await api(
        '/admin/topics' + (topic ? '/' + topic.id : ''),
        jsonBody(topic ? 'PUT' : 'POST', {
          ten: name.trim(),
          mo_ta: description.trim() || null,
          hinh_anh: image.trim() || null,
          trang_thai: status,
          thu_tu_hien_thi: order,
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
      title={topic ? 'Chỉnh sửa chủ đề' : 'Thêm chủ đề mới'}
      onClose={onClose}
      busy={busy || uploading}
    >
      <form onSubmit={submit}>
        <label>
          Tên chủ đề <span className="required">*</span>
          <input
            required
            maxLength={255}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ví dụ: Cuộc sống hằng ngày"
          />
        </label>
        <label>
          Mô tả
          <textarea
            maxLength={5000}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Người học sẽ khám phá những gì trong chủ đề này?"
          />
        </label>
        <div className="form-grid">
          <label>
            Trạng thái
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as Topic['trang_thai'])}
            >
              <option value="active">Hiển thị</option>
              <option value="inactive">Ẩn</option>
            </select>
          </label>
          <label>
            Thứ tự hiển thị
            <input
              required
              type="number"
              min={0}
              step={1}
              value={order}
              onChange={(event) => setOrder(Number(event.target.value))}
            />
          </label>
        </div>
        <UploadField
          label="Ảnh chủ đề"
          kind="image"
          value={image}
          onChange={setImage}
          onBusy={setUploading}
        />
        {error && <Notice>{error}</Notice>}
        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            disabled={busy || uploading}
            onClick={onClose}
          >
            Hủy
          </button>
          <button className="button" disabled={busy || uploading}>
            {busy ? 'Đang lưu…' : 'Lưu chủ đề'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function TopicsPage() {
  const query = useQuery('topics', () => api<Topic[]>('/admin/topics'));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<Topic | null | undefined>();
  const [removing, setRemoving] = useState<Topic | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const topics = useMemo(
    () =>
      (query.data || []).filter(
        (topic) =>
          (!status || topic.trang_thai === status) &&
          topic.ten.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))
      ),
    [query.data, status, search]
  );

  async function remove() {
    if (!removing || busy) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/admin/topics/' + removing.id, { method: 'DELETE' });
      setRemoving(null);
      setNotice('Đã xóa chủ đề.');
      query.reload();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="THƯ VIỆN NỘI DUNG"
        title="Chủ đề"
        description="Sắp xếp kiến thức thành những nhóm nhỏ, dễ khám phá."
        action={
          <button className="button" onClick={() => setEditing(null)}>
            <Plus size={18} />
            Thêm chủ đề
          </button>
        }
      />
      {notice && <Notice success>{notice}</Notice>}
      <section className="panel table-panel">
        <div className="toolbar">
          <label className="search-field">
            <Search size={18} />
            <input
              aria-label="Tìm chủ đề"
              placeholder="Tìm tên chủ đề…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            aria-label="Lọc trạng thái chủ đề"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hiển thị</option>
            <option value="inactive">Đã ẩn</option>
          </select>
          <span className="result-count">{topics.length} chủ đề</span>
        </div>
        <QueryState {...query} retry={query.reload} />
        {query.data &&
          (topics.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Chủ đề</th>
                    <th>Nội dung</th>
                    <th>Trạng thái</th>
                    <th>Thứ tự</th>
                    <th className="align-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic) => (
                    <tr key={topic.id}>
                      <td>
                        <div className="entity-cell">
                          {mediaUrl(topic.hinh_anh) ? (
                            <img className="entity-image" src={mediaUrl(topic.hinh_anh)} alt="" />
                          ) : (
                            <span className="entity-image placeholder">
                              <FolderOpen size={23} />
                            </span>
                          )}
                          <div>
                            <strong>{topic.ten}</strong>
                            <p className="cell-description">{topic.mo_ta || 'Chưa có mô tả'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Link className="text-link" to={'/words?topicId=' + topic.id}>
                          {topic.word_count} từ vựng
                        </Link>
                        <span className="cell-note">{topic.active_word_count} từ bật hiển thị</span>
                        {Number(topic.active_word_count) < 5 && (
                          <span className="cell-note">Cần ít nhất 5 từ bật hiển thị để học</span>
                        )}
                      </td>
                      <td>
                        <Status value={topic.trang_thai} />
                      </td>
                      <td>{topic.thu_tu_hien_thi}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            aria-label={'Sửa ' + topic.ten}
                            onClick={() => setEditing(topic)}
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            className="icon-button delete"
                            aria-label={'Xóa ' + topic.ten}
                            onClick={() => {
                              setError('');
                              setRemoving(topic);
                            }}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Không tìm thấy chủ đề" />
          ))}
      </section>
      {editing !== undefined && (
        <TopicForm
          topic={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setNotice('Đã lưu chủ đề.');
            query.reload();
          }}
        />
      )}
      {removing && (
        <Confirm
          title={'Xóa “' + removing.ten + '”?'}
          description="Chỉ có thể xóa chủ đề chưa có từ vựng và chưa phát sinh lịch sử học. Bạn có thể ẩn chủ đề trong phần chỉnh sửa."
          busy={busy}
          error={error}
          onClose={() => setRemoving(null)}
          onConfirm={() => {
            void remove();
          }}
        />
      )}
    </>
  );
}
