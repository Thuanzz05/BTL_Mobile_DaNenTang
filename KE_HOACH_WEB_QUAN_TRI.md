# Kế hoạch xây dựng website quản trị Wordleaf

> Cập nhật triển khai 15/09/2026: `admin-web/` đã có các trang quản trị và nối API thật. Backend đã bổ sung cookie đăng nhập web, lưu/chấm từng câu quiz và báo cáo đúng/sai. Mobile vẫn dùng luồng lưu kết quả cũ; xem [hướng dẫn web](admin-web/README.md) và [hợp đồng tích hợp mobile](docs/TICH_HOP_BACKEND_MOBILE.md). Các mục bên dưới giữ lại để đối chiếu kế hoạch ban đầu.

> Đề tài: Ứng dụng học từ vựng tiếng Anh qua flashcard và trắc nghiệm.
> Ngày lập: 14/09/2026. Đối chiếu với source backend hiện có trên nhánh Thuan.
> Đây là kế hoạch triển khai, không phải danh sách tính năng đã hoàn thành.

## 1. Mục tiêu và phạm vi

Xây dựng website riêng cho quản trị viên sử dụng trên trình duyệt máy tính để quản lý nội dung học, người dùng và theo dõi hoạt động hệ thống.

- Website quản trị dùng giao diện web: sidebar, bảng dữ liệu, bộ lọc, form và hộp thoại.
- Ứng dụng React Native hiện tại tiếp tục phục vụ người học.
- Cả hai sử dụng chung backend Express và MySQL; website không kết nối trực tiếp database.
- Ưu tiên hoàn thiện quản lý chủ đề và từ vựng để nội dung tạo trên web dùng được ngay trong app.
- Không đưa chức năng tự đánh dấu “đã nhớ/chưa nhớ” vào luồng trắc nghiệm mới. Độ khó dựa trên kết quả trả lời.

## 2. Cấu trúc dự án đề xuất

```text
EnglishVocabulary/
├── frontend/          # App React Native hiện tại
├── backend/           # API Express + MySQL dùng chung
├── admin-web/         # Website quản trị mới
│   └── src/
│       ├── layouts/   # Sidebar, header, khung nội dung
│       ├── pages/     # Các trang quản trị
│       ├── components/ # Bảng, form, upload, trạng thái tải/lỗi
│       ├── services/  # HTTP client và các API
│       ├── hooks/
│       ├── types/
│       └── styles/
└── KE_HOACH_WEB_QUAN_TRI.md
```

Định hướng triển khai: React + TypeScript cho web, dùng HTML/CSS và các thành phần giao diện web. Tạo project độc lập, có package.json và cấu hình môi trường riêng. Chốt công cụ build, thư viện UI và phiên bản khi bắt đầu code; không sao chép nguyên dependency Expo sang website.

Có thể chia sẻ kiểu dữ liệu/API contract, nhưng không import component React Native hoặc SecureStore vào web.

## 3. Bố cục và danh sách trang

```text
Sidebar                    Nội dung chính
-------------------        -------------------------------------
Wordleaf Admin             Tên trang / Breadcrumb / Tài khoản
Tổng quan                  Bộ lọc và nút thao tác
Chủ đề                     Bảng dữ liệu hoặc biểu đồ
Từ vựng                    Phân trang / Thông báo kết quả
Người dùng
Thống kê
Tài khoản
```

| Trang web dự kiến | Mục đích | Ưu tiên |
| --- | --- | --- |
| /login | Đăng nhập quản trị | Bắt buộc |
| /dashboard | Tổng quan hệ thống | Bắt buộc |
| /topics | Danh sách, thêm, sửa, ẩn chủ đề | Bắt buộc |
| /words | Danh sách và tìm kiếm từ vựng | Bắt buộc |
| /words/new | Thêm từ, ví dụ, ảnh, âm thanh | Bắt buộc |
| /words/:id/edit | Sửa nội dung từ | Bắt buộc |
| /users | Tra cứu, khóa/mở khóa người học | Bắt buộc |
| /statistics | Thống kê hoạt động | Sau phần quản lý nội dung |
| /account | Hồ sơ, đổi mật khẩu, đăng xuất | Bắt buộc |

