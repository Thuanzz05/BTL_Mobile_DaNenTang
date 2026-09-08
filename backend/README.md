# 🚀 BACKEND API - ỨNG DỤNG HỌC TỪ VỰNG

Backend API cho ứng dụng học từ vựng tiếng Anh qua Flashcard.

## 📁 Cấu trúc dự án

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          ✅ Kết nối MySQL
│   ├── controllers/             ⏳ Cần tạo
│   │   ├── auth.controller.ts
│   │   ├── topic.controller.ts
│   │   ├── word.controller.ts
│   │   ├── learning.controller.ts
│   │   └── ...
│   ├── services/
│   │   ├── auth.service.ts      ✅ Đã tạo
│   │   └── ...                  ⏳ Cần tạo
│   ├── middlewares/
│   │   ├── auth.middleware.ts   ✅
│   │   ├── admin.middleware.ts  ✅
│   │   └── error.middleware.ts  ✅
│   ├── routes/                  ⏳ Cần tạo
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   └── ...
│   ├── types/
│   │   ├── express.d.ts         ✅
│   │   └── models.ts            ✅
│   ├── utils/
│   │   ├── response.util.ts     ✅
│   │   ├── jwt.util.ts          ✅
│   │   ├── password.util.ts     ✅
│   │   └── uuid.util.ts         ✅
│   ├── app.ts                   ⏳ Cần tạo
│   └── server.ts                ⏳ Cần tạo
├── uploads/
│   ├── audio/
│   └── images/
├── database_schema.sql          ✅ Đã có
├── database_seed.sql            ✅ Đã có
├── package.json                 ✅
├── tsconfig.json                ✅
├── .env.example                 ✅
└── README.md                    ✅ File này
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT
- **Password**: bcrypt

## ✅ Đã hoàn thành

- [x] Config database (MySQL connection pool)
- [x] Types & Models
- [x] Utils (Response, JWT, Password, UUID)
- [x] Middlewares (Auth, Admin, Error)
- [x] AuthService (Register, Login, Logout)
- [x] Database Schema SQL
- [x] Database Seed SQL

## ⏳ Cần hoàn thành

- [ ] Controllers (auth, topic, word, learning, progress, admin)
- [ ] Services (topic, word, learning, progress, statistics)
- [ ] Routes
- [ ] app.ts (Express app setup)
- [ ] server.ts (Server entry point)
- [ ] Validation schemas
- [ ] Upload middleware (Multer)

## 🚀 Quick Start

### 1. Cài đặt dependencies

```bash
cd backend
npm install
```

### 2. Tạo database

```bash
# Đăng nhập MySQL
mysql -u root -p

# Tạo database
CREATE DATABASE hoc_tu_vung CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# Import schema
mysql -u root -p hoc_tu_vung < database_schema.sql

# Import seed data
mysql -u root -p hoc_tu_vung < database_seed.sql
```

### 3. Cấu hình .env

```bash
cp .env.example .env
# Chỉnh sửa .env với thông tin database của bạn
```

### 4. Chạy development server

```bash
npm run dev
```

Server chạy ở: `http://localhost:5000`

## 📡 API Endpoints (Đã thiết kế)

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
```

### Topics
```
GET    /api/topics
GET    /api/topics/:id
POST   /api/admin/topics
PUT    /api/admin/topics/:id
DELETE /api/admin/topics/:id
```

### Words
```
GET    /api/words
GET    /api/words/:id
POST   /api/admin/words
PUT    /api/admin/words/:id
DELETE /api/admin/words/:id
```

### Learning
```
POST   /api/learning/start
POST   /api/learning/result
POST   /api/learning/complete
GET    /api/learning/review
```

### Progress
```
GET    /api/progress
GET    /api/history
```

### Admin
```
GET    /api/admin/dashboard
GET    /api/admin/users
PUT    /api/admin/users/:id/status
GET    /api/admin/statistics
```

## 📝 Response Format

### Success
```json
{
  "success": true,
  "message": "Thành công",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Lỗi",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## 🔐 Authentication

Sử dụng JWT Bearer Token:

```
Authorization: Bearer <access_token>
```

## 📚 Tài liệu tham khảo

- Nghiệp vụ chi tiết: `../NGHIEP_VU_CHI_TIET.md`
- Database schema: `database_schema.sql`
- Database seed: `database_seed.sql`

---

**Trạng thái**: 🟡 Đang phát triển (40% hoàn thành)
