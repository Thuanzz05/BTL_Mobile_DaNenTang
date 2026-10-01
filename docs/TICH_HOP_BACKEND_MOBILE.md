# Tích hợp backend, admin web và mobile

Cập nhật ngày 01/10/2026. Mô tả bản `leitner-queue-v2`, sau migration 010.

## Chuẩn bị sau khi pull

Cài thư viện theo lockfile của từng ứng dụng và chạy migration trước khi khởi động backend. Các lệnh ở README gốc được chạy từ thư mục gốc repo. Dữ liệu cũ được giữ lại.

- 009: thêm ngăn Leitner vào tiến độ từng từ.
- 010: phiên flashcard riêng, lưu thẻ đã xem và ràng buộc chống trùng nội dung.
- Không đổi tên thuật toán của phiên cũ. Cả `adaptive-v1` và `leitner-adaptive-v1` tiếp tục theo quy tắc cũ khi khôi phục.

Tất cả đường dẫn dưới đây có tiền tố `/api`. Các nghiệp vụ cá nhân cần `Authorization: Bearer <accessToken>`; backend tự xác định người dùng từ token.

## Học flashcard

Khách chỉ xem tối đa 5 thẻ trên giao diện học thử, không tạo phiên và không lưu tiến độ.

Người đã đăng nhập:

1. `POST /learning/flashcards/start` với `{ "chu_de_id": "<id>" }`: tiếp tục phiên flashcard dở của chủ đề hoặc tạo phiên từ chưa học. Số từ lấy theo mục tiêu 5/10/20 từ, giới hạn theo số từ còn lại.
2. Lật thẻ để xem nghĩa, phiên âm, ví dụ và nghe phát âm.
3. Bấm tiếp theo: `POST /learning/flashcards/view` với `phien_hoc_tap_id`, `tu_vung_id`. Backend yêu cầu xem theo thứ tự; gửi lại một thẻ đã lưu không cộng tiến độ lần nữa.
4. Cuối phiên: `POST /learning/flashcards/complete` với `phien_hoc_tap_id`. Chỉ hoàn thành khi tất cả thẻ đã được ghi nhận.

Khi hoàn thành, từ mới được ghi là đã học, ở ngăn 1 và đến hạn sau 1 ngày. Flashcard không chấm đúng/sai. Nếu rời trước khi bấm tiếp theo, lần lật của thẻ hiện tại chưa được lưu; các thẻ đã gửi được khôi phục khi mở lại chủ đề. Mất mạng sẽ hiển thị lỗi và cho thử lại; chưa có hàng đợi offline cho flashcard.

`/learning/start` và `/learning/review/start` đã đóng (410). `/learning/result` chỉ giữ để hoàn tất phiên tự đánh giá cũ; không gọi cho flashcard mới hay quiz.

## Quiz ôn tập

- `POST /quiz/start`: ôn các từ đến hạn trong chủ đề; body có `chu_de_id`, `tong_so_tu` (1–50), `ma_yeu_cau` UUID tùy chọn.
- `POST /quiz/review/start`: ôn từ đến hạn trong nhiều chủ đề; body có `tong_so_tu`, `ma_yeu_cau`.
- Không đủ từ thì lấy số thực tế, không bổ sung từ mới. Không có từ đủ điều kiện trả `NO_REVIEW_WORDS`.
- Từ đang nằm trong một quiz dở của cùng người dùng chưa được đưa vào quiz mới.
- Backend chụp nội dung và lựa chọn khi tạo phiên; sửa danh mục sau đó không đổi đáp án của phiên đã tạo.
- Cùng mã khởi tạo và cùng tham số trả lại cùng phiên. Không đổi mã khi thử lại do mất phản hồi.

`POST /quiz/:sessionId/answers` nhận:

```json
{
  "cau_hoi_id": "<uuid>",
  "lua_chon_id": "<uuid>",
  "ma_yeu_cau": "<uuid-của-lượt-trả-lời>"
}
```

Response có `ket_qua` (đúng/sai, đáp án đúng, nghĩa, từ đã hoàn thành) và `phien` (tiến độ cùng câu tiếp theo). Không gửi kết quả tự chấm từ client. Gửi lặp cùng UUID và nội dung không tăng lượt hoặc cập nhật ngăn lần nữa.

Quy tắc phiên mới:

