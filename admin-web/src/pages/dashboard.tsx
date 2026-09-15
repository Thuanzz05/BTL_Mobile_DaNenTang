import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  FolderOpen,
  Plus,
  Sparkles,
  Users,
  GraduationCap,
} from 'lucide-react';
import { api } from '../services/api';
import type { Dashboard } from '../types';
import { useQuery } from '../hooks/use-query';
import { PageHeader, QueryState } from '../components/ui';
import { ActivityChart } from '../components/activity-chart';

export function DashboardPage() {
  const query = useQuery('dashboard', () => api<Dashboard>('/admin/dashboard'));
  const data = query.data;

  return (
    <>
      <PageHeader
        eyebrow="NHÌN LẠI HÀNH TRÌNH"
        title="Tổng quan"
        description="Một góc nhìn rõ ràng về nội dung và hoạt động học tập."
        action={
          <Link className="button" to="/words/new">
            <Plus size={18} />
            Thêm từ vựng
          </Link>
        }
      />
      <QueryState {...query} retry={query.reload} />
      {data && (
        <>
          <section className="stats-grid" aria-label="Số liệu tổng quan">
            {[
              {
                title: 'Người học',
                value: data.tong_nguoi_dung,
                icon: Users,
                detail: 'Tài khoản người dùng',
                color: 'mint',
              },
              {
                title: 'Chủ đề',
                value: data.tong_chu_de,
                icon: FolderOpen,
                detail: 'Trong thư viện nội dung',
                color: 'sand',
              },
              {
                title: 'Từ vựng',
                value: data.tong_tu_vung,
                icon: BookOpen,
                detail: 'Sẵn sàng cho việc học',
                color: 'blue',
              },
              {
                title: 'Phiên học',
                value: data.tong_luot_hoc,
                icon: GraduationCap,
                detail: data.phien_dang_hoc + ' phiên đang học',
                color: 'pink',
              },
            ].map(({ title, value, icon: Icon, detail, color }) => (
              <article className="stat-card" key={title}>
                <div className="stat-top">
                  <span>{title}</span>
                  <span className={'stat-icon ' + color}>
                    <Icon size={20} />
                  </span>
                </div>
                <strong>{Number(value).toLocaleString('vi-VN')}</strong>
                <p>{detail}</p>
              </article>
            ))}
          </section>
          <section className="dashboard-charts">
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">NHỊP HỌC MỖI NGÀY</p>
                  <h2>Hoạt động học tập</h2>
                </div>
                <span className="chip">7 ngày gần nhất</span>
              </div>
              <ActivityChart rows={data.luot_hoc_7_ngay} label="Phiên học" />
              <div className="chart-legend">
                <i /> Phiên học được bắt đầu
              </div>
            </article>
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">CỘNG ĐỒNG WORDLEAF</p>
                  <h2>Người học mới</h2>
                </div>
                <Users size={20} />
              </div>
              <ActivityChart rows={data.nguoi_dung_moi_7_ngay} label="Người học mới" />
              <div className="chart-legend">
                <i /> Tài khoản được tạo
              </div>
            </article>
          </section>
          <section className="quick-banner">
            <div className="banner-icon">
              <Sparkles size={28} />
            </div>
            <div>
              <p className="eyebrow">BẮT ĐẦU TỪ MỘT ĐIỀU NHỎ</p>
              <h2>Thêm nội dung, mở thêm cơ hội học.</h2>
              <p>Xây dựng chủ đề mới hoặc hoàn thiện những từ vựng trong thư viện.</p>
            </div>
            <Link to="/topics" className="button secondary">
              Quản lý chủ đề
              <ArrowUpRight size={18} />
            </Link>
          </section>
        </>
      )}
    </>
  );
}
