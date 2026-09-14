import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Headphones, Image, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import type { Page, Topic, Word } from '../types';
import { useQuery } from '../hooks/use-query';
import { Confirm, Empty, Notice, PageHeader, Pagination, QueryState } from '../components/ui';

export const wordTypes: Record<string, string> = {
  'danh-tu': 'Danh từ',
  'dong-tu': 'Động từ',
  'tinh-tu': 'Tính từ',
  'trang-tu': 'Trạng từ',
  'gioi-tu': 'Giới từ',
  'lien-tu': 'Liên từ',
  'dai-tu': 'Đại từ',
  'tham-tu': 'Thán từ',
};

export function WordsPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const topicId = params.get('topicId') || '';
  const page = Math.max(1, Math.min(1000000, Number(params.get('page')) || 1));
  const [draft, setDraft] = useState(search);
  const topics = useQuery('word-topics', () => api<Topic[]>('/admin/topics'));
  const queryString = new URLSearchParams({ search, topicId, page: String(page), limit: '15' });
  if (!topicId) {
    queryString.delete('topicId');
  }
  const query = useQuery(queryString.toString(), () =>
    api<Page<Word>>('/admin/words?' + queryString)
  );
  const [removing, setRemoving] = useState<Word | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function change(values: Record<string, string>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }
    setParams(next);
  }

  function searchWords(event: FormEvent) {
    event.preventDefault();
    change({ search: draft.trim(), page: '1' });
  }

  async function remove() {
    if (!removing || busy) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/admin/words/' + removing.id, { method: 'DELETE' });
      setNotice('Đã xóa từ vựng.');
      setRemoving(null);
      if (query.data?.items.length === 1 && page > 1) {
        change({ page: String(page - 1) });
      } else {
        query.reload();
      }
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="CHĂM CHÚT TỪNG TỪ"
        title="Từ vựng"
        description="Quản lý từ, nghĩa, ví dụ và học liệu trong một nơi."
        action={
          <Link className="button" to={'/words/new' + (topicId ? '?topicId=' + topicId : '')}>
            <Plus size={18} />
            Thêm từ vựng
          </Link>
        }
      />
      {notice && <Notice success>{notice}</Notice>}
      <section className="panel table-panel">
        <div className="toolbar">
          <form className="search-form" onSubmit={searchWords}>
            <label className="search-field">
              <Search size={18} />
              <input
                aria-label="Tìm từ vựng"
                maxLength={150}
                placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt…"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </label>
            <button className="button secondary">Tìm kiếm</button>
          </form>
          <select
            aria-label="Lọc chủ đề"
            value={topicId}
            onChange={(event) => change({ topicId: event.target.value, page: '1' })}
          >
            <option value="">Tất cả chủ đề</option>
            {topics.data?.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.ten}
                {topic.trang_thai === 'inactive' ? ' (đã ẩn)' : ''}
              </option>
            ))}
          </select>
        </div>
        {topics.error && (
          <Notice>
            {topics.error}
            <button className="text-button" onClick={topics.reload}>
              Tải lại chủ đề
            </button>
          </Notice>
        )}
        <QueryState {...query} retry={query.reload} />
        {query.data && (
          <>
            {query.data.items.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Từ tiếng Anh</th>
                      <th>Nghĩa tiếng Việt</th>
                      <th>Chủ đề</th>
                      <th>Học liệu</th>
                      <th className="align-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.items.map((word) => (
                      <tr key={word.id}>
                        <td>
                          <Link className="word-link" to={'/words/' + word.id + '/edit'}>
                            {word.tu_tieng_anh}
                          </Link>
                          <p className="cell-description">
                            {word.phien_am || 'Chưa có phiên âm'}{' '}
                            <span className="word-type">{wordTypes[word.loai_tu]}</span>
                          </p>
                        </td>
                        <td>{word.nghia_tieng_viet}</td>
                        <td>
                          <span className="topic-tag">
                            {topics.data?.find((topic) => topic.id === word.chu_de_id)?.ten || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="media-indicators">
                            <Image
                              size={17}
                              aria-label={word.url_hinh_anh ? 'Có ảnh' : 'Chưa có ảnh'}
                              className={word.url_hinh_anh ? 'available' : ''}
                            />
                            <Headphones
                              size={17}
                              aria-label={word.url_am_thanh ? 'Có âm thanh' : 'Chưa có âm thanh'}
                              className={word.url_am_thanh ? 'available' : ''}
                            />
                          </div>
                        </td>
                        <td>
                          <div className="row-actions">
                            <Link
                              className="icon-button"
                              aria-label={'Sửa ' + word.tu_tieng_anh}
                              to={'/words/' + word.id + '/edit'}
                            >
                              <Pencil size={17} />
                            </Link>
                            <button
                              className="icon-button delete"
                              aria-label={'Xóa ' + word.tu_tieng_anh}
                              onClick={() => {
                                setError('');
                                setRemoving(word);
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
              <Empty title="Không tìm thấy từ vựng" />
            )}
            <Pagination
              page={page}
              pages={query.data.pagination.totalPages}
              total={query.data.pagination.total}
              onChange={(value) => change({ page: String(value) })}
            />
          </>
        )}
      </section>
      {removing && (
        <Confirm
          title={'Xóa từ “' + removing.tu_tieng_anh + '”?'}
          description="Từ và các ví dụ sẽ được xóa. Backend sẽ giữ lại từ đang được sử dụng trong phiên học hoặc tiến độ của người học."
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
