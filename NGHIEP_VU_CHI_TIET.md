# Nghiệp vụ chi tiết — Học từ vựng tiếng Anh qua flashcard

Cập nhật: 29/09/2026. Đối chiếu `BaoCao_BTL_MobileDNT.docx`, từ chương 1 đến hết mục biểu đồ tuần tự của chương 3. Tài liệu này mô tả hành vi của mã nguồn sau đợt đối chiếu, đồng thời chỉ rõ các nội dung trong báo cáo chưa thể coi là đã triển khai.

## 1. Phạm vi và kết quả đối chiếu

Hệ thống gồm ứng dụng người học React Native/Expo SDK 57, web quản trị React/Vite/TypeScript, backend Express/TypeScript và MySQL. Hai phần học chính có mục đích khác nhau:

- **Flashcard:** tiếp cận từ mới, lật thẻ xem nghĩa và ví dụ, nghe phát âm; không tự đánh dấu đã nhớ/chưa nhớ, không chấm đúng sai.
- **Trắc nghiệm:** kiểm tra từ đã học và đến hạn; backend chấm đáp án, cập nhật ngăn Leitner và lịch ôn.

| Nội dung đối chiếu | Trước đợt sửa | Hành vi sau sửa / điểm cần lưu ý |
| --- | --- | --- |
| Học flashcard có tài khoản | Chỉ tải danh sách công khai; xem thẻ chưa tạo phiên, chưa lưu tiến độ | Tạo/tiếp tục phiên từ mới, lưu vị trí đã xem; hoàn thành mới đưa từ vào ngăn 1 |
| Học thử | Có thể xem toàn bộ bộ thẻ | Tối đa 5 thẻ của chủ đề trên giao diện học thử; không lưu phiên hay tiến độ |
| Từ được đưa vào ôn | Trắc nghiệm chủ đề có cả từ chưa học | Chỉ lấy từ đã học và đến hạn, theo chủ đề hoặc toàn bộ chủ đề |
| Câu đúng trong phiên mới | Phải đúng nhiều lượt để hoàn thành một từ | Đúng một lần thì hoàn thành từ trong phiên |
| Câu sai | Chỉ cập nhật tiến độ khi hoàn thành yêu cầu của từ | Sai lần đầu hạ ngăn 1 ngay; đưa xuống cuối hàng đợi và hỏi lại đến khi đúng |
| Khoảng cách ôn | 1–3–7–14–30 ngày | **1–2–4–7–14 ngày**, theo chương 2 |
| Phân nhóm ghi nhớ | Dựa vào trạng thái cũ, chưa khớp các ngăn | Mới học: ngăn 1–2; đang củng cố: ngăn 3–4; đã thuộc: ngăn 5 |
| Thống kê | Tổng theo ngày/tuần/tháng | Bổ sung biểu đồ 1/7/30 ngày và số từ đến hạn; tỷ lệ đã thuộc tính theo ngăn 5 |
| Thành tích | Từ đã học, số phiên, chuỗi ngày | Bổ sung điều kiện số từ ngăn 5; kiểm tra huy hiệu sau hoàn thành flashcard và trả lời trắc nghiệm |
| Quản lý người dùng | Danh sách, xem, khóa/mở khóa | Bổ sung xóa người học có xác nhận; không cho khóa hoặc xóa quản trị viên |
| Trùng tên | Chưa có ràng buộc đủ | Tên chủ đề, tiêu đề thành tích duy nhất; từ tiếng Anh duy nhất trong cùng chủ đề |
| Ảnh từ vựng | Web quản trị có ô ảnh và chỉ báo ảnh | Ẩn ô ảnh và chỉ báo ảnh trong quản lý từ vựng; không hiển thị ảnh trên flashcard; giữ dữ liệu ảnh cũ |
| Đăng nhập Google | Mobile Android gửi Google ID token để backend xác minh và cấp phiên Wordleaf | **Đã tích hợp mã nguồn**, cần nghiệm thu trên development build Android; iOS chưa cấu hình OAuth Client |

### 1.1. Các điểm báo cáo cần chỉnh hoặc làm rõ

