# 🚀 BACKEND API - HỆ THỐNG HỌC TỪ VỰNG

Backend API cho ứng dụng học từ vựng tiếng Anh qua Flashcard.

## 📁 Cấu trúc thư mục

```
backend/
├── prisma/
│   ├── migrations/          # SQL migration files
│   ├── schema.prisma        # ✅ Database schema
│   └── seed.ts             # ✅ Seed data script
├── src/
│   ├── config/             # Configuration files
│   │   ├── database.ts     # Prisma client singleton
│   │   ├── jwt.ts          # JWT config
│   │   └── upload.ts       # Multer config
│   ├── controllers/        # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── topic.controller.ts
│   │   ├── word.controller.ts
│   │   ├── example.controller.ts
│   │   ├── favorite.controller.ts
│   │   ├── learning.controller.ts
│   │   ├── progress.controller.ts
│   │   ├── history.controller.ts
│   │   └── statistics.controller.ts
│   ├── middlewares/        # Middleware functions
│   │   ├── auth.middleware.ts
│   │   ├── admin.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/             # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── topic.routes.ts
│   │   ├── word.routes.ts
│   │   ├── example.routes.ts
│   │   ├── favorite.routes.ts
│   │   ├── learning.routes.ts
│   │   ├── progress.routes.ts
│   │   ├── history.routes.ts
│   │   ├── statistics.routes.ts
│   │   └── index.ts
│   ├── services/           # Business logic
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── topic.service.ts
│   │   ├── word.service.ts
│   │   ├── example.service.ts
│   │   ├── favorite.service.ts
│   │   ├── learning.service.ts
│   │   ├── progress.service.ts
│   │   ├── history.service.ts
│   │   └── statistics.service.ts
│   ├── validations/        # Zod validation schemas
│   │   ├── auth.validation.ts
│   │   ├── user.validation.ts
│   │   ├── topic.validation.ts
│   │   ├── word.validation.ts
│   │   └── ...
│   ├── types/              # TypeScript types
│   │   ├── express.d.ts
│   │   └── models.ts
│   ├── utils/              # Helper functions
│   │   ├── response.util.ts
│   │   ├── jwt.util.ts
│   │   ├── password.util.ts
│   │   └── file.util.ts
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
├── uploads/
│   ├── audio/              # Audio files (.mp3)
│   └── images/             # Image files (.jpg, .png)
├── .env.example            # ✅ Environment template
├── .gitignore              # ✅ Git ignore rules
├── package.json            # ✅ Dependencies
├── tsconfig.json           # ✅ TypeScript config
├── PRISMA_SETUP.md         # ✅ Prisma setup guide
├── PRISMA_SUMMARY.md       # ✅ Schema summary
└── README.md               # ✅ This file
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Zod
- **File Upload**: Multer
- **Password Hashing**: bcrypt

## 📋 Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm hoặc yarn hoặc pnpm

## 🚀 Quick Start

### 1. Cài đặt Dependencies

```bash
cd backend
npm install
```

### 2. Setup Database

```bash
# Tạo database trong PostgreSQL
createdb flashcard_db

# Hoặc dùng psql:
psql -U postgres
CREATE DATABASE flashcard_db;
\q
```

### 3. Configure Environment

```bash
# Copy file .env.example
cp .env.example .env

# Chỉnh sửa .env
nano .env
```

**Cập nhật `DATABASE_URL`:**
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/flashcard_db"
```

### 4. Run Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 5. Seed Database

```bash
npm run prisma:seed
```

**Dữ liệu sau khi seed:**
- 3 users (1 admin, 2 users)
- 5 topics
- 20 words
- 20+ examples
- Sample learning data

**Login credentials:**
```
Admin: admin@flashcard.com / 123456
User1: thuan@example.com / 123456
User2: mai@example.com / 123456
```

### 6. Start Development Server

```bash
npm run dev
```