Đường dẫn trên thuộc website; không nhầm với đường dẫn API /api/admin/... của backend.

## 4. Chi tiết chức năng từng trang

### 4.1. Đăng nhập quản trị

- Form email, mật khẩu, nút hiện/ẩn mật khẩu và trạng thái đang đăng nhập.
- Dùng API đăng nhập hiện tại; chỉ cho vào website khi tài khoản có vai_tro = admin.
- Không có đăng ký admin công khai; API đăng ký hiện tại không dùng để cấp quyền quản trị.
- Tải lại trang vẫn có cơ chế khôi phục phiên; access token hết hạn thì thử refresh một lần.
- Tài khoản người học nhận thông báo không có quyền quản trị.
- Backend vẫn phải kiểm tra quyền ở từng API, không chỉ ẩn menu trên frontend.
- Xử lý riêng sai mật khẩu, hết phiên, tài khoản bị khóa và mất kết nối.

Thiết kế phiên web cần chốt trước khi code: ưu tiên refresh token trong cookie HttpOnly/Secure cho bản triển khai thật, access token trong bộ nhớ. Backend hiện trả token trong JSON; dùng cookie cần bổ sung luồng refresh/logout, CORS credentials và chống CSRF phù hợp. Nếu bản demo dùng sessionStorage, phải ghi rõ giới hạn và không xem đó là tương đương HttpOnly.

### 4.2. Tổng quan

- Các số liệu: tổng người học, tổng chủ đề, tổng từ vựng, tổng phiên học, phiên đang học.
- Biểu đồ người dùng mới và phiên học trong 7 ngày theo dữ liệu API trả về.
- Lối tắt: Thêm chủ đề, Thêm từ vựng, Quản lý người dùng.
- Không có dữ liệu thì hiển thị trạng thái trống, không tạo số liệu minh họa giả.
- Chưa đưa “tỉ lệ trả lời đúng” hoặc “từ sai nhiều nhất” vào dashboard vì kết quả trắc nghiệm chưa được lưu.

### 4.3. Quản lý chủ đề

Bảng gồm: tên, ảnh, số từ, trạng thái hiển thị, thứ tự và thao tác.

Form gồm:

- ten: tên chủ đề, bắt buộc.
- mo_ta: mô tả.
- hinh_anh: ảnh đại diện hoặc URL ảnh đã upload.
- trang_thai: active hoặc inactive.
- thu_tu_hien_thi: số nguyên không âm.

Chức năng:

- Xem tất cả chủ đề, lọc trạng thái; tìm tên trên danh sách đã tải ở giai đoạn đầu.
- Thêm, chỉnh sửa, ẩn/hiện, thay đổi thứ tự.
- Bấm số từ để mở trang từ vựng với bộ lọc chủ đề tương ứng.
- Xác nhận trước khi xóa; hiển thị thông báo backend nếu không thể xóa.
- Backend hiện chặn xóa chủ đề còn từ vựng hoặc lịch sử học. Ưu tiên ẩn chủ đề đó.
- Cảnh báo chủ đề chưa đủ nội dung để luyện trắc nghiệm: tối thiểu 2 nghĩa khác nhau, nên có ít nhất 4 nghĩa khác nhau để đủ 4 lựa chọn.

### 4.4. Quản lý từ vựng

Đây là trang cần đầu tư nhiều nhất trong bản đầu tiên.

Bảng gồm: từ tiếng Anh, phiên âm, từ loại, nghĩa tiếng Việt, chủ đề, tình trạng ảnh/âm thanh và thao tác.

Chức năng danh sách:

- Tìm theo từ hoặc nghĩa, lọc chủ đề, phân trang qua API.
- Xem chi tiết, thêm, sửa và xóa theo điều kiện backend.
- Giữ bộ lọc và trang hiện tại khi quay lại từ màn sửa; tải lại dữ liệu sau khi lưu.

Form thêm/sửa:

