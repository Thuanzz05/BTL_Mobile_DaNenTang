# Tích hợp backend, admin web và mobile

Cập nhật ngày 15/09/2026. Đây là hợp đồng API để cộng tác viên nối tiếp phần mobile; các màn hình mobile hiện có được giữ nguyên.

## Bốn thay đổi mới từ PR #13 và #14

- Hồ sơ và đổi mật khẩu đã dùng `/auth/profile` và `/auth/change-password`; backend hỗ trợ, đổi mật khẩu thu hồi token cũ.
- Flashcard đã tạo phiên thật, nhưng chỉ nộp trạng thái SRS của mỗi từ khi hoàn thành. Chưa lưu từng câu trả lời trong khi học.
- Lịch sử đã gọi `GET /history?page=1&limit=50`. Màn hình hiện lấy 50 phiên đầu, chưa có tải trang tiếp theo hoặc mở chi tiết từng lượt.
- Yêu thích đã dùng GET/PUT/DELETE. Nút trong flashcard hiện là thêm yêu thích; gỡ ở màn hình danh sách.

Tiến độ trên trang chủ được tải lại sau phiên hoàn thành, chưa phải đồng bộ thời gian thực giữa nhiều thiết bị. Các luồng cũ tiếp tục chạy với API hiện tại.

## Phần backend mới

- API trắc nghiệm do server chọn câu và chấm đáp án, lưu mọi lượt đúng/sai.
- Chụp nội dung từ và các lựa chọn lúc tạo phiên. Sửa từ vựng trong admin không làm thay đổi câu hỏi đang học.
- Lưu mã yêu cầu để gửi lại không bị cộng lượt hoặc SRS lần nữa.
- Khôi phục câu đang làm, dừng phiên, tự hoàn thành khi tất cả từ đạt yêu cầu.
- Thống kê đúng/sai theo khoảng ngày Việt Nam và ngưỡng số lượt mỗi từ.
- Phiên đăng nhập web bằng cookie HttpOnly riêng; API token JSON của mobile vẫn giữ nguyên.

Dữ liệu cũ có `phuong_thuc = danh_gia`; dữ liệu mới dùng `trac_nghiem` và `phien_ban_thuat_toan = adaptive-v1`. Migration không đổi các phiên cũ thành quiz và không tự suy diễn lịch sử trả lời.

## Chuyển màn hình trắc nghiệm mobile sang API mới

Tất cả endpoint dưới đây nằm sau `/api`, dùng `Authorization: Bearer <accessToken>`.

### 1. Bắt đầu

`POST /quiz/start`

```json
{ "chu_de_id": "<id-chủ-đề>", "tong_so_tu": 20 }
```

Nhận 5–50 từ; chủ đề phải có ít nhất năm từ. Backend chọn số thực tế có sẵn, tối đa bằng số yêu cầu.

Ôn từ đến hạn: `POST /quiz/review/start` với `{ "tong_so_tu": 20 }`, cho phép 1–50 từ. Một từ ôn vẫn tạo được câu trắc nghiệm nhờ đáp án nhiễu lấy từ danh mục đang hiển thị. Danh mục cần ít nhất hai nghĩa khác nhau.

Kết quả trong `data`:

```json
{
  "phien_hoc_tap_id": "<id-phiên>",
  "phien_ban_thuat_toan": "adaptive-v1",
  "trang_thai": "dang-hoc",
  "tong_so_tu": 20,
  "so_tu_hoan_thanh": 0,
  "so_luot_tra_loi": 0,
  "so_luot_dung": 0,
  "ty_le_dung": null,
  "cau_hoi": {
    "id": "<uuid-câu-hỏi>",
    "tu_vung_id": "<id-từ>",
    "thu_tu": 1,
    "tu_tieng_anh": "apple",
    "phien_am": "/ˈæpəl/",
    "url_am_thanh": null,
    "url_hinh_anh": null,
    "lua_chon": [
      { "id": "<uuid-lựa-chọn>", "noi_dung": "quả táo" },
      { "id": "<uuid-lựa-chọn-khác>", "noi_dung": "ngôi nhà" }
    ]
  }
}
```

Có từ hai đến bốn lựa chọn với nghĩa khác nhau. Không hiển thị đủ bốn bằng cách lặp đáp án. Không trả dấu hiệu lựa chọn nào đúng trước khi nộp.

### 2. Trả lời

`POST /quiz/:sessionId/answers`

```json
{
  "cau_hoi_id": "<uuid-câu-hỏi>",
  "lua_chon_id": "<uuid-lựa-chọn-được-chọn>",
  "ma_yeu_cau": "<uuid-mới-cho-lượt-này>",
  "thoi_gian_tra_loi_ms": 1800
}
```

Client tạo UUID trước khi gửi và giữ nguyên cả UUID lẫn nội dung khi retry do mất mạng. Thời gian trả lời là tùy chọn (0–3.600.000 ms), do client báo, chưa dùng để xếp hạng. Không gửi `dung`, `is_correct` hoặc `trang_thai`.

