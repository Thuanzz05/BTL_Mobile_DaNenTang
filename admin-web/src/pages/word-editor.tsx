import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { api, jsonBody } from '../services/api';
import type { Example, Topic, Word } from '../types';
import { useQuery } from '../hooks/use-query';
import { Empty, Notice, PageHeader, QueryState } from '../components/ui';
import { UploadField } from '../components/upload-field';
import { wordTypes } from './words';

function WordForm({
  word,
  topics,
  topicId,
}: {
  word: Word | null;
  topics: Topic[];
  topicId: string;
}) {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    chu_de_id: word?.chu_de_id || topicId || topics[0]?.id || '',
    tu_tieng_anh: word?.tu_tieng_anh || '',
    nghia_tieng_viet: word?.nghia_tieng_viet || '',
    phien_am: word?.phien_am || '',
    loai_tu: word?.loai_tu || 'danh-tu',
    trang_thai: word?.trang_thai || 'active',
    thu_tu_hien_thi: word?.thu_tu_hien_thi || 0,
    url_hinh_anh: word?.url_hinh_anh || '',
    url_am_thanh: word?.url_am_thanh || '',
  });
  const [examples, setExamples] = useState<Example[]>(word?.vi_du || []);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [error, setError] = useState('');
  const update = (key: keyof typeof values, value: string | number) =>
    setValues((current) => ({ ...current, [key]: value }));
  const uploadBusy = (value: boolean) => setUploads((count) => count + (value ? 1 : -1));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || uploads) {
      return;
    }
    setBusy(true);
    setError('');

    try {
      await api(
        '/admin/words' + (word ? '/' + word.id : ''),
        jsonBody(word ? 'PUT' : 'POST', {
          ...values,
          tu_tieng_anh: values.tu_tieng_anh.trim(),
          nghia_tieng_viet: values.nghia_tieng_viet.trim(),
          phien_am: values.phien_am.trim() || null,
          url_hinh_anh: values.url_hinh_anh.trim() || null,
          url_am_thanh: values.url_am_thanh.trim() || null,
          vi_du: examples.map((example, index) => ({
            cau_tieng_anh: example.cau_tieng_anh.trim(),
            cau_tieng_viet: example.cau_tieng_viet.trim(),
            thu_tu_hien_thi: index,
          })),
        })
      );
      navigate('/words?topicId=' + values.chu_de_id);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function updateExample(index: number, key: keyof Example, value: string) {
    setExamples((current) =>
      current.map((example, position) =>
        position === index ? { ...example, [key]: value } : example
      )
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="editor-grid">
        <div className="editor-primary">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">01 · NỘI DUNG</p>
                <h2>Thông tin từ vựng</h2>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Từ tiếng Anh <span className="required">*</span>
                <input
                  required
                  maxLength={120}
                  value={values.tu_tieng_anh}
                  onChange={(event) => update('tu_tieng_anh', event.target.value)}
                  placeholder="Ví dụ: journey"
                />
              </label>
              <label>
                Phiên âm
                <input
                  maxLength={120}
                  value={values.phien_am}
                  onChange={(event) => update('phien_am', event.target.value)}
                  placeholder="/ˈdʒɜːni/"
                />
              </label>
            </div>
            <label>
              Nghĩa tiếng Việt <span className="required">*</span>
              <input
                required
                maxLength={255}
                value={values.nghia_tieng_viet}
                onChange={(event) => update('nghia_tieng_viet', event.target.value)}
                placeholder="Ví dụ: hành trình"
              />
            </label>
            <div className="form-grid">
              <label>
                Chủ đề <span className="required">*</span>
                <select
                  required
                  value={values.chu_de_id}
                  onChange={(event) => update('chu_de_id', event.target.value)}
                >
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.ten}
                      {topic.trang_thai === 'inactive' ? ' (đã ẩn)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Từ loại
                <select
                  value={values.loai_tu}
                  onChange={(event) => update('loai_tu', event.target.value)}
                >
                  {Object.entries(wordTypes).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Trạng thái từ
              <select
                value={values.trang_thai}
                onChange={(event) => update('trang_thai', event.target.value)}
              >
                <option value="active">Bật hiển thị</option>
                <option value="inactive">Ẩn</option>
              </select>
            </label>
            <p className="hint">
              Từ chỉ dùng cho lượt học mới khi cả từ và chủ đề đều bật hiển thị. Ẩn từ giữ nguyên
              lịch sử, tiến độ và các phiên đã bắt đầu.
            </p>
            <label>
              Thứ tự hiển thị
              <input
                required
                type="number"
                min={0}
                step={1}
                value={values.thu_tu_hien_thi}
                onChange={(event) => update('thu_tu_hien_thi', Number(event.target.value))}
              />
            </label>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">02 · NGỮ CẢNH</p>
                <h2>Câu ví dụ</h2>
              </div>
              <span className="chip">{examples.length} / 20</span>
            </div>
            {!examples.length && (
              <p className="muted">Một ví dụ gần gũi giúp người học nhớ từ dễ hơn.</p>
            )}
            {examples.map((example, index) => (
              <div className="example-editor" key={index}>
                <div className="example-heading">
                  <strong>Ví dụ {index + 1}</strong>
                  <button
                    type="button"
                    className="icon-button delete"
                    aria-label={'Xóa ví dụ ' + (index + 1)}
                    onClick={() =>
                      setExamples((current) => current.filter((_, position) => position !== index))
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <label>
                  Câu tiếng Anh
                  <textarea
                    rows={2}
                    required
                    maxLength={5000}
                    value={example.cau_tieng_anh}
                    onChange={(event) => updateExample(index, 'cau_tieng_anh', event.target.value)}
                  />
                </label>
                <label>
                  Dịch tiếng Việt
                  <textarea
                    rows={2}
                    required
                    maxLength={5000}
                    value={example.cau_tieng_viet}
                    onChange={(event) => updateExample(index, 'cau_tieng_viet', event.target.value)}
                  />
                </label>
              </div>
            ))}
            <button
              type="button"
              className="button secondary"
              disabled={examples.length >= 20}
              onClick={() =>
                setExamples((current) => [...current, { cau_tieng_anh: '', cau_tieng_viet: '' }])
              }
            >
              <Plus size={17} />
              Thêm ví dụ
            </button>
          </section>
        </div>
        <aside className="panel editor-media">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">03 · HỌC LIỆU</p>
              <h2>Ảnh & âm thanh</h2>
            </div>
          </div>
          <UploadField
            label="Ảnh minh họa"
            kind="image"
            value={values.url_hinh_anh}
            onChange={(value) => update('url_hinh_anh', value)}
            onBusy={uploadBusy}
          />
          <hr />
          <UploadField
            label="Âm thanh phát âm"
            kind="audio"
            value={values.url_am_thanh}
            onChange={(value) => update('url_am_thanh', value)}
            onBusy={uploadBusy}
          />
          <p className="hint">Để trống nếu chưa có học liệu. Bạn có thể bổ sung sau.</p>
        </aside>
      </div>
      {error && <Notice>{error}</Notice>}
      <div className="editor-footer">
        <span className="hint">Các trường có dấu * là bắt buộc.</span>
        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            disabled={busy || uploads > 0}
            onClick={() => navigate('/words')}
          >
            Hủy
          </button>
          <button className="button" disabled={busy || uploads > 0}>
            <Save size={17} />
            {busy ? 'Đang lưu…' : 'Lưu từ vựng'}
          </button>
        </div>
      </div>
    </form>
  );
}

export function WordEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const query = useQuery('word-editor-' + id, async () => {
    const [topics, word] = await Promise.all([
      api<Topic[]>('/admin/topics'),
      id ? api<Word>('/words/' + id) : Promise.resolve(null),
    ]);
    return { topics, word };
  });

  return (
    <>
      <Link className="back-link" to="/words">
        <ArrowLeft size={16} />
        Thư viện từ vựng
      </Link>
      <PageHeader
        eyebrow="BIÊN TẬP NỘI DUNG"
        title={id ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng'}
        description="Một từ mới, thêm một điều để khám phá."
      />
      <QueryState {...query} retry={query.reload} />
      {query.data &&
        (query.data.topics.length ? (
          <WordForm
            key={id || 'new'}
            word={query.data.word}
            topics={query.data.topics}
            topicId={params.get('topicId') || ''}
          />
        ) : (
          <section className="panel">
            <Empty title="Tạo chủ đề trước khi thêm từ">
              <Link className="text-link" to="/topics">
                Đi đến quản lý chủ đề
              </Link>
            </Empty>
          </section>
        ))}
    </>
  );
}