1. **Biểu đồ tuần tự flashcard thiếu bước lưu phiên/hoàn thành.** Bổ sung tạo hoặc khôi phục phiên, lưu thẻ đã xem và hoàn thành phiên để phù hợp đặc tả use case. Khách học thử không có các bước ghi database này.
2. **Biểu đồ tuần tự ôn tập còn mô tả thuật toán cũ:** câu đúng quay lại sau, hoàn thành khi đạt nhiều lượt đúng. Phiên mới áp dụng phần đặc tả nghiệp vụ: đúng thì ra khỏi hàng đợi; sai thì về ngăn 1 và hỏi lại. Lưu kết quả mỗi lượt, không đợi đến cuối phiên mới lưu.
3. **Sai rồi đúng lại trong cùng phiên:** từ vẫn ở ngăn 1, không được tăng lên ngăn 2 ngay. Đây là quy tắc thống nhất với yêu cầu đã chốt trước đó, để việc luyện lại không xóa hình phạt của lượt sai. Sang phiên ôn đến hạn tiếp theo, đúng ngay mới tăng ngăn.
4. **Google:** không ghi là đã hoàn thành khi mới có trường `phuong_thuc_dang_nhap` trong bảng người dùng. Hiện đăng nhập thực tế bằng email và mật khẩu.
5. **Lưu token:** ứng dụng native dùng SecureStore; bản xem thử trên web dùng sessionStorage theo tab. Không mô tả hiện trạng là lưu token bằng AsyncStorage.
6. **Ảnh minh họa từ:** các đoạn báo cáo mô tả ảnh ở mặt sau thẻ cần bỏ theo yêu cầu mới nhất. Ảnh chủ đề và ảnh đại diện vẫn là tính năng riêng.
7. **Xóa chủ đề/từ/thành tích:** hệ thống giữ quy tắc bảo vệ dữ liệu tham chiếu. Chủ đề còn từ hoặc phiên học, từ đã được học, thành tích đã có người nhận phải dùng ẩn thay vì xóa. Cần ghi rõ ngoại lệ này trong use case, không chỉ ghi “xác nhận là xóa”.
8. **Sơ đồ use case và đăng nhập:** đăng nhập là tiền điều kiện cho nghiệp vụ cá nhân; không phải mỗi lần lật thẻ hay trả lời đều gọi đăng nhập lại. Tra cứu công khai không bắt buộc đăng nhập.
9. Mục lục/danh sách bảng, hình còn có nội dung từ mẫu quản lý nhân sự. Phần cơ sở dữ liệu phía sau các biểu đồ tuần tự cũng còn nội dung mẫu; phần này nằm ngoài phạm vi đối chiếu lần này. Không đưa nghiệp vụ nhân sự vào ứng dụng từ vựng.
10. Dòng đặc tả báo cáo thống kê quản trị còn thiếu nội dung chi tiết; sử dụng mục 5.5 dưới đây để bổ sung. Phát âm dùng giọng đọc tiếng Anh của thiết bị qua Expo Speech, không quản lý file MP3.

File Word gốc được dùng làm tài liệu tham chiếu, chưa chỉnh sửa trực tiếp trong đợt này.

## 2. Tác nhân và phân quyền

| Nghiệp vụ | Khách chưa đăng nhập | Người học đã đăng nhập | Quản trị viên |
| --- | --- | --- | --- |
| Xem chủ đề, tìm từ, xem chi tiết công khai | Có | Có | Có |
| Học thử flashcard | Tối đa 5 thẻ/lượt, không lưu | Dùng luồng học có lưu | Có thể xem nội dung |
| Học từ mới, ôn tập, lưu kết quả | Không | Có, trên dữ liệu của mình | Quyền quản trị không thay cho người học trả lời |
| Yêu thích, tiến độ, lịch sử, huy hiệu | Không | Có, trên dữ liệu của mình | Quản lý nội dung và xem số liệu tổng hợp |
| Quản lý người dùng/chủ đề/từ/thành tích | Không | Không | Có |

Backend lấy ID người dùng từ JWT đã xác thực. Không tin `userId` do client truyền để chọn chủ sở hữu dữ liệu. Người dùng không thể đọc hoặc sửa phiên học của người khác; truy cập phiên không thuộc mình trả 404. Các API admin kiểm tra vai trò phía server, không chỉ ẩn nút trên giao diện.

## 3. Nghiệp vụ khách

### 3.1. Xem chủ đề

- Hiển thị chủ đề đang bật, mô tả, số từ đang bật và thứ tự hiển thị.
- Chỉ từ mà cả từ và chủ đề đều bật mới xuất hiện trong danh mục công khai.
- Chủ đề trống hiển thị trạng thái không có từ; không tạo phiên học trống.

### 3.2. Tìm kiếm và xem chi tiết từ

- Nhập từ khóa tiếng Anh hoặc nghĩa tiếng Việt; có thể lọc theo chủ đề.
- Kết quả có phân trang. Không có kết quả thì thông báo rõ, không coi là lỗi hệ thống.
- Chi tiết gồm từ tiếng Anh, nghĩa, phiên âm, từ loại, chủ đề và câu ví dụ Anh–Việt; có nút nghe phát âm.
- Khách không thấy tiến độ của người khác và không lưu yêu thích. Khi chọn chức năng yêu thích/ôn tập, giao diện dẫn đến đăng nhập.

### 3.3. Học thử flashcard

1. Chọn một chủ đề đang hiển thị.
2. Giao diện tải danh sách công khai và lấy tối đa 5 từ đầu để học thử.
3. Lật thẻ, xem nghĩa/ví dụ, nghe phát âm, chuyển thẻ trước/sau.
4. Kết thúc hiển thị lời mời đăng nhập.

