# 📂 CÁCH MỞ PROJECT TRONG VISUAL STUDIO 2022

## ⚡ Cách nhanh nhất

### Double-click vào file này:
```
backend/backend.sln
```

Visual Studio sẽ tự động mở! 🚀

---

## 📋 Các cách khác

### Cách 1: Từ Visual Studio
1. Mở **Visual Studio 2022**
2. Click **"Open a project or solution"**
3. Chọn file **`backend.sln`** trong thư mục backend
4. Click **Open**

### Cách 2: Từ File Explorer
1. Vào thư mục **backend**
2. Tìm file **`backend.sln`** (icon Visual Studio màu tím)
3. **Double-click** vào file đó
4. Visual Studio sẽ tự mở

### Cách 3: Từ Menu Recent
1. Mở **Visual Studio 2022**
2. Trong màn hình **"Open recent"**
3. Tìm **backend.sln** trong danh sách
4. Click vào để mở

---

## ✅ Sau khi mở

1. **Cài packages**: Terminal → `npm install`
2. **Setup database**: 
   ```bash
   npm run db:create
   npm run db:migrate
   npm run db:seed
   ```
3. **Chạy server**: Nhấn **F5**

---

## 🎯 Quick Actions

### Trong Visual Studio, bạn có thể:

- **F5** - Chạy/Debug server
- **View** → **Terminal** - Mở terminal
- **View** → **Other Windows** → **Task Runner Explorer** - Chạy npm scripts
- **Solution Explorer** - Browse files

---

## 🐛 Lỗi thường gặp

### ❌ "Node.js development tools not installed"

**Giải pháp**:
1. Đóng Visual Studio
2. Mở **Visual Studio Installer**
3. Click **Modify** trên VS 2022
4. Tab **Workloads** → tích **"Node.js development"**
5. Click **Modify** để cài
6. Restart Visual Studio và mở lại `backend.sln`

### ❌ "Cannot find backend.sln"

**Vị trí file**: `backend/backend.sln`

Đảm bảo bạn đang ở đúng thư mục!

---

📖 **Chi tiết**: [VISUAL_STUDIO_SETUP.md](../VISUAL_STUDIO_SETUP.md)

🚀 Happy coding!
