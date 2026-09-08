# ⚡ VISUAL STUDIO 2022 - QUICK START

## 🎯 3 BƯỚC CHẠY BACKEND

### 1️⃣ Mở trong Visual Studio
**Cách 1 (Khuyến nghị):**
- Double-click file **`backend/backend.sln`**

**Cách 2:**
- Mở **Visual Studio 2022**
- Click **"Open a project or solution"**
- Chọn file **`backend/backend.sln`**

**Cách 3:**
- Mở **Visual Studio 2022**
- Click **"Open a local folder"**
- Chọn thư mục **`backend`**

### 2️⃣ Cài packages & Setup
Mở **Terminal** trong VS (View → Terminal) hoặc `Ctrl + \``:
```bash
npm install
npm run db:create && npm run db:migrate && npm run db:seed
```

**Lưu ý**: Nhớ sửa mật khẩu MySQL trong file `backend/.env` trước!

### 3️⃣ Chạy server
Nhấn **F5** hoặc click nút ▶️ **"Start Debugging"**

---

## ✅ Kiểm tra
Mở: http://localhost:5000/health

---

## 🎮 Shortcuts hay dùng

| Phím | Chức năng |
|------|-----------|
| `F5` | Start/Debug |
| `Ctrl + F5` | Start không debug |
| `Ctrl + \`` | Terminal |
| `F10` | Step Over (debug) |
| `Shift + F5` | Stop |

---

📖 **Chi tiết**: [VISUAL_STUDIO_SETUP.md](../VISUAL_STUDIO_SETUP.md)
