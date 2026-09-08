# 🎯 CHẠY BACKEND - BẮT ĐẦU TẠI ĐÂY

## ⚡ Cách nhanh nhất (3 bước)

### Bước 1: Cài đặt
```bash
cd backend
npm install
```

### Bước 2: Sửa mật khẩu MySQL
Mở file **`backend/.env`** và điền mật khẩu MySQL:
```env
DB_PASSWORD=your_password_here
```

### Bước 3: Chạy trong VS Code

**CÁCH 1: Dùng Tasks (Khuyến nghị)**
1. Nhấn `Ctrl + Shift + P` (hoặc `Cmd + Shift + P` trên Mac)
2. Gõ: `Tasks: Run Task`
3. Chọn: **🗄️ Setup Database** (chạy 1 lần đầu tiên)
4. Sau đó chọn: **🚀 Start Backend Dev**

**CÁCH 2: Dùng Debug**
1. Nhấn `F5`
2. Chọn **🚀 Launch Backend Server**

**CÁCH 3: Dùng Terminal**
```bash
# Setup database (chỉ chạy 1 lần đầu)
npm run db:create
npm run db:migrate
npm run db:seed

# Start server
npm run dev
```

## ✅ Kiểm tra thành công

Mở trình duyệt: http://localhost:5000/health

Thấy kết quả này là thành công:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

## 🎮 Điều khiển VS Code

### Shortcuts
- `F5` - Start/Debug server
- `Ctrl + Shift + B` - Build
- `Ctrl + \`` - Toggle Terminal
- `Ctrl + Shift + P` - Command Palette

### Tasks có sẵn (Ctrl + Shift + P → Tasks)
- 📦 Install Dependencies
- 🚀 Start Backend Dev
- 🏗️ Build Backend
- 🗄️ Setup Database
- 🧹 Clean Build

### Debug Configurations (F5)
- 🚀 Launch Backend Server
- 🐛 Debug Backend Server
- 🗄️ Create Database
- 🌱 Seed Database

## 🐛 Xử lý lỗi

### ❌ Cannot connect to database
→ Kiểm tra MySQL đang chạy và mật khẩu trong `.env` đúng

### ❌ Port 5000 already in use
→ Đổi PORT trong `.env`: `PORT=5001`

### ❌ Module not found / uuid error
→ Chạy lại: `npm install`

## 📂 Cấu trúc quan trọng

```
backend/
├── .vscode/
│   ├── launch.json      ← Debug configs (F5)
│   ├── tasks.json       ← VS Code tasks
│   └── settings.json    ← VS Code settings
├── src/
│   ├── server.ts        ← Entry point
│   ├── app.ts           ← Express app
│   ├── config/          ← Database config
│   ├── services/        ← Business logic
│   ├── middlewares/     ← Auth, Error handling
│   └── utils/           ← Helpers
├── .env                 ← Config (SỬA FILE NÀY!)
└── package.json
```

## 📚 Đọc thêm

- [QUICK_START.md](./QUICK_START.md) - Hướng dẫn ngắn gọn
- [SETUP.md](./SETUP.md) - Hướng dẫn chi tiết
- [README.md](./README.md) - Tổng quan dự án

---

**Lưu ý**: Đảm bảo MySQL đã cài và đang chạy trước khi start backend!

🚀 Happy coding!