**Không ghi** phiên học, kết quả, ngăn Leitner, mục tiêu ngày, chuỗi ngày hay huy hiệu cho khách. Giới hạn 5 thẻ là giới hạn trải nghiệm học thử trên UI; API danh mục vẫn công khai để phục vụ tìm kiếm và xem chi tiết, không phải cơ chế bảo mật nội dung từ vựng.

## 4. Nghiệp vụ người học

### 4.1. Tài khoản

- Đăng ký: họ tên, email, mật khẩu; kiểm tra dữ liệu, email duy nhất, lưu mật khẩu đã băm bằng bcrypt. Email được chuẩn hóa chữ thường.
- Đăng nhập: kiểm tra mật khẩu và trạng thái tài khoản, cấp access token và refresh token.
- Refresh: kiểm tra token còn hạn/chưa thu hồi và tài khoản còn hoạt động. Access token và refresh token không dùng thay thế cho nhau.
- Hồ sơ: cập nhật họ tên, ảnh đại diện và mục tiêu 5/10/20 từ mỗi ngày.
- Đổi mật khẩu: nhập đúng mật khẩu cũ; sau thay đổi thu hồi các phiên đăng nhập cũ.
- Quên mật khẩu: yêu cầu mã qua email; mã 6 chữ số có hạn 10 phút và giới hạn số lần thử; mã đã dùng không dùng lại được. Khi chạy phát triển chưa cấu hình gửi email, mã thử nghiệm có thể được trả về theo cấu hình; không coi đây là gửi email thành công.
- Đăng xuất: thu hồi refresh token và xóa phiên phía client. Các API kiểm tra tài khoản bị khóa và phiên bị thu hồi.
- Google OAuth đã có luồng Android và backend; chỉ ghi đã nghiệm thu sau khi thử development build bằng tài khoản Google thật.

### 4.2. Học flashcard

**Tiền điều kiện:** đăng nhập, tài khoản hoạt động, chủ đề đang hiển thị.

1. Người học chọn Học bằng flashcard.
2. Backend tìm phiên flashcard đang học của chính người dùng trong chủ đề. Nếu có, trả lại danh sách/thứ tự và dấu đã xem để tiếp tục; không tạo phiên mới vì tải lại màn hình.
3. Nếu chưa có phiên, chọn **chỉ từ chưa học**, đang hiển thị, theo thứ tự nội dung. Số từ tối đa bằng mục tiêu cá nhân 5, 10 hoặc 20. Nếu còn ít hơn, học số từ còn lại; không yêu cầu chủ đề phải có ít nhất 5 từ.
4. Lưu `phien_hoc_tap` với phương thức `flashcard` và danh sách `phien_hoc_tu` cố định.
5. Mặt trước: từ tiếng Anh, phiên âm, từ loại. Mặt sau: nghĩa, từ loại, từ tiếng Anh, phiên âm và các ví dụ Anh–Việt; **không có ảnh minh họa từ**. Lật thẻ có hiệu ứng, hai mặt khác màu; hỗ trợ giảm chuyển động.
6. Người học phải lật thẻ trước khi bấm Tiếp theo/Học xong. Nút này ghi dấu đã xem vào server theo thứ tự. Gửi lại cùng thẻ không ghi trùng; có thể quay lại thẻ đã xem.
7. Sau thẻ cuối, yêu cầu hoàn thành. Backend kiểm tra đã xem đủ mọi thẻ, lưu kết quả trung tính `da-xem`, đánh dấu từ mới đã học, đặt ngăn 1 và lịch ôn sau 1 ngày. Học flashcard không cộng số lần ôn trắc nghiệm.
8. Ghi hoàn thành phiên, hoạt động học và kiểm tra thành tích. UI chỉ báo thành công khi server phản hồi thành công.

**Ngoại lệ:**

- Không còn từ mới: thông báo đã học hết và hướng người học đến mục ôn từ đến hạn.
- Mất mạng khi ghi: giữ thẻ hiện tại, thông báo và cho gửi lại; không giả lập lưu thành công.
- Thoát giữa chừng: giữ phiên và các dấu đã xem trên server; lần mở lại tiếp tục ở thẻ chưa được lưu. Chưa hoàn thành thì chưa đưa các từ của phiên vào tiến độ đã học.
- Xem lại bộ thẻ sau khi đã hoàn thành trên cùng màn hình: không tạo thêm kết quả và không hạ ngăn của từ đã học.
- Thêm yêu thích từ flashcard: ghi yêu thích riêng, không tự tạo tiến độ “đã học”.

### 4.3. Ôn tập theo Leitner

**Nguồn từ:** từ có `da_hoc = TRUE`, `ngay_on_tap_tiep_theo <= thời điểm hiện tại`, từ và chủ đề đều bật. Có thể chọn ôn trong một chủ đề hoặc ôn tất cả chủ đề. Không lấy từ chưa học để thay thế khi hết từ đến hạn.

**Tạo phiên:**

