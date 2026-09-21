# Bộ bổ sung 500 từ vựng Wordleaf

20 chủ đề, mỗi chủ đề 25 mục từ mới. Bộ này được biên soạn cho việc học từ thông dụng theo chủ đề; không phải danh sách CEFR được một tổ chức khảo thí chứng nhận. Có một số từ mở rộng như `itinerary`, `ancestor` và `pedestrian`.

Mỗi mục chọn một loại từ và nghĩa phù hợp với chủ đề, có phiên âm IPA rộng theo cách đọc Anh–Mỹ, ví dụ tiếng Anh và bản dịch tiếng Việt tự biên soạn. Các từ nhiều nghĩa không được trình bày như một mục từ điển đầy đủ. `read` là dạng nguyên thể /riːd/, `resume` là danh từ chỉ lý lịch xin việc; `pants`, `soccer`, `airplane`, `theater` dùng theo tiếng Anh–Mỹ. Phiên âm không liệt kê mọi biến thể phát âm.

## Các chủ đề

1. Giao tiếp hàng ngày
2. Gia đình
3. Đồ ăn
4. Động vật
5. Trường học
6. Công việc
7. Du lịch
8. Mua sắm
9. Thời tiết
10. Nhà cửa
11. Quần áo
12. Cơ thể và sức khỏe
13. Thể thao
14. Công nghệ
15. Giao thông
16. Thiên nhiên
17. Cảm xúc và tính cách
18. Thời gian và lịch
19. Hoạt động hằng ngày
20. Nghệ thuật và giải trí

## Cách nạp

Chạy trong thư mục `backend`, với `.env` trỏ đúng MySQL:

```powershell
npm run db:import-vocabulary -- --dry-run
npm run db:import-vocabulary
```

Từ thư mục gốc repo, dùng `npm --prefix backend run db:import-vocabulary`. Database cần được tạo/nâng cấp bằng `npm run db:migrate` trước đó. Không dùng `db:seed` để nạp bộ này vào database đang có dữ liệu.

Script dùng lại chủ đề trùng tên, chỉ thêm từ chưa có ở bất kỳ chủ đề nào, bỏ qua khác biệt viết hoa và khoảng trắng. Không ghi đè nội dung, ẩn/hiện, ví dụ, tài khoản hay tiến trình cũ. Với bộ mẫu 23 từ/9 chủ đề ban đầu, sẽ thêm 500 từ, 500 ví dụ và 11 chủ đề: tổng 523 từ/20 chủ đề. Database khác có thể thêm ít hơn nếu đã có các từ trong bộ này.

Toàn bộ ghi dữ liệu nằm trong một giao dịch; nếu lỗi sẽ hoàn tác toàn bộ lần nạp. Chạy lại không thêm trùng. Trước lần ghi có từ mới, CLI lưu bản chụp ba bảng danh mục `chu_de`, `tu_vung`, `vi_du` trong `backend/backups/`; thư mục này không đưa lên Git. Đây là bản chụp danh mục, không phải bản sao lưu toàn bộ database.

Không tạo URL ảnh/âm thanh giả. Ứng dụng có thể dùng chức năng đọc từ hiện có; ảnh và tệp âm thanh có thể bổ sung qua admin.

## Định dạng dữ liệu

10 file JSON, mỗi file 2 chủ đề. `key` là mã chủ đề ổn định; `ten` là tên dùng để ghép với chủ đề hiện có. Mỗi dòng trong `words` lần lượt là:

```text
[từ tiếng Anh, phiên âm IPA, loại từ, nghĩa tiếng Việt, ví dụ tiếng Anh, bản dịch ví dụ]
```

Loại từ sử dụng đúng enum của backend. ID của từ, ví dụ và chủ đề mới được tạo xác định từ nội dung định danh của bộ dữ liệu; không dùng số thứ tự có thể đụng dữ liệu cũ. Tải lại danh sách trong admin/mobile sau khi nạp để thấy nội dung mới.
