import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Inbox, LoaderCircle, X } from 'lucide-react';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action && <div className="heading-action">{action}</div>}
    </header>
  );
}

export function Notice({ children, success = false }: { children: ReactNode; success?: boolean }) {
  return (
    <div className={success ? 'notice success' : 'notice'} role={success ? 'status' : 'alert'}>
      {children}
    </div>
  );
}

export function QueryState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  if (loading) {
    return (
      <div className="loading" role="status">
        <LoaderCircle className="spin" size={21} /> Đang tải dữ liệu…
      </div>
    );
  }
  if (error) {
    return (
      <Notice>
        {error}{' '}
        <button className="text-button" onClick={retry}>
          Thử lại
        </button>
      </Notice>
    );
  }
  return null;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Inbox size={32} strokeWidth={1.4} />
      <h3>{title}</h3>
      <p>{children || 'Thử thay đổi bộ lọc hoặc thêm nội dung mới.'}</p>
    </div>
  );
}

export function Status({ value, label }: { value: string; label?: string }) {
  const labels: Record<string, string> = {
    active: 'Đang hoạt động',
    inactive: 'Đã ẩn / tạm ngưng',
    locked: 'Đã khóa',
  };
  return (
    <span className={'badge ' + value}>
      <i />
      {label || labels[value] || value}
    </span>
  );
}

export function Pagination({
  page,
  pages,
  total,
  onChange,
}: {
  page: number;
  pages: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="pagination">
      <span>
        {total.toLocaleString('vi-VN')} kết quả · Trang {page} / {Math.max(1, pages)}
      </span>
      <div>
        <button
          className="icon-button"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ArrowLeft size={17} />
        </button>
        <button
          className="icon-button"
          aria-label="Trang sau"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) {
          onClose();
        }
      }}
    >
      <div className="modal-heading">
        <h2 id={id}>{title}</h2>
        <button
          className="icon-button"
          aria-label="Đóng hộp thoại"
          disabled={busy}
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function Confirm({
  title,
  description,
  action = 'Xóa',
  busy,
  error,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  action?: string;
  busy: boolean;
  error: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <p className="muted">{description}</p>
      {error && <Notice>{error}</Notice>}
      <div className="form-actions">
        <button className="button secondary" disabled={busy} onClick={onClose}>
          Hủy
        </button>
        <button className="button danger" disabled={busy} onClick={onConfirm}>
          {busy ? 'Đang xử lý…' : action}
        </button>
      </div>
    </Modal>
  );
}
