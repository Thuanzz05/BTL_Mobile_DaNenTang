# Mobile frontend

Trang chủ lấy chủ đề và flashcard trực tiếp từ backend MySQL, không dùng số liệu giả. Các chủ đề chưa có từ hiển thị trạng thái trống. Chế độ học thử chỉ xem thẻ, không ghi tiến độ học tập.

## Chạy

1. Backend: cấu hình `backend/.env` theo README backend, chạy `npm run db:migrate` rồi `npm run dev`. Không chạy seed trên database có dữ liệu cần giữ.
2. Trong frontend: `npm install`.
3. Sao chép `.env.example` thành `.env.local`. Android emulator dùng `http://10.0.2.2:5000/api`; điện thoại thật dùng IP LAN của máy chạy backend; web/iOS simulator dùng `http://localhost:5000/api`.
4. Chạy `npm start`; điện thoại và máy tính cần cùng mạng. Khởi động lại Expo sau khi sửa biến môi trường.

Các dependency native được đồng bộ theo `expo/bundledNativeModules.json` của SDK 57. Kiểm tra: `npx tsc --noEmit`, `npm run lint`, `npx expo export --platform web`.
