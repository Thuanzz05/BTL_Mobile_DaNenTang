# 🎨 HƯỚNG DẪN CHẠY BACKEND TRONG VISUAL STUDIO 2022

## 📋 Yêu cầu

- **Visual Studio 2022** (Community/Professional/Enterprise)
- **Node.js 18+** (cài từ https://nodejs.org)
- **MySQL 8.0+**
- **Workload**: Node.js development tools

### Cài Node.js Development trong Visual Studio

Nếu chưa cài:
1. Mở **Visual Studio Installer**
2. Click **Modify** trên VS 2022
3. Chọn tab **Workloads**
4. Tích chọn: **Node.js development**
5. Click **Modify** để cài đặt

---

## 🚀 CÁCH CHẠY BACKEND

### Bước 1: Mở Project trong Visual Studio

**Cách 1: Mở Solution File (Khuyến nghị) ⭐**
1. Mở Visual Studio 2022
2. Click **"Open a project or solution"**
3. Chọn file **`backend/backend.sln`**
4. Visual Studio sẽ mở project với đầy đủ cấu hình

**Cách 2: Double-click file .sln**
1. Vào thư mục `backend`
2. Double-click vào file **`backend.sln`**
3. Visual Studio sẽ tự mở

**Cách 3: Mở Folder**
1. Mở Visual Studio 2022
2. Click **"Open a local folder"**
3. Chọn thư mục **`backend`**
4. Visual Studio sẽ tự nhận diện Node.js project

**Cách 4: Mở từ File Explorer**
1. Vào thư mục `backend`
2. Click chuột phải vào file **`backend.sln`** hoặc **`package.json`**
3. Chọn **"Open with Visual Studio"**

---

### Bước 2: Cài Dependencies

#### Cách A: Dùng Terminal trong Visual Studio
1. Trong VS, mở **View** → **Terminal** (hoặc `Ctrl + \``)
2. Chạy lệnh:
```bash
npm install
```

#### Cách B: Dùng Solution Explorer
1. Trong **Solution Explorer** (phải màn hình)
2. Click chuột phải vào **`package.json`**
3. Chọn **"Restore Packages"** hoặc **"Install npm Packages"**

---

### Bước 3: Cấu hình Database

Mở file **`backend/.env`** và sửa:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=hoc_tu_vung
```

**Lưu ý**: Thay `your_mysql_password_here` bằng mật khẩu MySQL của bạn.

---

### Bước 4: Setup Database

#### Cách A: Dùng Terminal
```bash
npm run db:create
npm run db:migrate
npm run db:seed
```

#### Cách B: Dùng Task Runner Explorer
1. Trong VS, mở **View** → **Other Windows** → **Task Runner Explorer**
2. Expand **package.json**
3. Double-click vào:
   - **db:create** (tạo database)
   - **db:migrate** (import schema)
   - **db:seed** (import dữ liệu mẫu)

---

### Bước 5: Chạy Server

#### 🎯 CÁCH 1: Nhấn F5 (Debug Mode)

1. Nhấn **F5** hoặc click nút ▶️ **"Start Debugging"**
2. Visual Studio sẽ tự chạy `npm run dev`
3. Server chạy tại: http://localhost:5000

#### 🎯 CÁCH 2: Dùng Menu Debug

1. Click menu **Debug** → **Start Debugging** (F5)
2. Hoặc **Debug** → **Start Without Debugging** (Ctrl + F5)

#### 🎯 CÁCH 3: Dùng Terminal

```bash
npm run dev
```

#### 🎯 CÁCH 4: Dùng Task Runner

1. **View** → **Other Windows** → **Task Runner Explorer**
2. Double-click **dev** trong package.json

---

## ✅ Kiểm tra Server đã chạy

Mở trình duyệt: **http://localhost:5000/health**

Nếu thấy:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

→ **Thành công!** 🎉

---

## 🛠️ Các tính năng Visual Studio

### 1. Debug với Breakpoints

1. Mở file `backend/src/server.ts` hoặc `app.ts`
2. Click vào **số dòng** bên trái để đặt breakpoint (chấm đỏ)
3. Nhấn **F5** để chạy debug
4. Khi code chạm breakpoint, sẽ dừng lại để bạn kiểm tra

**Phím tắt Debug**:
- `F5` - Start/Continue
- `F10` - Step Over (chạy qua dòng)
- `F11` - Step Into (vào trong hàm)
- `Shift + F11` - Step Out (thoát hàm)
- `Shift + F5` - Stop Debugging

### 2. Task Runner Explorer

**Mở**: View → Other Windows → Task Runner Explorer

Hiển thị tất cả npm scripts:
- **dev** - Chạy development server
- **build** - Build production
- **start** - Chạy production server
- **db:create** - Tạo database
- **db:migrate** - Import schema
- **db:seed** - Import dữ liệu mẫu

### 3. Solution Explorer

**Vị trí**: Bên phải Visual Studio

Hiển thị cây thư mục dự án:
- Browse files và folders
- Click chuột phải để xem context menu
- Double-click file để mở

### 4. Terminal/Command Prompt

**Mở**: View → Terminal (hoặc `Ctrl + \``)

