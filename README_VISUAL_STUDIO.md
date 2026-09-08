# 🎨 CHẠY BACKEND TRONG VISUAL STUDIO 2022

## ⚡ QUICK START

### 1. Mở Project
**Cách nhanh nhất:**
- Double-click file **`backend/backend.sln`**

**Hoặc:**
- Mở **Visual Studio 2022**
- Click **"Open a project or solution"**
- Chọn file **`backend/backend.sln`**

### 2. Cài packages
Mở **Terminal** (View → Terminal hoặc `Ctrl + \``):
```bash
npm install
```

### 3. Setup Database
Sửa mật khẩu MySQL trong `backend/.env`:
```env
DB_PASSWORD=your_password_here
```

Sau đó chạy:
```bash
npm run db:create && npm run db:migrate && npm run db:seed
```

### 4. Chạy Server
Nhấn **F5** hoặc click ▶️

---

## ✅ Test

Mở: http://localhost:5000/health

---

## 📚 Chi tiết

Xem file: [VISUAL_STUDIO_SETUP.md](./VISUAL_STUDIO_SETUP.md)

---

## 🎮 Shortcuts

- `F5` - Start/Debug
- `Ctrl + F5` - Start không debug
- `Ctrl + \`` - Terminal
- `F10` - Step Over
- `Shift + F5` - Stop

---

## 🛠️ Task Runner Explorer

**View** → **Other Windows** → **Task Runner Explorer**

Các tasks có sẵn:
- 📦 Install Dependencies
- 🚀 Start Backend Dev
- 🏗️ Build Backend
- 🗄️ Create Database
- 📊 Run Migrations
- 🌱 Seed Database
- 🧹 Clean Build

Double-click để chạy!

---

## 🐛 Debug

1. Đặt breakpoint (click số dòng bên trái)
2. Nhấn F5
3. Code sẽ dừng tại breakpoint
4. Xem biến trong **Watch** hoặc **Locals**

---

🚀 Happy coding!