- Mỗi yêu cầu chọn từ 1–50, UI thường chọn tối đa 20; số thực nhận không vượt số từ đủ điều kiện.
- Ưu tiên hạn ôn cũ nhất. Từ đang thuộc một phiên trắc nghiệm chưa kết thúc của chính người học không được đưa vào phiên mới khác.
- Nếu không có từ phù hợp, trả `NO_REVIEW_WORDS` và không tạo phiên trống.
- Chụp nội dung từ, dạng câu hỏi và đáp án tại lúc tạo phiên. Việc admin sửa nghĩa sau đó không làm đổi câu đã tạo.
- Chọn ngẫu nhiên `ceil(số từ thực nhận × 20%)` từ làm câu nhập đáp án; các từ còn lại là trắc nghiệm. Ví dụ phiên 5, 10 và 20 từ lần lượt có 1, 2 và 4 câu nhập. Dạng câu của mỗi từ được giữ nguyên trong suốt phiên.
- Câu trắc nghiệm cần ít nhất hai nghĩa khác nhau; có tối đa bốn lựa chọn và một đáp án đúng. Các đáp án được xáo trộn; thứ tự từ ôn vẫn ưu tiên hạn cũ, không chọn ngẫu nhiên hoàn toàn.
- Câu nhập từ hiển thị nghĩa tiếng Việt và từ loại, không gửi từ tiếng Anh hoặc phiên âm trước khi chấm.
- `ma_yeu_cau` khởi tạo giúp thử lại sau mất mạng nhận cùng phiên, không tạo phiên trùng.

**Mỗi lượt trả lời:**

1. Server trả loại câu hỏi. Câu trắc nghiệm có các lựa chọn; câu nhập từ có nghĩa tiếng Việt. Chưa gửi đáp án đúng.
2. Người học chọn một lựa chọn hoặc nhập từ tiếng Anh; client gửi ID câu hỏi, một trong hai trường `lua_chon_id`/`cau_tra_loi` và mã yêu cầu duy nhất.
3. Backend kiểm tra quyền sở hữu, phiên còn mở, câu chưa được chấm và dữ liệu đúng với loại câu. Câu nhập từ được chuẩn hóa Unicode, bỏ khoảng trắng thừa và không phân biệt chữ hoa/thường, sau đó so khớp chính xác với từ tiếng Anh.
4. Lưu lịch sử lượt trả lời. Gửi lặp đúng mã và đúng nội dung trả lại phản hồi cũ; cùng mã nhưng nội dung khác bị từ chối.
5. Đúng ngay: hoàn thành từ trong phiên, tăng một ngăn, tối đa ngăn 5; từ không hỏi lại trong phiên đó.
6. Sai: lần sai đầu tiên trong phiên hạ từ về ngăn 1 ngay và hẹn ôn sau 1 ngày; đưa từ xuống cuối hàng đợi với cùng dạng câu hỏi. Nếu chỉ còn một từ, có thể hỏi lại ngay.
7. Sai tiếp: tiếp tục đưa xuống cuối; không tăng số lần ôn/ngăn nhiều lần cho cùng từ trong cùng phiên.
8. Đúng sau một hoặc nhiều lần sai: hoàn thành từ, nhưng **giữ ngăn 1** trong phiên đó.
9. Khi mọi từ đều đã trả lời đúng ít nhất một lần, phiên tự hoàn thành. Kết quả có số từ hoàn thành, số từ đúng ngay, số từ phải luyện lại, tổng lượt trả lời, lượt đúng và tỷ lệ đúng.

**Lịch ôn:**

| Ngăn sau cập nhật | Thời gian đến lần ôn tiếp theo | Nhóm trên giao diện |
| --- | --- | --- |
| 1 | 1 ngày | Mới học |
| 2 | 2 ngày | Mới học |
| 3 | 4 ngày | Đang củng cố |
| 4 | 7 ngày | Đang củng cố |
| 5 | 14 ngày | Đã thuộc |

Lịch tính từ thời điểm ghi nhận kết quả, theo khoảng thời gian thực (ngày = 24 giờ). Đạt ngăn 5 vẫn phải ôn; trả lời sai ở ngăn 5 vẫn về ngăn 1. Đây là lặp lại ngắt quãng theo quy tắc Leitner, không phải mô hình AI học máy và không bảo đảm một tỷ lệ ghi nhớ thực nghiệm.

**Thoát và tiếp tục:** “Lưu để học sau” giữ phiên đang làm; “Dừng phiên” chuyển sang bỏ dở. Cả hai giữ các lượt đã chấm. Từ đã trả lời sai vẫn ở ngăn 1 dù thoát trước khi trả lời đúng lại. Client giữ câu đang chờ gửi để thử lại khi kết nối phục hồi.

**Tương thích:** phiên mới có phiên bản `leitner-queue-v2`. Phiên `leitner-adaptive-v1` đang tồn tại tiếp tục quy tắc cũ để không diễn giải lại lịch sử giữa chừng. Không đổi hàng loạt lịch ôn đã lưu; khoảng cách 1–2–4–7–14 áp dụng khi ghi nhận lịch mới.

