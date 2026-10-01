# Wordleaf — học từ vựng tiếng Anh

Dự án gồm `backend` (Express/TypeScript/MySQL), `frontend` (Expo/React Native) và `admin-web` (React/Vite). Mỗi phần có thư viện và lệnh chạy riêng.

## Sau khi pull

Chạy các lệnh sau **từ thư mục gốc của repo**:

```powershell
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix admin-web ci
npm --prefix backend run db:migrate
```

Backend cần cấu hình `backend/.env` và MySQL đang chạy. Migration giữ dữ liệu hiện có; không chạy lại file SQL tạo bảng thủ công. Nếu migration báo dữ liệu trùng, kiểm tra các bản ghi liên quan trước khi chạy lại, không xóa database.

## Chạy dự án

Mỗi lệnh ở một terminal riêng, từ thư mục gốc:

```powershell
npm --prefix backend run dev
npm --prefix admin-web run dev
npm --prefix frontend start
```

- Backend: `http://localhost:5000`; tài liệu API: `http://localhost:5000/api-docs`.
- Admin: `http://localhost:5173`.
- Mobile: mở bằng Expo; nhấn `w` trong terminal Expo để xem trên web.
- Điện thoại thật: đặt `EXPO_PUBLIC_API_URL` trong `frontend/.env.local` thành `http://<IP-LAN-máy-tính>:5000/api`; hai máy cùng mạng. Khởi động lại Expo sau khi đổi cấu hình.
- Nếu báo cổng đang được sử dụng, dùng phiên server đã chạy hoặc dừng đúng terminal cũ bằng Ctrl+C trước khi mở lại.

Nếu đã đứng trong `backend`, dùng `npm run dev` trực tiếp, không thêm `--prefix backend` lần nữa.

## Tài liệu

- [Nghiệp vụ hiện tại](NGHIEP_VU_CHI_TIET.md)
- [Hợp đồng tích hợp mobile, backend và admin](docs/TICH_HOP_BACKEND_MOBILE.md)
- [Cấu hình email đặt lại mật khẩu](docs/CAU_HINH_EMAIL.md)
- [Backend](backend/README.md), [Mobile](frontend/README.md), [Admin](admin-web/README.md)

## Kiểm tra

```powershell
npm --prefix backend test
npm --prefix frontend test
npm --prefix frontend run typecheck
npm --prefix frontend run lint
npm --prefix admin-web test
npm --prefix admin-web run build
```

Backend test dùng database tạm có tên riêng, tự dọn sau kiểm thử. Tài khoản MySQL cho test cần quyền tạo/xóa database tạm; không trỏ test vào máy production. GitHub Actions trong `.github/workflows/checks.yml` thực hiện kiểm tra cho cả ba ứng dụng bằng MySQL riêng của CI.
