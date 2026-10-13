# Đặc tả nghiệp vụ Wordleaf

## 1. Mục tiêu hệ thống

Wordleaf hỗ trợ học từ vựng tiếng Anh theo chủ đề bằng flashcard và ôn tập bằng câu hỏi. Người học xem nghĩa, phiên âm, ví dụ, nghe phát âm, theo dõi tiến độ và ôn lại từ đã học. Hệ thống dùng hộp Leitner để điều chỉnh ngăn và thời điểm ôn dựa trên câu trả lời.

Hệ thống gồm ứng dụng dành cho người học và website quản trị. Dữ liệu học cá nhân được gắn với tài khoản; khách chưa đăng nhập chỉ được tra cứu và học thử, không lưu kết quả.

## 2. Tác nhân và quyền sử dụng

| Tác nhân | Nghiệp vụ được thực hiện |
| --- | --- |
| Khách | Xem chủ đề, tìm kiếm và xem từ vựng, học thử flashcard tối đa 5 thẻ mỗi lượt. Không lưu phiên, tiến độ, yêu thích hay kết quả. |
| Người học | Quản lý tài khoản cá nhân; học flashcard; ôn tập; tra cứu, yêu thích từ; xem tiến độ, lịch sử và thành tích của mình. |
| Quản trị viên | Quản lý người học, chủ đề, từ vựng, ví dụ, thành tích và xem thống kê hệ thống. |

Mọi dữ liệu cá nhân chỉ được đọc hoặc cập nhật bởi chủ tài khoản. Quyền quản trị được kiểm tra ở phía máy chủ.

## 3. Nghiệp vụ dành cho khách

### 3.1. Xem và tìm nội dung

1. Khách mở danh sách chủ đề đang hiển thị.
2. Khách có thể tìm từ theo tiếng Anh hoặc nghĩa tiếng Việt, xem chi tiết từ và ví dụ.
3. Nội dung học mới chỉ gồm từ và chủ đề đang được bật hiển thị.
4. Nếu không tìm thấy kết quả, hệ thống thông báo danh sách trống.

### 3.2. Học thử flashcard

1. Khách chọn một chủ đề và bắt đầu học thử.
2. Ứng dụng hiển thị tối đa 5 thẻ.
3. Mặt trước hiển thị từ tiếng Anh, phiên âm và từ loại. Mặt sau hiển thị nghĩa tiếng Việt và các ví dụ Anh–Việt.
4. Khách có thể lật thẻ, nghe phát âm bằng giọng đọc tiếng Anh của thiết bị và chuyển giữa các thẻ.
5. Kết thúc lượt học, ứng dụng mời khách đăng nhập để dùng chức năng cá nhân.

Học thử không tạo phiên học và không ghi kết quả hoặc tiến độ vào tài khoản nào.

## 4. Tài khoản người học

- **Đăng ký:** người dùng nhập họ tên, email và mật khẩu. Email phải hợp lệ và chưa được dùng; mật khẩu được lưu dưới dạng đã băm.
- **Đăng nhập:** xác thực bằng email và mật khẩu hoặc tài khoản Google đã được cấu hình. Tài khoản bị khóa không được tạo phiên sử dụng.
- **Hồ sơ:** người học xem và cập nhật thông tin cá nhân, ảnh đại diện và mục tiêu học mỗi ngày.
- **Mục tiêu ngày:** chọn 5, 10 hoặc 20 từ. Mục tiêu này cũng là số từ mới tối đa được chọn cho một phiên flashcard theo chủ đề.
- **Đổi mật khẩu:** người học xác thực mật khẩu hiện tại trước khi đặt mật khẩu mới.
- **Quên mật khẩu:** người dùng yêu cầu mã xác minh qua email rồi đặt lại mật khẩu bằng mã còn hiệu lực.
- **Đăng xuất:** kết thúc phiên đăng nhập hiện tại.

## 5. Học từ bằng flashcard

### 5.1. Bắt đầu hoặc tiếp tục phiên

1. Người học đã đăng nhập chọn chủ đề đang hiển thị.
2. Nếu người học còn phiên flashcard chưa hoàn tất của chủ đề đó, hệ thống trả lại phiên và thứ tự thẻ cũ để tiếp tục.
3. Nếu chưa có phiên đang học, hệ thống chọn ngẫu nhiên các từ đang hiển thị mà người học chưa học. Số lượng không vượt quá mục tiêu cá nhân và số từ mới còn lại trong chủ đề.
4. Nếu không còn từ mới trong chủ đề, hệ thống chọn ngẫu nhiên từ danh sách từ đang hiển thị để người học tiếp tục ôn bằng flashcard.
5. Nếu chủ đề không có từ phù hợp, hệ thống thông báo và không tạo phiên rỗng.