| Trường | Nội dung |
| --- | --- |
| chu_de_id | Chủ đề bắt buộc |
| tu_tieng_anh | Từ tiếng Anh bắt buộc |
| nghia_tieng_viet | Nghĩa bắt buộc |
| loai_tu | Chọn theo enum backend, hiển thị nhãn tiếng Việt |
| phien_am | Phiên âm |
| url_hinh_anh | Upload ảnh và xem trước |
| url_am_thanh | Upload MP3 và nghe thử |
| thu_tu_hien_thi | Thứ tự trong chủ đề |
| vi_du | Danh sách câu tiếng Anh, bản dịch và thứ tự |

Quy tắc:

- Cho phép thêm/xóa dòng ví dụ trong form.
- Khi sửa, không gửi vi_du nếu muốn giữ nguyên; gửi [] nghĩa là xóa toàn bộ ví dụ.
- Upload ảnh JPG/PNG tối đa 2 MB; MP3 tối đa 5 MB, theo backend hiện có.
- Upload dùng multipart/form-data với trường file; không ép Content-Type JSON cho request này.
- Hiển thị lỗi file sai định dạng/quá lớn và cho phép thử lại.
- URL tương đối phải được ghép với địa chỉ backend khi hiển thị ảnh hoặc phát âm thanh.
- Kiểm tra dữ liệu và lỗi theo trường; không đóng form khi lưu thất bại.
- Backend chặn xóa từ đã có dữ liệu học hoặc thuộc phiên học.
- Từ vựng hiện chưa có trường ẩn/hiện riêng; muốn thêm chức năng này phải mở rộng schema/API, không chỉ đặt một nút trên web.
- Không cần quản trị viên nhập bốn đáp án cho mỗi từ: phiên bản quiz hiện lấy các nghĩa khác nhau trong cùng chủ đề để tạo lựa chọn. Ngân hàng câu hỏi tùy chỉnh là tính năng mở rộng.

### 4.5. Quản lý người dùng

- Bảng tên, email, phương thức đăng nhập, trạng thái, ngày tạo và số phiên học.
- Tìm tên/email, lọc active/inactive/locked, phân trang.
- Khóa, mở khóa hoặc chuyển inactive; xác nhận thao tác và tải lại trạng thái từ server.
- Backend bảo vệ tài khoản admin khỏi thay đổi trạng thái qua API này.
- Không hiển thị mật khẩu, hash hoặc token.
- Bản đầu không có sửa quyền, xóa người dùng hay xem lịch sử của người khác: chưa có API admin tương ứng.
- Nếu cần trang chi tiết người học, phải bổ sung endpoint có kiểm tra quyền; không dùng API /history của người đăng nhập để giả làm lịch sử người khác.

### 4.6. Thống kê

Có thể làm ngay:

- Chủ đề được học nhiều nhất.
- Từ được học nhiều nhất.
- Hoạt động trong 7 ngày gần nhất.
- Bảng/biểu đồ với nhãn thể hiện đúng ý nghĩa số liệu backend; lượt học không phải tỉ lệ đúng.

Cần bổ sung backend trước:

- Từ trả lời sai nhiều nhất và tỉ lệ sai trên tổng lượt trả lời.
- Tiến bộ theo kết quả trắc nghiệm.
- Khoảng ngày tùy chọn, xuất báo cáo, phân tích từng người học.

Không suy ra “trả lời sai” từ trạng thái tự đánh giá cũ. Khi lượng trả lời còn ít, hiển thị số lượt kèm tỉ lệ để tránh kết luận sai về độ khó của từ.

### 4.7. Tài khoản quản trị

- Xem/sửa họ tên và ảnh đại diện qua API hồ sơ.
- Đổi mật khẩu: mật khẩu hiện tại, mật khẩu mới, xác nhận.
- Đổi mật khẩu thành công yêu cầu đăng nhập lại, phù hợp backend thu hồi các phiên cũ.
- Đăng xuất và xóa phiên trên trình duyệt.
- Chưa cần trang “Cài đặt hệ thống” vì hiện chưa có API lưu các cấu hình đó.

## 5. API hiện có để nối giao diện

Base URL lấy từ biến môi trường riêng của admin-web. Tiền tố mặc định là /api.

