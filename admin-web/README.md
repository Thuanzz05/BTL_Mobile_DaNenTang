# Wordleaf Admin

Ứng dụng React + TypeScript riêng, dùng chung Express/MySQL với mobile. Thư mục `frontend/` tiếp tục thuộc phần giao diện người học.

## Chạy trên máy

Yêu cầu Node.js 24 trở lên, MySQL 8 và backend đã được cấu hình.

1. Trong `backend/`: cài thư viện bằng `npm ci`, cấu hình `.env`, chạy `npm run db:migrate`, rồi `npm run dev`.
2. Chỉ khi database mới hoàn toàn trống: chạy `npm run db:seed` để tạo tài khoản và nội dung mẫu.
3. Trong `admin-web/`: chạy `npm ci`, rồi `npm run dev`.
4. Mở **http://localhost:5173**.

Tài khoản quản trị mẫu sau khi seed: **admin@hoctuvung.vn / admin123**. Đây là dữ liệu demo. Công cụ seed từ chối nạp vào database đã có dữ liệu.

Cấu hình mặc định dùng `/api`; Vite chuyển tiếp `/api` và `/uploads` đến backend ở cổng 5000. Nếu backend dùng cổng khác, sửa `vite.config.ts`. Backend cần cho phép origin `http://localhost:5173` và `http://127.0.0.1:5173` trong `CORS_ORIGIN`.

## Các trang đã có

- `/login`: đăng nhập dành cho admin, ẩn/hiện mật khẩu, báo lỗi.
- `/dashboard`: số người học, chủ đề, từ vựng, phiên học; biểu đồ đủ bảy ngày theo giờ Việt Nam.
- `/topics`: thêm, sửa, xóa, tìm tên, lọc trạng thái, ẩn/hiện, thứ tự, upload ảnh.
- `/words`: tìm tiếng Anh/nghĩa tiếng Việt, lọc chủ đề, phân trang, xóa.
- `/words/new`, `/words/:id/edit`: từ loại, phiên âm, nghĩa, ví dụ, ảnh JPG/PNG và phát âm MP3.
- `/users`: tìm tên/email, lọc trạng thái, phân trang, xem hồ sơ cơ bản, khóa/mở khóa.
- `/statistics`: nội dung được học nhiều và thống kê đúng/sai từ các câu server đã chấm; lọc ngày và ngưỡng số lượt.
- `/account`: sửa tên, đổi mật khẩu, đăng xuất.

Người dùng tự đăng ký qua ứng dụng học. Web quản trị không cấp quyền admin hoặc xóa tài khoản người học. Khóa tài khoản giữ lại lịch sử và thu hồi các phiên đăng nhập cũ.

Chủ đề còn từ hoặc lịch sử không được xóa. Từ đã nằm trong phiên học hoặc tiến độ cũng được giữ lại. Giao diện hiển thị lý do do backend trả về; có thể ẩn chủ đề khi muốn ngừng hiển thị nội dung.

## Cấu trúc code

- `src/pages/`: mỗi màn hình một file.
- `src/components/`: form upload, hộp thoại, trạng thái tải/lỗi, phân trang và biểu đồ.
- `src/layouts/`: sidebar và khung trang.
- `src/services/`: HTTP client và quản lý phiên đăng nhập.
- `src/hooks/`: tải dữ liệu, bỏ qua phản hồi cũ khi thay bộ lọc.
- `src/types/`: kiểu dữ liệu API.
- `src/styles/`: giao diện và bố cục màn hình nhỏ.

Code dùng dấu chấm phẩy, nháy đơn, thụt hai dấu cách, xuống dòng theo `.prettierrc`.

## Phiên đăng nhập web

- Access token chỉ lưu trong bộ nhớ.
- Refresh token nằm trong cookie HttpOnly, SameSite Strict; bật Secure khi backend chạy với `NODE_ENV=production`.
- Các endpoint `/api/web-auth/*` yêu cầu header `X-Wordleaf-Client: admin-web`, kiểm tra Origin, trả `Cache-Control: no-store`.
- Tải lại trang gọi refresh; nhiều request hết hạn dùng chung một lần refresh.
- Thao tác không được phép không tự đăng xuất tài khoản hợp lệ.
- Nếu máy chủ không nhận được yêu cầu đăng xuất, giao diện báo lỗi để thử lại; không báo thành công khi cookie chưa được thu hồi.
- Đổi mật khẩu thu hồi toàn bộ phiên đăng nhập và đưa người dùng về trang đăng nhập.

## Kiểm tra

```text
npm test
npm run format:check
npm run build
```

Bộ kiểm thử kiểm tra đăng nhập, refresh đồng thời, phân quyền, mất mạng và các phản hồi đến muộn. Các thao tác API/SQL, upload, lịch sử và phân quyền được kiểm thử thực tế bằng bộ test trong `backend/`.

## Triển khai

`npm run build` sinh thư mục `dist/`. Web server cần:
- phục vụ file tĩnh và trả `index.html` cho các đường dẫn giao diện như `/words/new`;
- chuyển tiếp `/api` và `/uploads` đến backend cùng origin;
- dùng HTTPS và backend `NODE_ENV=production`;
- cấu hình chính xác `CORS_ORIGIN` theo địa chỉ web.

Proxy của Vite chỉ dùng khi phát triển; bản build không tự có proxy đó. Cookie SameSite Strict yêu cầu web và API cùng site; triển khai cùng origin là cấu hình được hỗ trợ mặc định.

Giao diện hiện dùng font Google Fonts và có font hệ thống dự phòng. Thống kê đúng/sai sẽ trống cho đến khi mobile nối luồng `/api/quiz` mới; không suy ra số lượt đúng từ trạng thái nhớ từ cũ.
