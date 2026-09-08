# 🎨 MỞ BACKEND TRONG VISUAL STUDIO 2022

## ⚡ CÁCH NHANH NHẤT

### 👉 Double-click vào file này:

```
📁 backend/
   └── 📄 backend.sln  ← DOUBLE-CLICK VÀO ĐÂY!
```

Visual Studio 2022 sẽ tự động mở! 🚀

---

## 🖱️ Hướng dẫn chi tiết

### Bước 1: Tìm file backend.sln
1. Mở thư mục **backend**
2. Tìm file **backend.sln** (icon Visual Studio màu tím)
3. **Double-click** vào file đó

### Bước 2: Visual Studio sẽ mở
- Project sẽ load tự động
- Solution Explorer hiển thị cây thư mục
- Sẵn sàng code!

---

## 📋 Sau khi mở project

### 1️⃣ Cài packages
Mở **Terminal** (View → Terminal hoặc `Ctrl + \``):
```bash
npm install
```

### 2️⃣ Setup database
Sửa mật khẩu MySQL trong **backend/.env**:
```env
DB_PASSWORD=your_password_here
```

Chạy:
```bash
npm run db:create && npm run db:migrate && npm run db:seed
```

### 3️⃣ Chạy server
**Nhấn F5** hoặc click nút ▶️

### 4️⃣ Kiểm tra
Mở: http://localhost:5000/health

---

## 🎮 Shortcuts trong Visual Studio

| Phím | Chức năng |
|------|-----------|
| `F5` | Start/Debug server |
| `Ctrl + F5` | Start không debug |
| `Ctrl + \`` | Mở Terminal |
| `F10` | Step Over (debug) |
| `Shift + F5` | Stop server |

---

## 🛠️ Task Runner Explorer

Chạy npm scripts dễ dàng:

1. Mở: **View** → **Other Windows** → **Task Runner Explorer**
2. Expand **package.json**
3. Double-click để chạy:
   - 📦 Install Dependencies
   - 🚀 Start Backend Dev
   - 🗄️ Create Database
   - 📊 Run Migrations
   - 🌱 Seed Database

---

## 🐛 Debug với Breakpoints

1. Mở file TypeScript (vd: `src/server.ts`)
2. **Click vào số dòng** bên trái → chấm đỏ xuất hiện
3. Nhấn **F5** để chạy debug
4. Code sẽ dừng tại breakpoint
5. Xem giá trị biến trong **Watch** hoặc **Locals** window

---

## 📂 Cấu trúc Files

```
backend/
├── backend.sln          ← MỞ FILE NÀY!
├── backend.njsproj      ← Project config
├── package.json         ← Dependencies
├── .env                 ← Config (sửa mật khẩu ở đây)
├── src/
│   ├── server.ts       ← Entry point
│   ├── app.ts          ← Express app
│   └── ...
└── scripts/            ← Database scripts
```

---

## ❓ Lỗi thường gặp

### ❌ Node.js development tools chưa cài

**Triệu chứng**: Visual Studio báo thiếu Node.js tools

**Giải pháp**:
1. Mở **Visual Studio Installer**
2. Click **Modify** trên VS 2022
3. Tab **Workloads** → tích **"Node.js development"**
4. Click **Modify** để cài đặt

### ❌ Cannot find backend.sln

**Vị trí đúng**: `backend/backend.sln`

Đảm bảo bạn đang ở thư mục đúng!

### ❌ npm install bị lỗi

```bash
# Xóa và cài lại
rmdir /s /q node_modules
del package-lock.json
npm install
```

### ❌ Cannot connect to database

1. Kiểm tra MySQL đang chạy
2. Kiểm tra mật khẩu trong `.env` đúng
3. Test: `mysql -u root -p`

---

## 📚 Tài liệu chi tiết

- 📖 [VISUAL_STUDIO_SETUP.md](./VISUAL_STUDIO_SETUP.md) - Hướng dẫn đầy đủ
- ⚡ [backend/VS_QUICK_START.md](./backend/VS_QUICK_START.md) - Quick start
- 📂 [backend/HOW_TO_OPEN.md](./backend/HOW_TO_OPEN.md) - Cách mở project

---

## 💡 Tips

1. **Tìm nhanh file**: Nhấn `Ctrl + ,` và gõ tên file
2. **Format code**: Nhấn `Ctrl + K, Ctrl + D`
3. **Comment/Uncomment**: `Ctrl + K, Ctrl + C` / `Ctrl + K, Ctrl + U`
4. **Multi-cursor**: Giữ `Alt` + click vào nhiều vị trí
5. **Zoom**: Giữ `Ctrl` + lăn chuột

---

## 🎯 Tóm tắt

1. **Double-click** → `backend/backend.sln`
2. **Terminal** → `npm install`
3. **Sửa** → `backend/.env` (DB_PASSWORD)
4. **Chạy** → `npm run db:create && npm run db:migrate && npm run db:seed`
5. **Start** → Nhấn **F5**
6. **Test** → http://localhost:5000/health

---

🚀 **Happy coding với Visual Studio 2022!**