| Nhóm | Method và đường dẫn | Ghi chú |
| --- | --- | --- |
| Xác thực | POST /api/auth/login | Body: email, mat_khau |
| Phiên | POST /api/auth/refresh | Body: refreshToken |
| Đăng xuất | POST /api/auth/logout | Bearer token + refreshToken |
| Hồ sơ | GET /api/auth/me | Người đang đăng nhập |
| Hồ sơ | PUT /api/auth/profile | ho_ten, anh_dai_dien |
| Mật khẩu | POST /api/auth/change-password | mat_khau_cu, mat_khau_moi |
| Tổng quan | GET /api/admin/dashboard | Thống kê quản trị |
| Chủ đề | GET, POST /api/admin/topics | Danh sách/tạo mới |
| Chủ đề | PUT, DELETE /api/admin/topics/:id | Sửa/xóa |
| Từ vựng | GET, POST /api/admin/words | Danh sách có search/topicId/page/limit; tạo mới |
| Từ vựng | PUT, DELETE /api/admin/words/:id | Sửa/xóa |
| Chi tiết từ | GET /api/words/:id | Gửi Bearer admin để xem cả nội dung chủ đề ẩn |
| Người dùng | GET /api/admin/users | search, status, page, limit |
| Người dùng | PUT /api/admin/users/:userId/status | Body: trang_thai |
| Thống kê | GET /api/admin/statistics | Chủ đề/từ phổ biến, hoạt động 7 ngày |
| Upload | POST /api/admin/upload/image | multipart, file |
| Upload | POST /api/admin/upload/audio | multipart, file |

Các route /api/admin đều có authMiddleware và adminMiddleware. Danh sách có phân trang dùng data.items và data.pagination; danh sách chủ đề trả mảng trong data. Không dùng cùng một cách đọc response cho mọi endpoint.

Nguồn đối chiếu trong repository:

- backend/src/routes/admin.routes.ts
- backend/src/routes/auth.routes.ts
- backend/src/services/admin.service.ts
- backend/src/services/topic.service.ts
- backend/src/services/word.service.ts
- backend/src/validations/request.schemas.ts
- frontend/services/quiz.ts

## 6. Phần backend cần bổ sung cho thuật toán mới

Đây là giai đoạn riêng, không bắt buộc để bắt đầu web quản lý nội dung.

Hiện quiz mobile chỉ giữ kết quả trong bộ nhớ. API học cũ nhận trạng thái tự đánh giá, nên chưa thể dùng nó làm nguồn thống kê đúng/sai.

Đề xuất mở rộng:

1. Lưu từng lượt trả lời: phiên học, từ/câu hỏi, đáp án đã chọn, kết quả đúng/sai, thời điểm, thứ tự lượt. Không ghi đè lượt trước vì một từ có thể xuất hiện nhiều lần.
2. Lưu hoặc tái tạo được bộ đáp án của câu hỏi. Server tự kiểm tra đáp án; không tin giá trị is_correct do client gửi.
3. Thêm mã lượt trả lời duy nhất để request gửi lại do mất mạng không bị cộng hai lần.
4. Tổng hợp số lần đúng/sai, chuỗi đúng, thời điểm cần ôn theo người dùng và từ.
5. Giữ phiên bản thuật toán hoặc quy tắc chấm để giải thích được thay đổi trong kết quả.
6. Tạo API thống kê quản trị cho từ sai nhiều; hỗ trợ số lượt tối thiểu và khoảng ngày khi triển khai báo cáo nâng cao.
7. Migration giữ dữ liệu cũ; phân biệt rõ kết quả tự đánh giá và kết quả trắc nghiệm mới.

Chưa đặt nút thay đổi thuật toán trên website ở bản đầu. Nếu sau này cần quản trị cấu hình số lần lặp/ngưỡng đạt, phải có API, validation và quy tắc áp dụng cho phiên đang học.

## 7. Trải nghiệm và yêu cầu chất lượng