### 4.4. Tra cứu và yêu thích

- Tra cứu như khách; khi có token, chi tiết bổ sung ngăn Leitner và ngày ôn tiếp theo của chính người dùng, hoặc “Chưa học”.
- Thêm/bỏ yêu thích có thể thực hiện lại an toàn. Mỗi cặp người dùng–từ chỉ có một bản ghi yêu thích.
- Yêu thích không đồng nghĩa đã học, không tăng mục tiêu ngày, số phiên hoặc huy hiệu học tập.
- Từ/chủ đề bị ẩn không xuất hiện trong danh sách yêu thích công khai, nhưng bản ghi yêu thích vẫn được giữ. Bật lại thì có thể hiển thị lại.

### 4.5. Tiến độ, mục tiêu và lịch sử

- Tổng từ đã học: số từ riêng biệt đã hoàn thành học; không đếm số lượt lật thẻ hoặc số lượt đoán.
- Nhóm ghi nhớ lấy từ ngăn Leitner: 1–2, 3–4, 5. Tỷ lệ đã thuộc = số từ ngăn 5 / tổng từ đã học × 100%; chưa học từ nào thì 0%.
- Hôm nay/tuần này/tháng này: số từ riêng biệt có kết quả học hoặc ôn hoàn tất cho từ trong khoảng tương ứng. Một từ chỉ tính một lần trong mỗi khoảng.
- Biểu đồ 1/7/30 ngày: số từ riêng biệt mỗi ngày; ngày không hoạt động hiển thị 0. Cùng một từ ôn ở nhiều ngày có thể xuất hiện ở nhiều cột.
- Mục tiêu 5/10/20 là chỉ tiêu ngày và giới hạn từ mới của mỗi phiên flashcard, không cấm học thêm khi đã đạt mục tiêu.
- Chuỗi ngày: tính các ngày có phiên hoàn thành theo giờ Việt Nam UTC+7, dựa trên thời điểm hoàn thành. Nếu hôm nay chưa học nhưng hôm qua có học thì chuỗi vẫn còn; bỏ qua một ngày đầy đủ làm đứt chuỗi.
- Theo chủ đề: tổng từ đang bật, số từ đã học, số từ ngăn 5, số từ đến hạn.
- Lịch sử có phiên flashcard và trắc nghiệm, trạng thái đang học/hoàn thành/đã dừng. Lịch sử cá nhân không truy cập được bằng ID phiên của người khác.
- Số liệu tổng học cá nhân giữ dữ liệu lịch sử kể cả khi admin ẩn nội dung; danh mục học mới và danh sách ôn chỉ chọn nội dung đang bật.

### 4.6. Thành tích và huy hiệu

- Điều kiện hiện hỗ trợ: số từ đã học (`learned_words`), số từ ngăn 5 (`mastered_words`), chuỗi ngày học (`streak`), số phiên hoàn thành (`completed_sessions`, giữ để tương thích thành tích cũ).
- Hệ thống kiểm tra sau khi hoàn thành flashcard, sau lượt trả lời trắc nghiệm và khi mở trang thành tích.
- Đạt mốc thì ghi thời điểm mở khóa; cùng người dùng–thành tích chỉ được ghi một lần. Người học không tự gửi “đã đạt” lên để nhận huy hiệu.
- Huy hiệu đã nhận được giữ khi chuỗi ngày giảm hoặc một từ rớt ngăn. Điểm thưởng là tổng điểm các huy hiệu đã mở, không phải điểm tự cộng mỗi lần tải lại.
- Huy hiệu chưa đạt hiển thị tiến độ hiện tại/mốc; huy hiệu đã ẩn không cấp mới, người đã nhận vẫn xem được lịch sử của mình.

## 5. Nghiệp vụ quản trị viên

### 5.1. Quản lý người dùng

- Tìm theo tên/email, lọc trạng thái, phân trang; xem thông tin người học và số phiên.
- Khóa/mở khóa có xác nhận. Khóa thu hồi phiên đăng nhập nhưng giữ dữ liệu học.
- Xóa có hộp xác nhận riêng, nói rõ mất vĩnh viễn tài khoản và dữ liệu liên quan: token, phiên, kết quả, tiến độ, yêu thích, huy hiệu.
- Backend không cho khóa hoặc xóa tài khoản có vai trò admin, kể cả gọi API trực tiếp. Danh sách quản lý người học chỉ chứa vai trò `user`.

### 5.2. Quản lý chủ đề

- Thêm/sửa tên, mô tả, ảnh chủ đề, trạng thái và thứ tự.
- Tên không rỗng và không trùng. Kiểm tra trùng bằng ràng buộc MySQL, tránh hai yêu cầu đồng thời cùng tạo tên.
- Ẩn chủ đề ngăn nội dung bên trong xuất hiện trong danh mục học mới.
- Xóa chỉ khi chủ đề chưa chứa từ và chưa có phiên liên quan; nếu đã dùng, trả 409 và đề nghị ẩn.

### 5.3. Quản lý từ và ví dụ