Response có:
- `ket_qua`: `cau_hoi_id`, `dung`, `dap_an_dung_id`, `nghia_tieng_viet`, `tu_da_hoan_thanh`.
- `phien`: trạng thái mới cùng cấu trúc kết quả bắt đầu, bao gồm câu tiếp theo.

Hiển thị phản hồi cho câu vừa nộp, rồi dùng `phien.cau_hoi` khi người học bấm tiếp tục. Khóa nút nộp trong lúc chờ. Không gọi `answerQuiz/nextQuestion` của client để tự chọn câu cho phiên mới.

Response của retry là phản hồi đã lưu tại thời điểm nộp lần đầu. Nếu có thiết bị khác tiếp tục học, gọi GET phiên để nhận trạng thái mới nhất.

Khi `phien.trang_thai = hoan-thanh`, server đã ghi tiến độ và hoạt động; không gọi lại `/learning/result` hoặc `/learning/complete` cho luồng mới.

### 3. Khôi phục và dừng

- `GET /quiz/:sessionId`: tiếp tục đúng câu chưa trả lời, giữ số lượt đã lưu.
- `POST /quiz/:sessionId/stop`: chuyển phiên đang học sang `bo-do`, giữ lịch sử trả lời; gọi lại không đổi kết quả.
- `GET /history/:sessionId`: có thêm `luot_tra_loi` gồm các câu đã chấm, lựa chọn, đáp án, thời gian và nội dung từ đã chụp.

Mobile cần lưu ID phiên theo tài khoản nếu muốn khôi phục sau khi đóng ứng dụng. Không dùng ID phiên của người đăng nhập trước.

### 4. Quy tắc luyện tập

Mỗi từ cần hai lượt đúng liên tiếp. Sai một lần cần ba lượt đúng liên tiếp; sai từ hai lần trở lên cần bốn. Trả lời sai đặt lại chuỗi đúng và đưa từ trở lại sớm hơn.

Khi từ đạt yêu cầu:
- không sai: SRS `da-nho`;
- sai một lần: `chua-chac`;
- sai từ hai lần: `chua-nho`.

Một phiên chỉ cộng một lần ôn cho mỗi từ, trong khi bảng câu hỏi giữ đầy đủ mọi lượt. Đây là thuật toán luyện tập hiện tại, không phải bài kiểm tra giám sát hay hệ thống chống gian lận.

### 5. Lỗi cần xử lý

- 401: thử refresh token một lần; nếu thất bại, về đăng nhập.
- 403 `ACCOUNT_DISABLED`: tài khoản bị khóa/ngừng hoạt động.
- 404 `SESSION_NOT_FOUND`: không có phiên hoặc phiên thuộc tài khoản khác.
- 409 `IDEMPOTENCY_CONFLICT`: cùng mã yêu cầu nhưng nội dung khác; không tự tạo mã mới để gửi lại câu đã nộp.
- 409 `QUESTION_ALREADY_ANSWERED`: tải lại trạng thái phiên.
- 409 `SESSION_CLOSED`: phiên đã kết thúc, mở kết quả hoặc bắt đầu phiên mới.
- 409 `INSUFFICIENT_WORDS/INSUFFICIENT_CHOICES`: nội dung chưa đủ để học.
- 409 `QUIZ_ANSWER_REQUIRED`: không dùng API đánh giá SRS cũ cho phiên trắc nghiệm.

## API cho web quản trị

Web đã nối các endpoint quản trị hiện có, kèm:
- `POST /web-auth/login`, `/web-auth/refresh`, `/web-auth/logout`;
- `GET /admin/quiz-statistics?from=YYYY-MM-DD&to=YYYY-MM-DD&minAttempts=5&limit=20`.

Bộ lọc ngày tính theo UTC+7, bao gồm cả ngày kết thúc, tối đa 366 ngày. Mặc định 30 ngày gần nhất. `ty_le_dung = null` khi chưa có lượt trả lời. Thống kê bao gồm các lượt đã chấm của cả phiên hoàn thành và phiên dừng.

## Phần việc mobile còn lại

1. Đổi các lời gọi mạng của màn hình luyện tập sang hợp đồng quiz ở trên; giữ thiết kế giao diện.
2. Lưu/khôi phục ID phiên và mã yêu cầu đang chờ gửi.
3. Nối hành động thoát chủ động với API dừng phiên.
4. Bổ sung phân trang lịch sử và trang chi tiết từng lượt khi cần.
5. Đồng bộ trạng thái yêu thích ban đầu và thao tác bỏ yêu thích trực tiếp trên flashcard nếu đó là thiết kế mong muốn.

Google OAuth và thành tích/điểm thưởng là phần mở rộng; chưa có luồng nghiệp vụ hoàn chỉnh trong đợt này.
