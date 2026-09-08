# ⚡ QUICK START - 3 BƯỚC

## 1. Cài đặt packages
```bash
cd backend
npm install
```

## 2. Sửa mật khẩu MySQL
Mở file `backend/.env` và sửa dòng:
```
DB_PASSWORD=     # ← Điền mật khẩu MySQL của bạn vào đây
```

## 3. Chạy backend
Trong VS Code:
- Nhấn `Ctrl + Shift + P`
- Gõ "Tasks: Run Task"
- Chọn **"🗄️ Setup Database"** (chạy 1 lần đầu tiên)
- Chọn **"🚀 Start Backend Dev"** (chạy server)

HOẶC dùng terminal:
```bash
npm run db:create && npm run db:migrate && npm run db:seed
npm run dev
```

## ✅ Kiểm tra
Mở: http://localhost:5000/health

---
📖 Chi tiết: [SETUP.md](./SETUP.md)