- Tìm kiếm/lọc chủ đề, lọc trạng thái, phân trang; thêm/sửa/ẩn/xóa.
- Bắt buộc chủ đề, từ tiếng Anh, nghĩa tiếng Việt và từ loại hợp lệ. Từ tiếng Anh không trùng trong cùng chủ đề; có thể tồn tại ở chủ đề khác.
- Có phiên âm và thứ tự; mỗi từ có tối đa 20 ví dụ, mỗi ví dụ gồm câu Anh và bản dịch Việt.
- Lưu từ và các ví dụ trong cùng giao dịch; lỗi một bước thì không lưu nửa chừng.
- Khi cập nhật không gửi `vi_du`, giữ ví dụ cũ; gửi `vi_du: []` nghĩa là chủ động xóa danh sách ví dụ.
- **Không còn ô nhập/tải ảnh từ hay chỉ báo ảnh trong bảng quản lý từ.** Payload form không gửi `url_hinh_anh`, nên ảnh cũ không bị xóa khi sửa nghĩa hoặc ví dụ. Trường DB/API được giữ để tương thích dữ liệu cũ; không đồng nghĩa ứng dụng đang hiển thị ảnh này.
- Chỉ xóa từ chưa có dữ liệu học hoặc thuộc phiên đã tạo; từ đang được tham chiếu thì dùng ẩn. Ẩn không xóa lịch sử và câu hỏi đã chụp nội dung.
- Flashcard và chi tiết từ phát âm trực tiếp bằng giọng đọc tiếng Anh của thiết bị qua Expo Speech. Quản trị viên không phải tải MP3; lỗi giọng đọc được thông báo trên giao diện.

### 5.4. Quản lý thành tích

- Danh sách có tìm kiếm, lọc điều kiện/trạng thái, số người đạt; xem danh sách người nhận.
- Thêm/sửa tiêu đề, mô tả, biểu tượng, điểm, loại điều kiện, mốc và trạng thái. Tiêu đề duy nhất, mốc nguyên dương, điểm không âm.
- Thành tích chưa có người nhận: được sửa điều kiện/điểm hoặc xóa có xác nhận.
- Thành tích đã có người nhận: không thay điều kiện/điểm, không xóa cứng; vẫn sửa mô tả/trạng thái. Tạo thành tích mới khi cần quy tắc mới.

### 5.5. Báo cáo thống kê

- Dashboard: tổng người học, chủ đề, từ vựng, phiên học, phiên đang học; người dùng mới và số phiên theo ngày trong 7 ngày gần nhất.
- Thống kê nội dung: chủ đề được học nhiều, từ được học nhiều, hoạt động theo thời gian.
- Thống kê trắc nghiệm: tổng lượt, lượt đúng/sai, tỷ lệ đúng, từ cần luyện theo đáp án đã được backend chấm; có lọc ngày và số lượt tối thiểu.
- Không suy ra “đúng” từ lượt lật flashcard hoặc dữ liệu tự đánh giá cũ. Không đưa kết quả đoán chưa được server chấm vào tỷ lệ đúng.
- Số liệu quản trị là số liệu hệ thống, chỉ tài khoản admin được truy cập.

## 6. Luồng tuần tự rút gọn để sửa báo cáo

### Học flashcard có tài khoản

```text
Người học -> Form_HocFlashcard: Chọn chủ đề
Form -> Ctrl_HocFlashcard: Tạo/tiếp tục phiên(topicId)
Ctrl -> CSDL: Lấy phiên cũ hoặc chọn từ chưa học, lưu phiên và danh sách
CSDL --> Ctrl --> Form: Danh sách từ, ví dụ, vị trí đã xem
alt [Có từ]
  loop [Các thẻ trong phiên]
    Người học -> Form: Lật thẻ / nghe phát âm
    Form --> Người học: Nghĩa, phiên âm, từ loại, ví dụ / giọng đọc
    Người học -> Form: Tiếp theo hoặc Học xong
    Form -> Ctrl -> CSDL: Lưu dấu đã xem (không ghi trùng)
  end
  Form -> Ctrl -> CSDL: Hoàn thành phiên, từ mới vào ngăn 1, hẹn ôn +1 ngày
  Ctrl --> Form --> Người học: Đã lưu kết quả, xem tiến độ/từ đến hạn
else [Không có từ mới]
  Ctrl --> Form --> Người học: Đã học hết, chuyển sang ôn từ đến hạn
end
```

### Ôn tập từ vựng

