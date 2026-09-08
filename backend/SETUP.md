# 🚀 HƯỚNG DẪN CHẠY BACKEND TRONG VS CODE

## 📋 Yêu cầu

- Node.js 18+
- MySQL 8.0+
- VS Code

## ⚡ Quick Start (3 bước)

### 1️⃣ Cài đặt dependencies

Mở terminal trong VS Code (`Ctrl + \``) và chạy:

```bash
cd backend
npm install
```

### 2️⃣ Cấu hình database

Chỉnh sửa file `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=hoc_tu_vung
```

**Lưu ý**: Thay `your_mysql_password_here` bằng mật khẩu MySQL của bạn. Nếu không có mật khẩu, để trống.

### 3️⃣ Tạo database và chạy server

**Cách 1: Dùng VS Code Tasks (Khuyến nghị)**

1. Nhấn `Ctrl + Shift + P`
2. Gõ "Tasks: Run Task"
3. Chọn "🗄️ Setup Database" (tạo database và import dữ liệu mẫu)
4. Sau khi hoàn tất, chọn "🚀 Start Backend Dev"

**Cách 2: Dùng Terminal**

```bash
# Tạo database và import schema
npm run db:create
npm run db:migrate
npm run db:seed

# Chạy server
npm run dev
```

**Cách 3: Dùng Debug (F5)**

1. Đảm bảo đã tạo database trước
2. Nhấn `F5` hoặc vào menu "Run and Debug"
3. Chọn "🚀 Launch Backend Server"

## ✅ Kiểm tra server đã chạy

Mở trình duyệt và truy cập:

```
http://localhost:5000/health
```

Nếu thấy:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

→ **Thành công! Backend đã sẵn sàng** 🎉

## 🛠️ VS Code Features

### Launch Configurations (F5)

- **🚀 Launch Backend Server**: Chạy server development
- **🐛 Debug Backend Server**: Chạy server với debugger
- **🗄️ Create Database**: Tạo database
- **🌱 Seed Database**: Import dữ liệu mẫu

### Tasks (Ctrl + Shift + P → Tasks: Run Task)

- **📦 Install Dependencies**: Cài đặt packages
- **🚀 Start Backend Dev**: Chạy server development
- **🏗️ Build Backend**: Build production
- **🗄️ Setup Database**: Setup database hoàn chỉnh
- **🧹 Clean Build**: Xóa thư mục dist

### Shortcuts hữu ích

- `F5`: Start Debugging
- `Ctrl + Shift + B`: Run Build Task
- `Ctrl + \``: Toggle Terminal
- `Ctrl + Shift + P`: Command Palette

## 🔧 Lệnh npm

```bash
npm run dev      # Chạy development server với hot-reload
npm run build    # Build production
npm start        # Chạy production server
npm run db:create  # Tạo database
npm run db:migrate # Chạy migrations (import schema)
npm run db:seed    # Seed dữ liệu mẫu
```

## 📡 API Endpoints

Server chạy tại: `http://localhost:5000`

- Health check: `GET /health`
- API base: `/api`

## 🐛 Troubleshooting

### Lỗi: Cannot connect to database

```bash
# Kiểm tra MySQL đang chạy
mysql -u root -p

# Kiểm tra thông tin kết nối trong .env
# Đảm bảo DB_PASSWORD đúng
```

### Lỗi: Port 5000 đã được sử dụng

Thay đổi PORT trong file `.env`:

```env
PORT=5001
```

### Lỗi: Module not found

```bash
# Cài lại dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

## 📚 Tài liệu thêm

- [README.md](./README.md) - Tổng quan dự án
- [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) - Thiết kế database
- [../NGHIEP_VU_CHI_TIET.md](../NGHIEP_VU_CHI_TIET.md) - Nghiệp vụ chi tiết

## 💡 Tips

1. **Auto-reload**: Server tự động reload khi bạn sửa code (nhờ `tsx watch`)
2. **Debug**: Đặt breakpoint (click vào số dòng) và nhấn F5
3. **Logs**: Xem logs trong VS Code Terminal
4. **Database GUI**: Dùng MySQL Workbench hoặc DBeaver để xem database

---

Happy coding! 🚀
