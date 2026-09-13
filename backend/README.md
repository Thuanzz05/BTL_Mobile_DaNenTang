# Backend ứng dụng học từ vựng qua Flashcard

Backend dùng Node.js 24+, Express, TypeScript và MySQL 8.0+.

## Cấu trúc

- `src/routes/`: khai báo đường dẫn, xác thực, validation và tài liệu Swagger.
- `src/controllers/`: nhận request, gọi service và trả response.
- `src/services/`: xử lý nghiệp vụ và giao dịch database.
- `src/middlewares/`: xác thực, phân quyền, kiểm tra đầu vào, upload và xử lý lỗi.
- `src/validations/`: schema kiểm tra body/query.
- `src/config/`: cấu hình database, upload và Swagger.
- `src/utils/`: response, lỗi nghiệp vụ, JWT, mật khẩu, SRS và lịch học.
- `migrations/`: nâng cấp cấu trúc dữ liệu có theo dõi phiên bản.
- `tests/`: kiểm thử API với MySQL riêng, bao gồm lỗi và yêu cầu đồng thời.

## Chạy backend

1. Cài dependency trong thư mục `backend`: `npm install`.
2. Tạo `.env` dựa trên `.env.example`. Điền cấu hình MySQL và hai khóa JWT ngẫu nhiên khác nhau, mỗi khóa ít nhất 32 ký tự.
3. Chạy `npm run db:migrate`. Lệnh tự tạo database nếu chưa tồn tại, bổ sung bảng/cột thiếu và giữ dữ liệu có sẵn.
4. Chỉ với database trống, có thể chạy `npm run db:seed` để nạp mẫu.
5. Chạy `npm run dev`, hoặc `npm run build` rồi `npm start`.

Trên máy hiện tại, `.env` đã được cấu hình và database đã được nâng cấp. File này bị Git bỏ qua, không đưa mật khẩu vào source control.

Dữ liệu mẫu: admin dùng email `admin@hoctuvung.vn` và mật khẩu `admin123`; người học dùng `thuan@example.com` và mật khẩu `user123`. Các tài khoản này chỉ dành cho phát triển và chạy demo.

Mặc định server ở `http://localhost:5000`; Swagger ở `http://localhost:5000/api-docs`.

- `GET /health`: kiểm tra tiến trình HTTP.
- `GET /ready`: kiểm tra kết nối MySQL; trả 503 khi database không sẵn sàng.
- Server không khởi động nếu thiếu khóa JWT hợp lệ hoặc không kết nối được MySQL.
- `CORS_ORIGIN` chứa danh sách origin web, phân cách bằng dấu phẩy. Điện thoại truy cập API qua địa chỉ LAN của máy chạy backend.

Không chạy lại nguyên file `database_schema.sql` trên database đang có bảng. File đó là cấu trúc gốc; `db:migrate` mới là cách tạo/nâng cấp đầy đủ và có thể chạy lại.

## API chính

Xác thực:

- `POST /api/auth/register`: `ho_ten`, `email`, `mat_khau`.
- `POST /api/auth/login`: `email`, `mat_khau`.
- `POST /api/auth/refresh`: `refreshToken`.
- `GET /api/auth/profile` hoặc `GET /api/auth/me`.
- `PUT /api/auth/profile`: `ho_ten` và/hoặc `anh_dai_dien`.
- `POST /api/auth/change-password`: `mat_khau_cu`, `mat_khau_moi`.
- `POST /api/auth/logout`: `refreshToken`, kèm access token.

Gửi access token trong header `Authorization: Bearer <accessToken>`. Dữ liệu cá nhân luôn lấy người dùng từ token, không lấy `userId` do client tự gửi. Khóa tài khoản hoặc đổi mật khẩu làm token cũ hết hiệu lực. Sau khi đổi mật khẩu, mobile cần chuyển về đăng nhập. Logout thu hồi refresh token được gửi; access token còn hiệu lực đến khi hết hạn.

Danh mục và yêu thích:

- `GET /api/topics`, `GET /api/topics/:id`.
- `GET /api/words?topicId=...`, `GET /api/words/:id`.
- Các API danh mục cho phép khách xem chủ đề đang hoạt động. Gửi token để nhận đúng trạng thái yêu thích.
- `GET /api/favorites`.
- `PUT /api/favorites/:wordId`: thêm yêu thích an toàn khi gửi lặp.
- `DELETE /api/favorites/:wordId`: bỏ yêu thích, gửi lặp vẫn thành công.
- `POST /api/favorites/:wordId`: giữ thao tác đảo trạng thái cũ; không tự gửi lại request này.

Học và ôn tập:

- `POST /api/learning/start`: `chu_de_id`, `tong_so_tu` là số nguyên 5–50.
- `POST /api/learning/result`: `phien_hoc_tap_id`, `tu_vung_id`, `trang_thai`.
- `POST /api/learning/complete`: `phien_hoc_tap_id`.
- `GET /api/learning/result/:sessionId`: gồm kết quả và danh sách từ đã lưu để tiếp tục phiên.
- `GET /api/learning/review?limit=50`.
- `POST /api/learning/review/start`: `tong_so_tu` là số nguyên 1–50; gửi `{}` để dùng mặc định.
- `GET /api/progress`, `GET /api/progress/topics`, `GET /api/progress/review`.
- `GET /api/history?page=1&limit=20`, `GET /api/history/:sessionId`.
- `GET /api/home/dashboard`.

Quản trị:

- `GET /api/admin/dashboard`, `GET /api/admin/statistics`.
- `GET /api/admin/users?search=&status=&page=1&limit=20`.
- `PUT /api/admin/users/:userId/status`: `trang_thai`.
- `GET/POST /api/admin/topics`, `PUT/DELETE /api/admin/topics/:id`.
- `GET/POST /api/admin/words`, `PUT/DELETE /api/admin/words/:id`.
- `PUT /api/admin/words/:id` nhận `vi_du` để thay toàn bộ ví dụ; bỏ trường này thì giữ nguyên, gửi `[]` để xóa ví dụ.
- `POST /api/admin/upload/image`: JPG/PNG, tối đa 2 MB.
- `POST /api/admin/upload/audio`: MP3, tối đa 5 MB.
- Upload dùng multipart với trường `file`, trả đường dẫn tại `data.url`.

## Quy tắc dữ liệu

- Danh sách từ của phiên được lưu cố định trong `phien_hoc_tu`; chỉ nhận đánh giá cho các từ thuộc danh sách này.
- Mỗi cặp phiên–từ chỉ có một kết quả. Gửi lại cùng đánh giá trả thành công mà không tăng lần ôn. Gửi đánh giá khác cho từ đã nộp trả 409; muốn đánh giá lại, tạo phiên ôn mới.
- Kết quả và tiến độ được cập nhật trong một giao dịch. Khi một bước thất bại, toàn bộ thay đổi của lần nộp bị hoàn tác.
- Hoàn thành yêu cầu đủ kết quả, chỉ ghi một hoạt động kể cả khi client gửi lại.
- Từ đã nhớ vẫn xuất hiện trong danh sách ôn khi đến hạn. Lịch SRS: đã nhớ 1/3/7/14/30 ngày; chưa chắc 1 ngày; chưa nhớ ôn ngay.
- Phiên ôn có thể gồm nhiều chủ đề và cho phép 1–50 từ để không bỏ sót các danh sách ôn nhỏ.
- Số từ cần ôn là tổng số thực tế, không bị cắt theo `limit`.
- Ngày/tuần/tháng học tính theo UTC+7; tuần bắt đầu thứ Hai. Timestamp được đọc/ghi bằng kết nối UTC.
- Không tính từ chỉ được yêu thích vào tổng từ đã học.
- Chặn xóa chủ đề còn từ hoặc lịch sử học. Chặn xóa từ đã có dữ liệu học để giữ lịch sử; có thể ẩn chủ đề thay vì xóa dữ liệu.
- Nâng cấp giữ nguyên phiên cũ. Nếu phiên đang học cũ thiếu danh sách từ đã chọn, hoàn thành trả `LEGACY_SESSION`; người học cần bắt đầu phiên mới.
- Nếu database cũ có kết quả trùng phiên–từ, migration dừng để đối chiếu, không tự xóa bản ghi trùng.

## Kiểm tra

- `npm run build`: kiểm tra và biên dịch TypeScript.
- `npm run lint`: kiểm tra quy tắc code.
- `npm run format:check`: kiểm tra định dạng theo `.prettierrc` cũ.
- `npm test`: build rồi kiểm thử API và MySQL thực tế.

Kiểm thử tạo database tên ngẫu nhiên `flashcard_test_...`, chỉ xóa database do chính lần chạy đó tạo. Tài khoản MySQL kiểm thử cần quyền CREATE/DROP DATABASE và CREATE TRIGGER. Không chạy kiểm thử bằng tài khoản chỉ được cấp quyền trên database ứng dụng.

Các tình huống chính: đăng ký/đăng nhập, validation, phân quyền, khóa tài khoản, đổi mật khẩu, yêu thích, chủ đề ẩn, phiên học, gửi đồng thời cùng kết quả, hoàn thành thiếu từ, rollback khi database lỗi, ôn tập, tiến độ, lịch sử và upload.

## Công việc còn lại ngoài đợt sửa backend này

- Kết nối các màn hình mobile đang giả lập với API thật.
- Đăng nhập Google cần bổ sung luồng xác minh token Google và cấu hình OAuth.
- Thành tích/điểm thưởng vẫn là phần mở rộng, chưa có API nghiệp vụ hoàn chỉnh.