Chạy các lệnh npm:
```bash
npm run dev
npm run build
npm install <package-name>
```

### 5. IntelliSense & Autocomplete

Visual Studio tự động cung cấp:
- Code completion
- Type hints
- Function signatures
- Import suggestions

### 6. Git Integration

**Team Explorer** (View → Team Explorer):
- Commit changes
- Push/Pull
- View history
- Branch management

---

## 🔧 Configuration Files

### Debug Configuration
File: **`backend/.vs/launch.vs.json`**

Các debug profiles:
- 🚀 Launch Backend Server
- 🐛 Debug Backend Server
- 🗄️ Setup Database

### Tasks Configuration
File: **`backend/.vs/tasks.vs.json`**

Các tasks:
- 📦 Install Dependencies
- 🚀 Start Backend Dev
- 🏗️ Build Backend
- 🗄️ Create Database
- 📊 Run Migrations
- 🌱 Seed Database
- 🧹 Clean Build

---

## 📋 Workflow trong Visual Studio

### Workflow hàng ngày:

1. **Mở Visual Studio 2022**
2. **Open Folder** → chọn `backend`
3. Nhấn **F5** để chạy server
4. Code và lưu → server tự reload (hot-reload)
5. Xem logs trong **Output Window** hoặc **Terminal**

### Khi có lỗi:

1. Đọc error trong **Error List** (View → Error List)
2. Đặt breakpoint và nhấn F5 để debug
3. Xem biến trong **Watch Window** hoặc **Locals**

---

## 🐛 Troubleshooting

### ❌ Visual Studio không nhận diện Node.js project

**Giải pháp**:
1. Kiểm tra Node.js đã cài: `node --version`
2. Cài **Node.js development workload** trong Visual Studio Installer
3. Restart Visual Studio

### ❌ npm install bị lỗi

**Giải pháp**:
```bash
# Xóa và cài lại
rmdir /s /q node_modules
del package-lock.json
npm install
```

### ❌ Port 5000 đã được sử dụng

**Giải pháp**: Đổi PORT trong `.env`:
```env
PORT=5001
```

### ❌ Cannot connect to database

**Giải pháp**:
1. Kiểm tra MySQL đang chạy
2. Kiểm tra mật khẩu trong `.env` đúng
3. Test connection:
```bash
mysql -u root -p
```

---

## 🎨 Giao diện Visual Studio

### Các Panels quan trọng:

| Panel | Vị trí | Chức năng |
|-------|--------|-----------|
| **Solution Explorer** | Phải | Quản lý files |
| **Error List** | Dưới | Xem lỗi compile |
| **Output** | Dưới | Xem logs |
| **Terminal** | Dưới | Chạy commands |
| **Task Runner Explorer** | Phải | Chạy npm scripts |
| **Team Explorer** | Phải | Git operations |

### Phím tắt hữu ích:

| Phím | Chức năng |
|------|-----------|
| `F5` | Start Debugging |
| `Ctrl + F5` | Start Without Debugging |
| `Shift + F5` | Stop Debugging |
| `F10` | Step Over |
| `F11` | Step Into |
| `Ctrl + \`` | Toggle Terminal |
| `Ctrl + Shift + B` | Build |
| `Ctrl + K, Ctrl + D` | Format Document |
| `Ctrl + .` | Quick Actions |
| `Ctrl + ,` | Settings |

---

## 📚 Tài liệu thêm

- [backend/START_HERE.md](./backend/START_HERE.md) - Hướng dẫn chung
- [backend/SETUP.md](./backend/SETUP.md) - Chi tiết kỹ thuật
- [BACKEND_SETUP_VI.md](./BACKEND_SETUP_VI.md) - Tổng hợp

---

## 💡 Tips cho Visual Studio

1. **Theme**: Tools → Options → Environment → General → Color theme (chọn Dark/Blue/Light)
2. **Font Size**: Tools → Options → Environment → Fonts and Colors
3. **Extensions**: Extensions → Manage Extensions (cài thêm Prettier, ESLint...)
4. **Zoom**: Giữ `Ctrl` + lăn chuột để zoom code
5. **Multi-cursor**: Giữ `Alt` + click để đặt nhiều cursor

---

## 🎯 Quick Start Summary

```bash
# 1. Cài dependencies
npm install

# 2. Sửa .env (điền mật khẩu MySQL)

# 3. Setup database
npm run db:create && npm run db:migrate && npm run db:seed

# 4. Chạy server trong Visual Studio
# Nhấn F5 hoặc click ▶️ Start
```

---

**Lưu ý**: Visual Studio 2022 hỗ trợ Node.js rất tốt, bạn có thể code TypeScript với IntelliSense đầy đủ!

🚀 **Happy coding với Visual Studio 2022!**