### 5.2. Nội dung và ghi nhận thẻ

- Mặt trước gồm từ tiếng Anh, phiên âm và từ loại.
- Mặt sau gồm nghĩa tiếng Việt, phiên âm, từ loại và ví dụ tiếng Anh kèm bản dịch. Flashcard không hiển thị ảnh minh họa từ.
- Người học có thể phát âm bằng chức năng chuyển văn bản thành giọng nói tiếng Anh của thiết bị; ứng dụng không cần file MP3 cho chức năng này.
- Khi người học xem và chuyển tiếp qua một thẻ, hệ thống ghi nhận thẻ đó đã xem. Gửi lại thao tác không tạo kết quả trùng.
- Từ được ghi nhận đã học lần đầu sẽ vào ngăn 1 và có lịch ôn sau 1 ngày (24 giờ). Từ đã học trước đó không bị đưa về ngăn 1 chỉ vì xem lại flashcard.
- Phiên chỉ được đánh dấu hoàn thành sau khi tất cả thẻ trong phiên đã được xem. Các thẻ đã xem vẫn được lưu tiến độ nếu người học thoát giữa phiên.

## 6. Ôn tập bằng trắc nghiệm và Leitner

### 6.1. Chọn từ ôn

Wordleaf có hai cách bắt đầu:

- **Ôn từ đến hạn:** lấy từ người học đã học, có lịch ôn đến hoặc quá hạn, và nội dung từ/chủ đề vẫn đang hiển thị. Từ quá hạn lâu hơn được ưu tiên. Nếu không có từ đủ điều kiện, ứng dụng thông báo hiện chưa có từ đến hạn và không tạo phiên rỗng.
- **Luyện theo chủ đề:** lấy từ đã học thuộc chủ đề được chọn; ưu tiên từ đã đến hạn nhưng có thể đưa cả từ chưa đến hạn vào phiên luyện theo chủ đề.

Phiên đang làm được tiếp tục thay vì tạo một phiên trùng. Mỗi từ đang thuộc phiên trắc nghiệm chưa kết thúc không được đưa đồng thời vào một phiên mới khác của cùng người học.

### 6.2. Dạng câu hỏi

- Mỗi từ trong phiên được chọn ngẫu nhiên một dạng câu hỏi và giữ nguyên dạng đó khi từ xuất hiện lại.
- Khoảng 20% số từ được chọn làm câu nhập từ; số lượng được làm tròn lên. Với phiên 5, 10 hoặc 20 từ, tương ứng có 1, 2 hoặc 4 câu nhập từ. Các câu còn lại là trắc nghiệm chọn nghĩa.
- Câu trắc nghiệm hiển thị từ tiếng Anh và các nghĩa tiếng Việt để chọn; đáp án được xáo trộn.
- Câu nhập từ hiển thị nghĩa tiếng Việt và yêu cầu gõ từ tiếng Anh. Đáp án được chuẩn hóa Unicode, bỏ khoảng trắng thừa và không phân biệt chữ hoa/chữ thường; nội dung từ vẫn phải khớp chính xác.
- Đáp án đúng chỉ được xác định sau khi máy chủ chấm câu trả lời.

### 6.3. Chấm câu trả lời và điều chỉnh hàng đợi

1. Người học chọn đáp án hoặc nhập từ rồi gửi câu trả lời.
2. Hệ thống lưu lượt trả lời, phản hồi đúng/sai, đáp án chính xác và nghĩa của từ.
3. Trả lời đúng ngay: từ hoàn thành trong phiên, tăng một ngăn Leitner (tối đa ngăn 5) và được lên lịch ôn tiếp theo. Từ đó không xuất hiện lại trong phiên.
4. Trả lời sai: từ được đưa về ngăn 1 và xuất hiện lại ở cuối hàng đợi với cùng dạng câu hỏi. Nếu chỉ còn một từ chưa hoàn thành, từ đó có thể được hỏi lại ngay.
5. Trả lời sai nhiều lần không tiếp tục hạ ngăn hoặc cộng lặp tiến độ cho cùng một từ trong phiên.
6. Trả lời đúng sau khi đã sai: hoàn thành từ trong phiên nhưng giữ ngăn 1; người học cần ôn lại ở lần đến hạn sau.
7. Phiên hoàn thành khi mọi từ đã có câu trả lời đúng ít nhất một lần. Nếu người học dừng phiên, các lượt đã chấm vẫn được giữ trong lịch sử.

