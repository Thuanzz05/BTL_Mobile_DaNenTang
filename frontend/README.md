# Mobile frontend

Trang chủ lấy chủ đề và flashcard trực tiếp từ backend MySQL, không dùng số liệu giả. Các chủ đề chưa có từ hiển thị trạng thái trống. Chế độ học thử chỉ xem thẻ, không ghi tiến độ học tập.

## Chạy

1. Backend: cấu hình `backend/.env` theo README backend, chạy `npm run db:migrate` rồi `npm run dev`. Không chạy seed trên database có dữ liệu cần giữ.
2. Trong frontend: `npm install`.
3. Sao chép `.env.example` thành `.env.local`. Android emulator dùng `http://10.0.2.2:5000/api`; điện thoại thật dùng IP LAN của máy chạy backend; web/iOS simulator dùng `http://localhost:5000/api`.
4. Chạy `npm start`; điện thoại và máy tính cần cùng mạng. Khởi động lại Expo sau khi sửa biến môi trường.

Các dependency native được đồng bộ theo `expo/bundledNativeModules.json` của SDK 57. Kiểm tra: `npx tsc --noEmit`, `npm run lint`, `npx expo export --platform web`.

## Xác thực

- Đăng ký gửi `ho_ten`, `email`, `mat_khau` đến `/auth/register`; thành công chuyển sang đăng nhập vì backend không cấp token khi đăng ký.
- Đăng nhập dùng `/auth/login`, nhận hồ sơ và cặp JWT. Access token giữ trong bộ nhớ; refresh token lưu bằng Expo SecureStore trên mobile. Web preview dùng sessionStorage, chỉ giữ trong tab hiện tại.
- Mở lại app: refresh token rồi gọi `/auth/me`. Request được bảo vệ tự làm mới access token một lần khi nhận 401. Mất mạng không xóa refresh token đã lưu; có nút thử khôi phục tại Tài khoản.
- Đăng xuất gọi `/auth/logout` và xóa phiên trên thiết bị. Nếu máy chủ không phản hồi, giao diện thông báo việc thu hồi từ xa chưa được xác nhận.
- Trang chủ khi đăng nhập gọi `/home/dashboard`; kéo xuống để cập nhật. Flashcard hiện là **học thử**, chưa ghi kết quả vào phiên học/SRS.
- Chưa tích hợp Google OAuth hay quên mật khẩu; giao diện không hiển thị nút giả cho các luồng này.

Kiểm thử logic phiên đăng nhập: `npm test`. Kiểm tra mobile cuối cùng bằng Expo Go SDK 57 hoặc development build trên Android/iOS; web preview không thay thế kiểm thử thiết bị thật.

Đã kiểm tra trên backend/MySQL local: đăng ký tài khoản tạm, đăng nhập sai/đúng mật khẩu, tải dashboard, khôi phục phiên sau reload, đăng xuất; tài khoản tạm được xóa sau kiểm thử. Playwright/Chrome kiểm tra lật thẻ, đổi chủ đề, tìm kiếm và chiều rộng 320px. TypeScript, ESLint, 8 kiểm thử phiên đăng nhập và build web đều thành công. Chưa chạy trên thiết bị Android/iOS thật.
