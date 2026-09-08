# 🚀 HƯỚNG DẪN CHẠY BACKEND

> **Chọn IDE của bạn:**
> - **Visual Studio 2022 (màu tím)**: Xem [VISUAL_STUDIO_SETUP.md](./VISUAL_STUDIO_SETUP.md)
> - **VS Code (màu xanh)**: Tiếp tục đọc file này

---

# 🚀 HƯỚNG DẪN CHẠY BACKEND - VS CODE

## ✅ Đã sửa lỗi và tạo file mới

### 🔧 Các lỗi đã sửa:
1. ✅ Lỗi import `uuid` - đã có trong dependencies
2. ✅ Prisma schema dùng sai database (đã đổi từ PostgreSQL → MySQL)
3. ✅ Thiếu `server.ts` và `app.ts` - đã tạo
4. ✅ Thiếu VS Code configurations - đã tạo đầy đủ

### 📁 Các file mới đã tạo:

#### VS Code Configuration (trong `backend/.vscode/`)
- ✅ `launch.json` - Debug configurations (nhấn F5 để chạy)
- ✅ `tasks.json` - Tasks cho VS Code (Ctrl + Shift + P)
- ✅ `settings.json` - VS Code settings

#### Backend Core Files
- ✅ `src/server.ts` - Entry point của server
- ✅ `src/app.ts` - Express app setup
- ✅ `.env` - Environment variables (đã tạo từ .env.example)

#### Database Scripts
- ✅ `scripts/create-database.js` - Tạo database tự động
- ✅ `scripts/run-migrations.js` - Import schema
- ✅ `scripts/seed-database.js` - Import dữ liệu mẫu

#### Documentation
- ✅ `START_HERE.md` - Bắt đầu từ đây (RECOMMENDED)
- ✅ `SETUP.md` - Hướng dẫn chi tiết
- ✅ `QUICK_START.md` - Hướng dẫn ngắn gọn

---

## ⚡ QUICK START (3 bước)

### 1️⃣ Cài dependencies
```bash
cd backend
npm install
```

### 2️⃣ Sửa mật khẩu MySQL
Mở file **`backend/.env`** và sửa:
```env
DB_PASSWORD=     # ← Điền mật khẩu MySQL của bạn
```

### 3️⃣ Chạy backend trong VS Code

**CÁCH 1: Dùng VS Code Tasks (Khuyến nghị)**
1. Mở VS Code
2. Nhấn `Ctrl + Shift + P` (Windows/Linux) hoặc `Cmd + Shift + P` (Mac)
3. Gõ: **"Tasks: Run Task"**
4. Chọn: **"🗄️ Setup Database"** (chạy 1 lần đầu tiên)
5. Chọn: **"🚀 Start Backend Dev"** (chạy server)

**CÁCH 2: Dùng Debug (F5)**
1. Mở VS Code
2. Nhấn `F5`
3. Chọn **"🚀 Launch Backend Server"**

**CÁCH 3: Dùng Terminal**
```bash
# Tạo database và import dữ liệu (chạy 1 lần)
npm run db:create
npm run db:migrate
npm run db:seed

# Chạy server
npm run dev
```

---

## ✅ Kiểm tra thành công

Mở trình duyệt: **http://localhost:5000/health**

Nếu thấy:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-09-08T..."
}
```

→ **Thành công!** Backend đã chạy 🎉

---

## 🎮 Điều khiển trong VS Code

### Phím tắt hữu ích:
- `F5` - Chạy/Debug server
- `Ctrl + Shift + B` - Build project
- `Ctrl + \`` - Mở/đóng Terminal
- `Ctrl + Shift + P` - Command Palette (chọn tasks)

### VS Code Tasks có sẵn:
Nhấn `Ctrl + Shift + P` → gõ "Tasks: Run Task" → chọn:
- 📦 **Install Dependencies** - Cài packages
- 🚀 **Start Backend Dev** - Chạy server development
- 🏗️ **Build Backend** - Build production
- 🗄️ **Setup Database** - Setup database hoàn chỉnh
- 🧹 **Clean Build** - Xóa thư mục dist

### Debug Configurations (F5):
- 🚀 **Launch Backend Server** - Chạy server
- 🐛 **Debug Backend Server** - Debug với breakpoints
- 🗄️ **Create Database** - Tạo database
- 🌱 **Seed Database** - Import dữ liệu mẫu

---

## 🐛 Xử lý lỗi thường gặp

### ❌ Cannot connect to database
**Nguyên nhân**: MySQL chưa chạy hoặc mật khẩu sai

**Giải pháp**:
```bash
# Kiểm tra MySQL đang chạy
mysql -u root -p

# Kiểm tra lại mật khẩu trong backend/.env
```

### ❌ Port 5000 already in use
**Giải pháp**: Đổi PORT trong `backend/.env`
```env
PORT=5001
```

### ❌ Cannot find module 'uuid' hoặc module khác
**Giải pháp**: Cài lại dependencies
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### ❌ Database 'hoc_tu_vung' doesn't exist
**Giải pháp**: Chạy lại setup database
```bash
npm run db:create
npm run db:migrate
npm run db:seed
```

---

## 📂 Cấu trúc Backend

```
backend/
├── .vscode/                   ← VS Code configs
│   ├── launch.json           ← Debug (F5)
│   ├── tasks.json            ← Tasks (Ctrl+Shift+P)
│   └── settings.json
├── src/
│   ├── server.ts             ← Entry point
│   ├── app.ts                ← Express app
│   ├── config/
│   │   └── database.ts       ← MySQL connection
│   ├── services/             ← Business logic
│   ├── middlewares/          ← Auth, Error handling
│   ├── utils/                ← Helpers (JWT, Password, UUID)
│   └── types/                ← TypeScript types
├── scripts/                  ← Database scripts
├── .env                      ← Config (SỬA FILE NÀY!)
├── package.json
└── START_HERE.md            ← Đọc file này trong backend/
```

---

## 📚 Tài liệu thêm

- **`backend/START_HERE.md`** - Hướng dẫn đầy đủ (RECOMMENDED)
- **`backend/SETUP.md`** - Chi tiết kỹ thuật
- **`backend/README.md`** - Tổng quan dự án
- **`NGHIEP_VU_CHI_TIET.md`** - Nghiệp vụ hệ thống

---

## 🎯 Next Steps

Sau khi backend chạy thành công:

1. ✅ Test API: http://localhost:5000/health
2. 📡 Xem logs trong Terminal của VS Code
3. 🐛 Debug: Đặt breakpoint và nhấn F5
4. 📝 Tiếp tục phát triển API endpoints

---

## 💡 Tips

- **Auto-reload**: Server tự động reload khi sửa code (nhờ `tsx watch`)
- **Breakpoints**: Click vào số dòng để đặt breakpoint, sau đó nhấn F5
- **Logs**: Xem logs ngay trong Terminal của VS Code
- **MySQL GUI**: Dùng MySQL Workbench hoặc DBeaver để xem database

---

**Lưu ý quan trọng**:
1. Đảm bảo MySQL đã cài và đang chạy
2. Nhớ điền mật khẩu MySQL trong file `backend/.env`
3. Chạy `npm install` trước khi start server

🚀 **Happy coding!**