- Giao diện tiếng Việt, ưu tiên desktop; sidebar thu gọn khi màn hình hẹp.
- Dùng bảng có hàng tiêu đề rõ ràng, ô tìm kiếm và nút thêm ở đầu trang.
- Thêm/sửa chủ đề bằng hộp thoại; từ vựng nhiều trường nên dùng trang riêng.
- Có loading, lỗi kèm thử lại, danh sách trống và không tìm thấy kết quả.
- Nút lưu chống gửi trùng; thông báo thành công chỉ xuất hiện sau khi server xác nhận.
- Form giữ dữ liệu đang nhập khi API lỗi; cảnh báo trước khi rời form đã thay đổi.
- Xác nhận xóa/khóa với tên đối tượng cụ thể; backend quyết định có cho phép hay không.
- Điều khiển bằng bàn phím, nhãn input, focus trong hộp thoại và tương phản dễ đọc.
- CORS cho đúng origin website; không đưa khóa JWT, mật khẩu DB hay tài khoản admin vào mã frontend.
- Khi API trả 403 vì thiếu quyền, hiển thị trang không có quyền; phân biệt với lỗi phiên hết hạn.

## 8. Thứ tự triển khai

### Giai đoạn 1 — Nền tảng và nội dung học

- [ ] Tạo project admin-web độc lập, cấu hình API và cách quản lý phiên.
- [ ] Đăng nhập, kiểm tra vai trò admin, xử lý hết phiên và đăng xuất.
- [ ] Khung web: sidebar, header, điều hướng và trang không có quyền.
- [ ] Quản lý chủ đề: danh sách, thêm/sửa, ẩn/hiện, xóa theo điều kiện.
- [ ] Quản lý từ vựng: danh sách, lọc/tìm, phân trang, thêm/sửa.
- [ ] Form ví dụ, upload ảnh/MP3 và xem/nghe thử.
- [ ] Kiểm tra nội dung tạo trên web xuất hiện đúng trong app người học.

### Giai đoạn 2 — Hoàn thiện quản trị

- [ ] Dashboard dùng số liệu thật.
- [ ] Danh sách người dùng, khóa/mở khóa.
- [ ] Hồ sơ quản trị và đổi mật khẩu.
- [ ] Trang thống kê từ các endpoint sẵn có.
- [ ] Kiểm thử quyền, thao tác lỗi, responsive và build triển khai.

### Giai đoạn 3 — Sau khi quiz lưu được kết quả

- [ ] Migration và API cho từng lượt trả lời đúng/sai.
- [ ] Đồng bộ quiz mobile với backend, xử lý gửi lại request.
- [ ] Báo cáo từ sai nhiều, tỉ lệ đúng và tiến bộ người học.
- [ ] Cân nhắc import từ vựng, xuất báo cáo, nhật ký thao tác quản trị.

## 9. Tiêu chí nghiệm thu bản đầu

1. Người học không truy cập được chức năng quản trị kể cả gọi API trực tiếp.
2. Admin đăng nhập được, tải lại trang có khôi phục phiên và đăng xuất hoạt động.
3. Tạo chủ đề, thêm ít nhất 4 từ với nghĩa khác nhau, xem được nội dung trên mobile.
4. Sửa từ và ví dụ không làm mất dữ liệu ngoài ý muốn; upload lỗi có thông báo cụ thể.
5. Chủ đề ẩn không xuất hiện trong danh sách học công khai.
6. Không xóa được chủ đề/từ bị backend chặn do liên quan dữ liệu học.
7. Khóa/mở khóa người học phản ánh đúng trạng thái và hiệu lực phiên ở backend.
8. Số liệu dashboard phản ánh dữ liệu thật; chưa có dữ liệu thì hiển thị trống hoặc 0 đúng ngữ nghĩa.
9. Mất mạng, token hết hạn và quyền không đủ đều có phản hồi rõ ràng.
10. TypeScript, lint, build và kiểm thử các luồng chính đều qua.

## 10. Bước nên làm ngay

Bắt đầu với **khung web + đăng nhập admin + trang quản lý chủ đề**, sau đó làm **quản lý từ vựng**. Đây là luồng tạo ra giá trị trực tiếp cho app và tận dụng nhiều nhất API đã có. Dashboard và thống kê làm sau khi dữ liệu quản trị đã vận hành ổn định.