Gửi lại cùng một yêu cầu do mất kết nối không được tính thành lượt trả lời hoặc cập nhật tiến độ lần thứ hai.

### 6.4. Quy tắc hộp Leitner

| Ngăn sau khi cập nhật | Khoảng đến lần ôn tiếp theo |
| --- | --- |
| Ngăn 1 | 1 ngày (24 giờ) |
| Ngăn 2 | 2 ngày |
| Ngăn 3 | 4 ngày |
| Ngăn 4 | 7 ngày |
| Ngăn 5 | 14 ngày |

Trả lời đúng ngay chuyển lên một ngăn, tối đa ngăn 5. Trả lời sai chuyển về ngăn 1. Lịch được tính từ thời điểm hệ thống ghi nhận kết quả; đạt ngăn 5 không có nghĩa là từ bị loại khỏi lịch ôn.

## 7. Tra cứu, yêu thích và dữ liệu cá nhân

- Người học tra cứu từ như khách; với từ đã học có thể xem ngăn ghi nhớ và lịch ôn của chính mình.
- Thêm hoặc bỏ yêu thích không làm từ được tính là đã học và không thay đổi ngăn Leitner.
- Người học xem tiến độ tổng thể, tiến độ theo chủ đề, số từ đến hạn, mục tiêu ngày, chuỗi ngày học và lịch sử các phiên.
- Lịch sử gồm phiên flashcard và phiên trắc nghiệm với trạng thái đang học, hoàn thành hoặc đã dừng.
- Thành tích có thể dựa trên số từ đã học, số từ ở ngăn 5, chuỗi ngày học hoặc số phiên hoàn thành. Huy hiệu được cấp khi đạt điều kiện; người học không tự khai kết quả để nhận huy hiệu.
- Ẩn từ hoặc chủ đề ngăn nội dung đó khỏi danh sách học mới và danh sách ôn hiện hành; dữ liệu lịch sử đã ghi nhận được giữ lại.

## 8. Nghiệp vụ quản trị viên

### 8.1. Quản lý người học

Quản trị viên tìm kiếm, lọc trạng thái, xem thông tin và phiên học của người học; có thể khóa, mở khóa hoặc xóa tài khoản theo xác nhận trên giao diện. Khóa tài khoản ngăn đăng nhập nhưng không xóa tiến độ học. Tài khoản quản trị không nằm trong danh sách người học để khóa hoặc xóa.

### 8.2. Quản lý chủ đề

Quản trị viên thêm, sửa, tìm kiếm, lọc, sắp xếp, bật hoặc ẩn chủ đề. Thông tin chủ đề gồm tên, mô tả, trạng thái và thứ tự hiển thị. Tên chủ đề không được để trống hoặc trùng. Giao diện quản trị hiện không yêu cầu ảnh chủ đề. Chủ đề còn từ vựng hoặc lịch sử học không được xóa; quản trị viên có thể ẩn chủ đề.

### 8.3. Quản lý từ vựng và ví dụ

Quản trị viên thêm, sửa, tìm kiếm, lọc, bật hoặc ẩn từ. Thông tin từ gồm chủ đề, từ tiếng Anh, phiên âm, từ loại, nghĩa tiếng Việt, trạng thái và thứ tự hiển thị. Mỗi từ có thể có các ví dụ tiếng Anh kèm bản dịch tiếng Việt. Giao diện quản lý từ không có trường ảnh; ảnh không xuất hiện trên flashcard. Từ đang được tham chiếu bởi tiến độ hoặc lịch sử không được xóa cứng mà cần ẩn.

### 8.4. Quản lý thành tích và thống kê

- Quản trị viên tạo, sửa, bật hoặc tạm ngừng thành tích; theo dõi số người đã đạt và xem danh sách người nhận.
- Website cung cấp số liệu tổng quan về người học, nội dung, phiên học và hoạt động theo thời gian; có thống kê chủ đề/từ được học và kết quả trả lời trắc nghiệm.
- Chỉ tài khoản quản trị viên được xem báo cáo thống kê toàn hệ thống.