```text
Người học -> Form_OnTap: Chọn ôn chủ đề hoặc ôn các từ đến hạn
Form -> Ctrl_OnTap -> CSDL: Tạo phiên từ đã học và đến hạn, chọn 20% câu nhập từ, chụp nội dung
alt [Có từ phù hợp]
  loop [Còn từ chưa hoàn thành]
    Ctrl --> Form --> Người học: Câu trắc nghiệm hoặc câu nhập từ
    Người học -> Form -> Ctrl: Chọn đáp án hoặc nhập từ tiếng Anh
    Ctrl -> CSDL: Chấm và lưu lượt trả lời, cập nhật tiến độ
    alt [Đúng ngay]
      Ctrl -> CSDL: Tăng một ngăn (tối đa 5), lập lịch; loại từ khỏi hàng đợi
    else [Sai]
      Ctrl -> CSDL: Sai lần đầu về ngăn 1, hẹn +1 ngày
      Ctrl -> Ctrl: Đưa từ xuống cuối hàng đợi
    else [Đúng sau khi từng sai]
      Ctrl -> Ctrl: Giữ ngăn 1, loại từ khỏi hàng đợi
    end
    Ctrl --> Form --> Người học: Phản hồi và câu tiếp theo
  end
  Ctrl -> CSDL: Hoàn thành phiên
  Ctrl --> Form --> Người học: Tổng kết phiên
else [Không có từ đến hạn]
  Ctrl --> Form --> Người học: Chưa có từ cần ôn
end
```

Trong biểu đồ UML thực tế, `Ctrl -> CSDL` có thể thay bằng các lifeline entity `PhienHocTap`, `CauHoiTracNghiem`, `TienDoTuVung` theo mô hình lớp; không để Form trực tiếp chấm đáp án hoặc tự sửa ngăn.

## 7. API chính theo vai trò

Đường dẫn dưới đây tính từ `/api`. Phần cá nhân dùng `Authorization: Bearer <accessToken>`; backend tự lấy người dùng từ token.