- Đúng ngay lần đầu: từ hoàn thành, lên một ngăn, tối đa ngăn 5.
- Sai lần đầu: về ngăn 1 ngay, kể cả sau đó dừng phiên; từ quay xuống cuối hàng đợi.
- Sai rồi trả lời lại đúng: hoàn thành từ trong phiên nhưng vẫn ở ngăn 1; không tăng ngăn nhờ luyện lại trong cùng phiên.
- Lịch ngăn 1–5: 1, 2, 4, 7, 14 ngày.
- Từ mới học: ngăn 1–2; đang củng cố: ngăn 3–4; đã thuộc: ngăn 5.

Phiên cũ `adaptive-v1` / `leitner-adaptive-v1` giữ yêu cầu 2–4 lượt đúng liên tiếp theo số lần sai. Không áp quy tắc một lượt đúng cho phiên cũ còn dở.

## Khôi phục và dừng quiz

- `GET /quiz/:sessionId`: lấy câu đang làm và tiến độ mới nhất của người sở hữu.
- `POST /quiz/:sessionId/stop`: dừng phiên, giữ lịch sử; những từ chưa hoàn thành và vẫn đến hạn có thể được đưa vào phiên mới.
- Native lưu bản nháp trong SecureStore; web dùng localStorage. Bản nháp tách theo tài khoản, gồm ID phiên, một câu trả lời chờ gửi và yêu cầu dừng chờ gửi.
- Luôn lưu câu trả lời trước khi gửi. Khi mất mạng, mở lại sẽ gửi đúng UUID và nội dung trước đó; vẫn cần mạng để chấm và lấy câu tiếp theo.
- Trang chủ có Tiếp tục bài học cho bản nháp trên thiết bị.
- Lịch sử có Tiếp tục bài học và Dừng phiên cho quiz đang học trên server, kể cả sau khi đổi thiết bị hoặc mất bản nháp. Dừng cần xác nhận và gửi xong câu trả lời đang chờ.
- Nếu máy đang giữ một quiz khác, thao tác từ lịch sử sẽ yêu cầu xử lý bài đó trước, không ghi đè câu trả lời đang chờ.
- Back Android và nút thoát quiz dùng chung xác nhận: ở lại, lưu học sau hoặc dừng phiên.

## Lịch sử và tiến độ

- `/history?page=...&limit=20`: tải thêm từng trang; thứ tự ổn định theo thời gian bắt đầu rồi ID.
- `/history/:id`: kết quả từng từ và `luot_tra_loi` của quiz; mobile hiển thị lượt đúng/sai, lựa chọn và đáp án đúng.
- `/progress`, `/progress/topics`, `/progress/review` và `/home/dashboard`: dữ liệu cá nhân. Mobile tải lại tiến độ khi quay về màn hình.
- `/words/:id` trả `tien_do` khi đăng nhập, gồm đã học, ngăn Leitner và ngày ôn; khách nhận null.
- `PUT /auth/profile` với `muc_tieu_hang_ngay` (5/10/20) thay đổi mục tiêu.
- Thành tích được kiểm tra sau hoàn thành flashcard và sau trả lời quiz; hỗ trợ số phiên, từ đã học, chuỗi ngày và từ ngăn 5.

## Admin và tài khoản

Web dùng `/web-auth/login`, `/web-auth/refresh`, `/web-auth/logout`; refresh token ở cookie HttpOnly. Mobile dùng nhóm `/auth` và refresh token trong kho lưu trữ của thiết bị.

Admin quản lý chủ đề, từ, người học, thành tích và thống kê. Ẩn nội dung chỉ loại khỏi danh mục/phiên mới; lịch sử và phiên đã bắt đầu được giữ. Thành tích đã trao không được xóa hoặc đổi điều kiện/điểm. Xóa người học có xác nhận và xóa dữ liệu liên quan; không xóa tài khoản admin.

Quên mật khẩu đã có API, nhưng gửi email thật cần cấu hình theo [hướng dẫn email](CAU_HINH_EMAIL.md). Google OAuth chưa triển khai.

## Kiểm thử trước demo

Chạy tests, typecheck, lint và build theo README gốc. Kiểm tra thêm trên điện thoại thật: phát âm, Back Android, tắt/mở app khi đang gửi, mạng chập chờn, đổi tài khoản, tiếp tục/dừng từ lịch sử. Kiểm thử tự động hoặc bản web không thay thế các kiểm tra phần cứng này.
