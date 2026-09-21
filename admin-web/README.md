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
- `/words`: tìm tiếng Anh/nghĩa tiếng Việt, lọc chủ đề/trạng thái từ, phân trang, ẩn/hiện và xóa.
- `/words/new`, `/words/:id/edit`: từ loại, phiên âm, nghĩa, ví dụ, ảnh JPG/PNG và phát âm MP3.
- `/users`: tìm tên/email, lọc trạng thái, phân trang, xem hồ sơ cơ bản, khóa/mở khóa.
- `/achievements`: thêm/sửa huy hiệu, tìm tên, lọc loại điều kiện/trạng thái, phân trang, bật/tắt cấp mới và xóa khi chưa có người nhận.
- `/achievements/:id/recipients`: tổng số người đã đạt, tìm tên/email, ngày nhận theo giờ Việt Nam và phân trang.
- `/statistics`: nội dung được học nhiều và thống kê đúng/sai từ các câu server đã chấm; lọc ngày và ngưỡng số lượt.
- `/account`: sửa tên, đổi mật khẩu, đăng xuất.

Người dùng tự đăng ký qua ứng dụng học. Web quản trị không cấp quyền admin hoặc xóa tài khoản người học. Khóa tài khoản giữ lại lịch sử và thu hồi các phiên đăng nhập cũ.

Chủ đề còn từ hoặc lịch sử không được xóa. Từ đã nằm trong phiên học hoặc tiến độ cũng được giữ lại. Giao diện hiển thị lý do do backend trả về; có thể ẩn chủ đề khi muốn ngừng hiển thị nội dung.

## Ẩn/hiện từng từ vựng

- Trong trang **Từ vựng**, dùng nút hình con mắt ở cột thao tác, rồi xác nhận **Ẩn từ** hoặc **Hiện từ**. Có thể chọn trạng thái ngay trong form thêm/sửa.
- Bộ lọc **Bật hiển thị / Đã ẩn** xét trạng thái riêng của từ. Từ chỉ xuất hiện cho người học khi cả từ và chủ đề đều bật hiển thị; chủ đề ẩn được ghi chú trong bảng.
- Từ ẩn không xuất hiện trong thư viện, yêu thích, lượt học/ôn mới hoặc các đáp án nhiễu mới. Ẩn không xóa ví dụ, yêu thích, tiến độ hay lịch sử; hiện lại khôi phục khả năng sử dụng dữ liệu đó.
- Phiên đã bắt đầu vẫn tiếp tục theo danh sách cũ. Các số liệu lịch sử giữ nguyên; số từ có thể học và số từ đến hạn ôn chỉ tính nội dung đang hiển thị.
- Chạy `npm run db:migrate` trong `backend/` sau khi pull. Migration `003-word-visibility.js` giữ các từ cũ ở trạng thái hiển thị; chạy lại không đặt lại trạng thái đã chọn.

## Quản lý thành tích

- Sau khi pull, chạy `npm run db:migrate` trong `backend/`. Migration `008-achievement-admin.js` bổ sung trạng thái cấp thành tích và giữ nguyên huy hiệu/lịch sử cũ.
- Trong menu **Thành tích**, tạo huy hiệu với tên, mô tả, một trong bốn biểu tượng, điểm thưởng và mốc cần đạt. Ba loại điều kiện là số phiên hoàn thành, số từ đã học và chuỗi ngày học hiện tại.
- Việc xét và cấp huy hiệu diễn ra khi người học mở/tải lại trang thành tích, theo cơ chế hiện có của mobile.
- **Tạm ngừng cấp** ẩn huy hiệu chưa đạt và không cấp cho người mới. Người đã nhận vẫn thấy huy hiệu, điểm và ngày nhận. Bật lại cho phép người đủ điều kiện tiếp tục nhận.
- Khi đã có người nhận, chỉ sửa tên, mô tả, biểu tượng và trạng thái. Điều kiện/mốc/điểm bị khóa để bảo toàn kết quả đã trao; tạo huy hiệu mới nếu muốn thay đổi các thông số đó.
- Chỉ xóa huy hiệu chưa có người nhận. Backend kiểm tra lại trong giao dịch, kể cả khi có người nhận ngay sau khi admin mở danh sách.
- Nhấn số người đã đạt để xem danh sách và ngày nhận. Tổng người nhận của huy hiệu luôn được giữ riêng với số kết quả tìm kiếm.

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
