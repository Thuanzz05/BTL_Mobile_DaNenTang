# Gửi mã đặt lại mật khẩu qua Resend

Backend đã có phần gửi email bằng HTTP, không cần cài thêm SDK. Hiện chưa cấu hình tài khoản gửi; API quên mật khẩu không đồng nghĩa email đã được gửi thành công.

## Chuẩn bị

1. Tạo tài khoản tại [Resend](https://resend.com/).
2. Thêm tên miền gửi trong mục Domains và xác minh các bản ghi DNS theo hướng dẫn. Dùng địa chỉ gửi thuộc tên miền đã xác minh.
3. Tạo API key có quyền gửi email và lưu riêng trên máy.

Resend yêu cầu API key và tên miền đã xác minh để gửi từ tên miền của bạn. Xem [hướng dẫn chính thức](https://resend.com/docs/send-with-nodejs).

## Điền cấu hình

Mở `backend/.env` và điền bằng thông tin thực tế:

```dotenv
RESEND_API_KEY=<API key của bạn>
PASSWORD_RESET_FROM=Wordleaf <no-reply@ten-mien-cua-ban>
PASSWORD_RESET_EXPOSE_CODE=false
```

Không dùng nguyên địa chỉ ví dụ. Không đưa API key vào chat, mã nguồn hoặc Git. File `.env` đã được bỏ qua bởi Git.

Khởi động lại backend sau khi sửa cấu hình.

## Kiểm tra qua ứng dụng

1. Dùng tài khoản người học đã đăng ký bằng email bạn kiểm soát.
2. Mở **Quên mật khẩu**, gửi yêu cầu và kiểm tra hộp thư/spam.
3. Nhập mã 6 số, đặt mật khẩu mới, đăng nhập lại.
4. Kiểm tra mã đã dùng không dùng lại được, mật khẩu cũ không đăng nhập được.

Mã có hiệu lực 10 phút theo code hiện tại. Backend trả thông báo chung để không tiết lộ một email có tài khoản hay không; phản hồi thành công của endpoint không chứng minh thư đã đến hộp thư. Nếu chưa nhận được, kiểm tra cấu hình và nhật ký gửi trên Resend.

Chưa có tài khoản Resend/tên miền: vẫn có thể chạy các kiểm thử backend tự động. Chưa thể xác nhận luồng nhận email thật cho đến khi điền cấu hình. Cơ chế trả mã phát triển qua `PASSWORD_RESET_EXPOSE_CODE` chỉ dành cho môi trường phát triển tin cậy; giữ `false` khi triển khai hoặc demo công khai.
