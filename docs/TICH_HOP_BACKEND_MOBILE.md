# Tích hợp backend, admin web và mobile

Cập nhật ngày 17/09/2026. Đây là hợp đồng API và trạng thái tích hợp để cộng tác viên nối tiếp phần mobile.

## Bốn thay đổi mới từ PR #13 và #14

- Hồ sơ và đổi mật khẩu đã dùng `/auth/profile` và `/auth/change-password`; backend hỗ trợ, đổi mật khẩu thu hồi token cũ.
- Trắc nghiệm đã dùng API quiz: server chọn câu, chấm và lưu từng lượt; đã lưu phiên và câu trả lời chờ gửi trên thiết bị.
- Lịch sử đã gọi `GET /history?page=1&limit=50` và có xem chi tiết phiên. Chưa có tải trang tiếp theo.
- Yêu thích đã dùng GET/PUT/DELETE. Nút trong flashcard hiện là thêm yêu thích; gỡ ở màn hình danh sách.

Tiến độ trên trang chủ được tải lại sau phiên hoàn thành, chưa phải đồng bộ thời gian thực giữa nhiều thiết bị. Các luồng cũ tiếp tục chạy với API hiện tại.

## Phần backend mới

- API trắc nghiệm do server chọn câu và chấm đáp án, lưu mọi lượt đúng/sai.
- Chụp nội dung từ và các lựa chọn lúc tạo phiên. Sửa từ vựng trong admin không làm thay đổi câu hỏi đang học.
- Lưu mã yêu cầu để gửi lại không bị cộng lượt hoặc cập nhật Leitner lần nữa.
- Khôi phục câu đang làm, dừng phiên, tự hoàn thành khi tất cả từ đạt yêu cầu.
- Thống kê đúng/sai theo khoảng ngày Việt Nam và ngưỡng số lượt mỗi từ.
- Phiên đăng nhập web bằng cookie HttpOnly riêng; API token JSON của mobile vẫn giữ nguyên.

Dữ liệu cũ có `phuong_thuc = danh_gia`; dữ liệu mới dùng `trac_nghiem` và `phien_ban_thuat_toan = leitner-adaptive-v1`. Migration không đổi các phiên cũ thành quiz và không tự suy diễn lịch sử trả lời.

## Hợp đồng API trắc nghiệm đang dùng trên mobile

Tất cả endpoint dưới đây nằm sau `/api`, dùng `Authorization: Bearer <accessToken>`.

### 1. Bắt đầu

`POST /quiz/start`

```json
{ "chu_de_id": "<id-chủ-đề>", "tong_so_tu": 20, "ma_yeu_cau": "<uuid-khởi-tạo>" }
```

Nhận 5–50 từ; chủ đề phải có ít nhất năm từ. Backend chọn số thực tế có sẵn, tối đa bằng số yêu cầu.

Ôn từ đến hạn: `POST /quiz/review/start` với `{ "tong_so_tu": 20 }`, cho phép 1–50 từ. Một từ ôn vẫn tạo được câu trắc nghiệm nhờ đáp án nhiễu lấy từ danh mục đang hiển thị. Danh mục cần ít nhất hai nghĩa khác nhau.

Cả hai endpoint nhận thêm `ma_yeu_cau` UUID tùy chọn, được mobile mới lưu trước khi gọi. Cùng tài khoản, cùng mã và cùng tham số sẽ trả lại phiên cũ (kể cả phiên đã kết thúc); đổi tham số với cùng mã trả 409 `IDEMPOTENCY_CONFLICT`. Client cũ không gửi mã vẫn hoạt động như trước. Chạy `npm run db:migrate` trong `backend` để áp dụng migration `004-quiz-start-retry.js` trước khi chạy backend mới.

Kết quả trong `data`:

```json
{
  "phien_hoc_tap_id": "<id-phiên>",
  "phien_ban_thuat_toan": "leitner-adaptive-v1",
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

Mobile đã lưu bản nháp riêng theo tài khoản: ý định khởi tạo, ID phiên, một câu trả lời chờ gửi và yêu cầu dừng đang chờ. Native dùng SecureStore; web dùng localStorage. Không lưu access token hoặc cả bộ câu hỏi vào bản nháp.

Trang chủ có **Tiếp tục bài học**. Khi mở lại, app gửi lại câu đang chờ với đúng UUID và nội dung, rồi GET trạng thái mới nhất. Nếu chọn chủ đề khác khi còn bài dở, app tiếp tục bài cũ và hiển thị tên bài cũ; không ghi đè bản lưu. Nếu không ghi được xuống thiết bị thì không gửi câu trả lời mới. Lỗi mạng hoặc đăng nhập không xóa bản lưu; đăng nhập lại đúng tài khoản để khôi phục. Phiên đã kết thúc hoặc không còn trên server sẽ được bỏ khỏi bản lưu.

Nút thoát và Back Android trong modal trắc nghiệm dùng chung xác nhận:
- **Tiếp tục học**: ở lại bài.
- **Lưu để học sau**: về trang chủ, không gọi API dừng.
- **Dừng phiên**: lưu yêu cầu dừng, gửi xong câu trả lời chờ trước, rồi gọi API dừng. Nếu mất mạng, yêu cầu dừng được giữ để thử lại. Trong lúc gửi, các hành động rời bài bị khóa.

Phạm vi: phiên trắc nghiệm của tài khoản đã đăng nhập, một bản nháp mỗi tài khoản trên mỗi thiết bị. Vẫn cần mạng để chấm và lấy câu tiếp theo; có thể bấm **Thử gửi lại** hoặc mở **Tiếp tục bài học** khi có mạng. Nếu mở app lúc offline và chưa khôi phục đăng nhập được, trang chủ có **Thử kết nối lại**. Khách chưa đăng nhập chỉ được tra cứu từ và lật flashcard học thử; frontend không tạo trắc nghiệm cục bộ, không gọi API học tập và không lưu kết quả. Vị trí lật thẻ không được lưu qua lần mở app; xóa dữ liệu ứng dụng sẽ xóa các câu chưa gửi của tài khoản đã đăng nhập.

Code tách theo trách nhiệm: `services/quiz-session.ts` quản lý lưu/gửi lại, `hooks/use-quiz-session.ts` gắn tài khoản, `components/server-quiz.tsx` hiển thị bài, `flashcard-preview.tsx` điều phối modal và Back, `resume-learning-card.tsx` hiển thị bài dở.

### 4. Quy tắc luyện tập và Leitner

Mỗi từ cần hai lượt đúng liên tiếp. Sai một lần cần ba lượt đúng liên tiếp; sai từ hai lần trở lên cần bốn. Trả lời sai đặt lại chuỗi đúng và đưa từ trở lại sớm hơn.

Khi từ đạt yêu cầu, backend cập nhật hệ thống Leitner 5 ngăn:
- từ mới bắt đầu ở ngăn 1;
- không sai trong phiên: lên một ngăn, tối đa ngăn 5;
- có ít nhất một lần sai trong phiên: về ngăn 1;
- lịch ôn ngăn 1–5: 1, 3, 7, 14 và 30 ngày.

Trạng thái tiến độ cũ vẫn được trả để tương thích: ngăn 1 là `chua-nho`, ngăn 2–4 là `da-nho`, ngăn 5 là `thuoc-long`. API danh sách ôn trả thêm `ngan_leitner` để giao diện hiển thị ngăn hiện tại.

Một phiên chỉ cập nhật Leitner một lần cho mỗi từ, trong khi bảng câu hỏi giữ đầy đủ mọi lượt. Đây là thuật toán luyện tập hiện tại, không phải bài kiểm tra giám sát hay hệ thống chống gian lận.

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

## Trạng thái ẩn/hiện từ vựng

Backend đã hỗ trợ `tu_vung.trang_thai` (`active` / `inactive`). Mobile không phải gửi thêm trường khi lấy nội dung: các API thư viện, yêu thích và tạo phiên học/ôn tự loại từ ẩn, kể cả đáp án nhiễu của quiz mới. Từ còn bị ẩn nếu chủ đề của nó ẩn. API chi tiết từ ẩn trả 404 cho người học.

Phiên đã bắt đầu vẫn giữ danh sách và có thể hoàn thành; lịch sử/tiến độ/yêu thích không bị xóa. Khi từ được hiện lại, dữ liệu trước đó còn nguyên. Tổng từ đã học là số liệu lịch sử; `total_words` / `learned_words` theo chủ đề chỉ tính từ đang hiển thị. Bộ đếm ôn cũng loại từ ẩn. Cache đã tải trên mobile chỉ cập nhật khi client gọi lại API.

Admin dùng `PUT /api/admin/words/:id` với `{ "trang_thai": "inactive" }` hoặc `"active"`; bỏ trường này khi sửa nội dung sẽ giữ trạng thái hiện tại. `GET /api/admin/words?status=inactive` hỗ trợ tìm/lọc/phân trang. Các API chủ đề trả thêm `active_word_count`; `word_count` của admin tính toàn bộ từ, của người học chỉ tính từ hiển thị.

## Phần việc mobile còn lại

1. Kiểm tra trên máy Android thật: Back ở câu đầu, sau trả lời, khi đang gửi, và tại xác nhận thoát; thoát/mở lại app khi có câu chờ gửi; thử lại sau khi kết nối mạng.
2. Bổ sung phân trang lịch sử.
3. Đồng bộ trạng thái yêu thích ban đầu và thao tác bỏ yêu thích trực tiếp trên flashcard nếu đó là thiết kế mong muốn.
4. Nếu cần học hoàn toàn offline hoặc lưu vị trí lật flashcard, bổ sung bộ nhớ nội dung và quy tắc đồng bộ riêng.

Google OAuth và thành tích/điểm thưởng là phần mở rộng; chưa có luồng nghiệp vụ hoàn chỉnh trong đợt này.