Server chạy ở: `http://localhost:5000`

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register          # Đăng ký
POST   /api/auth/login             # Đăng nhập
POST   /api/auth/logout            # Đăng xuất
GET    /api/auth/me                # Thông tin user hiện tại
PUT    /api/auth/profile           # Cập nhật profile
```

### Users (Admin)
```
GET    /api/users                  # Danh sách users
GET    /api/users/:id              # Chi tiết user
PUT    /api/users/:id              # Cập nhật user
PUT    /api/users/:id/status       # Khóa/Mở khóa
DELETE /api/users/:id              # Xóa user
```

### Topics
```
GET    /api/topics                 # Danh sách chủ đề
GET    /api/topics/:id             # Chi tiết chủ đề
POST   /api/topics                 # Tạo chủ đề (admin)
PUT    /api/topics/:id             # Cập nhật (admin)
DELETE /api/topics/:id             # Xóa (admin)
```

### Words
```
GET    /api/words                  # Danh sách từ
GET    /api/words/:id              # Chi tiết từ
POST   /api/words                  # Tạo từ (admin)
PUT    /api/words/:id              # Cập nhật (admin)
DELETE /api/words/:id              # Xóa (admin)
POST   /api/words/:id/upload-audio # Upload audio (admin)
POST   /api/words/:id/upload-image # Upload image (admin)
```

### Examples
```
GET    /api/examples               # Danh sách ví dụ
POST   /api/examples               # Tạo ví dụ (admin)
PUT    /api/examples/:id           # Cập nhật (admin)
DELETE /api/examples/:id           # Xóa (admin)
```

### Favorites
```
GET    /api/favorites              # Từ yêu thích
POST   /api/favorites              # Thêm yêu thích
DELETE /api/favorites/:id          # Xóa yêu thích
POST   /api/favorites/toggle       # Toggle yêu thích
```

### Learning
```
POST   /api/learning/start         # Bắt đầu session
POST   /api/learning/result        # Lưu kết quả từ
POST   /api/learning/complete      # Hoàn thành session
GET    /api/learning/review        # Từ cần ôn tập
```

### Progress
```
GET    /api/progress               # Tiến độ tổng thể
GET    /api/progress/today         # Tiến độ hôm nay
GET    /api/progress/topic/:id     # Tiến độ theo chủ đề
```

### History
```
GET    /api/history                # Lịch sử học tập
GET    /api/history/:sessionId     # Chi tiết session
```

### Statistics (Admin)
```
GET    /api/statistics/overview    # Tổng quan
GET    /api/statistics/users       # Thống kê users
GET    /api/statistics/learning    # Thống kê học tập
GET    /api/statistics/topics      # Chủ đề phổ biến
```

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Email hoặc mật khẩu không chính xác",
  "error": {
    "code": "AUTH_FAILED",
    "details": []
  }
}
```

### Pagination Response
```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## 🔐 Authentication

API sử dụng JWT Authentication.

### Request Header
```
Authorization: Bearer <token>
```

### Token Expiry
- Access Token: 7 days
- Refresh Token: 30 days

## 📂 File Upload

### Audio Files
- **Path**: `/uploads/audio/`
- **Types**: `.mp3`, `.wav`
- **Max Size**: 5MB

### Images
- **Path**: `/uploads/images/`
- **Types**: `.jpg`, `.png`, `.jpeg`
- **Max Size**: 2MB

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🔧 Development Scripts

```bash
# Development mode (hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code
npm run format

# Prisma commands
npm run prisma:generate    # Generate client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio
npm run prisma:seed        # Seed database
```

## 🗄️ Database Management

### Prisma Studio
```bash
npm run prisma:studio
```
Mở GUI tại: `http://localhost:5555`

### Migration
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (⚠️ XÓA TẤT CẢ DỮ LIỆU)
npx prisma migrate reset
```

Xem chi tiết: [PRISMA_SETUP.md](./PRISMA_SETUP.md)

## 📊 Database Schema

Xem chi tiết: [PRISMA_SUMMARY.md](./PRISMA_SUMMARY.md)

**8 bảng chính:**
1. users
2. topics
3. words
4. examples
5. favorites
6. learning_sessions
7. learning_results
8. learning_progress

## 🌐 CORS Configuration

Mặc định cho phép:
- `http://localhost:3000` (Web Admin)
- `exp://<ip>:8081` (Expo Mobile)

Cấu hình trong `.env`:
```env
CORS_ORIGIN=http://localhost:3000,exp://192.168.1.100:8081
```

## 🔒 Security

- ✅ Password hashing với bcrypt
- ✅ JWT authentication
- ✅ Input validation với Zod
- ✅ SQL injection prevention (Prisma)
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet.js security headers

## 📈 Performance

- ✅ Database indexes
- ✅ Query optimization
- ✅ Pagination
- ✅ Caching (TODO)
- ✅ File compression (TODO)

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
# Windows: services.msc
# Mac: brew services list
# Linux: systemctl status postgresql

# Verify DATABASE_URL in .env
```

### Port Already in Use
```bash
# Kill process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

### Prisma Client Out of Sync
```bash
npm run prisma:generate
```

## 📚 Documentation

- [Prisma Setup Guide](./PRISMA_SETUP.md)
- [Database Schema](./PRISMA_SUMMARY.md)
- [API Documentation](./API_DOCS.md) (TODO)

## 🤝 Contributing

### Branch Strategy
- `main` - Production
- `develop` - Development
- `feature/*` - Features
- `fix/*` - Bug fixes

### Commit Convention
```
feat: add user registration
fix: fix login validation
docs: update README
refactor: refactor auth service
```

## 📄 License

MIT License

## 👥 Team

- **Người 1**: Tài khoản + Nội dung + Admin cơ bản
- **Người 2**: Học từ vựng + Flashcard + Quản lý nội dung

---

**✅ Backend đã sẵn sàng! Bắt đầu code thôi! 🚀**