| Nhóm | Phương thức và đường dẫn | Mục đích |
| --- | --- | --- |
| Công khai | `GET /topics`, `GET /topics/:id` | Chủ đề đang bật |
| Công khai | `GET /words?topicId=...`, `GET /words?search=...`, `GET /words/:id` | Danh mục, tìm kiếm, chi tiết và ví dụ |
| Tài khoản | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` | Đăng ký, đăng nhập, làm mới phiên |
| Tài khoản | `GET /auth/me`, `PUT /auth/profile`, `POST /auth/change-password`, `POST /auth/logout` | Hồ sơ, đổi mật khẩu, đăng xuất |
| Tài khoản | `POST /auth/forgot-password`, `POST /auth/reset-password` | Yêu cầu mã và đặt lại mật khẩu |
| Flashcard | `POST /learning/flashcards/start` | Body: `{"chu_de_id":"<topicId>"}`; tạo/tiếp tục phiên |
| Flashcard | `POST /learning/flashcards/view` | Body: `{"phien_hoc_tap_id":"<sessionId>","tu_vung_id":"<wordId>"}`; lưu đã xem |
| Flashcard | `POST /learning/flashcards/complete` | Body: `{"phien_hoc_tap_id":"<sessionId>"}`; kiểm tra đủ thẻ và hoàn thành |
| Trắc nghiệm | `POST /quiz/start` | Body: `{"chu_de_id":"<topicId>","tong_so_tu":5,"ma_yeu_cau":"<UUID>"}`; ôn từ đến hạn trong chủ đề |
| Trắc nghiệm | `POST /quiz/review/start` | Body: `{"tong_so_tu":20,"ma_yeu_cau":"<UUID>"}`; ôn đến hạn mọi chủ đề |
| Trắc nghiệm | `GET /quiz/:sessionId` | Lấy câu đang làm, không lộ đáp án đúng trước khi chấm |
| Ôn tập | `POST /quiz/:sessionId/answers` | Trắc nghiệm gửi `lua_chon_id`; câu nhập từ gửi `cau_tra_loi`; luôn kèm `cau_hoi_id` và `ma_yeu_cau` |
| Trắc nghiệm | `POST /quiz/:sessionId/stop` | Dừng phiên, giữ lượt đã chấm |
| Cá nhân | `GET /progress`, `GET /progress/topics`, `GET /learning/review` | Thống kê, theo chủ đề, danh sách từ đến hạn |
| Cá nhân | `GET /history`, `GET /history/:sessionId`, `GET /learning/result/:sessionId` | Lịch sử, kết quả và thẻ đã xem |
| Cá nhân | `GET /favorites`, `PUT /favorites/:wordId`, `DELETE /favorites/:wordId` | Danh sách, thêm và bỏ yêu thích |
| Cá nhân | `GET /achievements`, `GET /home/dashboard` | Huy hiệu và trang chủ |
| Admin web | `POST /web-auth/login`, `/web-auth/refresh`, `/web-auth/logout` | Phiên quản trị với refresh cookie HttpOnly và kiểm tra nguồn yêu cầu |
| Admin | `GET /admin/users`, `PUT /admin/users/:userId/status`, `DELETE /admin/users/:userId` | Danh sách, trạng thái, xóa người học |
| Admin | `GET/POST /admin/topics`, `PUT/DELETE /admin/topics/:id` | Quản lý chủ đề |
| Admin | `GET/POST /admin/words`, `PUT/DELETE /admin/words/:id` | Quản lý từ và ví dụ |
| Admin | `GET/POST /admin/achievements`, `PUT/DELETE /admin/achievements/:id`, `GET /admin/achievements/:id/recipients` | Quản lý thành tích |
| Admin | `GET /admin/dashboard`, `/admin/statistics`, `/admin/quiz-statistics` | Báo cáo |

`POST /learning/start` và `/learning/review/start` đã đóng, trả 410 để không tạo phiên tự đánh giá mới. `/learning/result` chỉ phục vụ các phiên `danh_gia` cũ; không nhận kết quả tự khai cho phiên flashcard/trắc nghiệm. Các API cũ còn cần thiết để đọc/hoàn tất lịch sử được giữ tương thích.

## 8. Dữ liệu và tính nhất quán

- `nguoi_dung`: tài khoản, vai trò, trạng thái, mục tiêu ngày.
- `chu_de`, `tu_vung`, `vi_du`: nội dung học và ví dụ song ngữ.
- `phien_hoc_tap`: chủ sở hữu, chủ đề có thể rỗng khi ôn nhiều chủ đề, loại/phương thức/phiên bản thuật toán, trạng thái, thời gian.
- `phien_hoc_tu`: danh sách/thứ tự cố định, dấu đã xem flashcard, nội dung trắc nghiệm chụp tại lúc bắt đầu.
- `cau_hoi_trac_nghiem`: từng lần hỏi, lựa chọn, đáp án đúng, lựa chọn người học, đúng/sai và mã yêu cầu chống ghi trùng.
- `ket_qua_hoc`: kết quả theo từ trong phiên. `da-xem` là đã hoàn tất học flashcard, không phải trả lời đúng. Các trạng thái cũ vẫn lưu để tương thích.
- `tien_do_tu_vung`: mỗi cặp người dùng–từ có một tiến độ, ngăn Leitner, số phiên ôn đã tác động và lịch ôn tiếp theo.
- `yeu_thich`, `thanh_tich`, `thanh_tich_nguoi_dung`, `hoat_dong_hoc_tap`: nội dung cá nhân và ghi nhận hoạt động.

Ghi kết quả và tiến độ trong transaction. Khóa theo người học khi thao tác phiên để tránh retry đồng thời tăng kết quả hai lần. Câu hỏi và kết quả không được chuyển sang chủ sở hữu khác bằng tham số từ client. Migration không xóa dữ liệu mẫu hoặc lịch sử.

Migration `010-report-learning.js` bổ sung phương thức `flashcard`, kết quả `da-xem`, dấu `da_xem_luc` và các khóa duy nhất. Nếu database khác có tên trùng, migration báo lỗi để chủ dữ liệu xử lý; không tự gộp/xóa bản ghi.

## 9. Kiểm thử và chạy thử

1. Chạy MySQL; trong `backend`: `npm run db:migrate`, sau đó `npm run dev`.
2. Trong `frontend`: `npm run web -- --port 8081`; web admin chạy `npm run dev` trong `admin-web`.
3. API mặc định cổng 5000; Swagger `/api-docs`, JSON `/api-docs.json`; `/health` kiểm tra process, `/ready` kiểm tra database. Cấu hình API ở `.env.local` riêng mỗi máy, không đưa IP Wi-Fi cá nhân lên Git.
4. Mở khách: thử 5 flashcard và tra từ; các API ghi phiên/yêu thích phải trả 401 nếu không có token.
5. Đăng nhập, chọn mục tiêu 5: học phiên tối đa 5 từ mới. Thoát giữa chừng rồi vào lại phải tiếp tục cùng phiên. Học xong mới tăng tiến độ, mới có lịch ôn +1 ngày.
6. Từ chưa đến hạn không được đưa vào quiz. Khi kiểm thử tự động, dùng database riêng để đặt ngày đến hạn quá khứ; không sửa ngày dữ liệu người dùng thật chỉ để demo.
7. Ôn: kiểm tra đúng tỷ lệ 20% câu nhập từ; đúng một lần hoàn thành từ; sai đưa về ngăn 1 và hỏi lại cuối hàng đợi với cùng dạng câu; đúng sau sai không nâng ngăn. Thử mất mạng/gửi lại không cộng trùng.
8. Admin: kiểm tra không có ô ảnh từ; sửa ví dụ vẫn hiện mặt sau thẻ; tạo trùng bị từ chối; không xóa được admin; hộp xóa người học phải nêu rõ dữ liệu bị xóa.
9. Bộ test backend tạo database tên ngẫu nhiên riêng và dọn đúng database đó. Lệnh chuẩn (Node 24 trở lên): `npm test` trong backend. Frontend: `npm run typecheck`, `npm run lint`, `npm test`; admin: `npm run build`.

Chưa nghiệm thu trên thiết bị iOS/Android thật trong đợt đối chiếu này. Google OAuth Android đã tích hợp mã nguồn nhưng vẫn cần thử development build; iOS cần tạo thêm OAuth Client trước khi nghiệm thu.
