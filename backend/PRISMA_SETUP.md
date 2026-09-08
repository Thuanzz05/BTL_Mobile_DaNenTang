# 🗄️ HƯỚNG DẪN SETUP PRISMA VÀ DATABASE

## 📋 Mục lục
1. [Cài đặt PostgreSQL](#1-cài-đặt-postgresql)
2. [Cài đặt Dependencies](#2-cài-đặt-dependencies)
3. [Cấu hình Environment](#3-cấu-hình-environment)
4. [Chạy Migrations](#4-chạy-migrations)
5. [Seed Database](#5-seed-database)
6. [Prisma Studio](#6-prisma-studio)
7. [Các lệnh Prisma thường dùng](#7-các-lệnh-prisma-thường-dùng)

---

## 1. Cài đặt PostgreSQL

### Windows
```bash
# Download từ: https://www.postgresql.org/download/windows/
# Hoặc dùng Chocolatey:
choco install postgresql

# Sau khi cài đặt, PostgreSQL sẽ chạy ở:
# Host: localhost
# Port: 5432
# User: postgres
# Password: (password bạn đặt khi cài)
```

### macOS
```bash
# Dùng Homebrew:
brew install postgresql@14
brew services start postgresql@14
```

### Linux
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Tạo Database
```bash
# Đăng nhập vào PostgreSQL
psql -U postgres

# Tạo database mới
CREATE DATABASE flashcard_db;

# Kiểm tra
\l

# Thoát
\q
```

---

## 2. Cài đặt Dependencies

```bash
cd backend

# Cài đặt tất cả dependencies
npm install

# Hoặc
pnpm install
# Hoặc
yarn install
```

**Dependencies chính:**
- `@prisma/client` - Prisma Client
- `prisma` - Prisma CLI (devDependencies)
- `bcrypt` - Hash password
- `tsx` - Chạy TypeScript files

---

## 3. Cấu hình Environment

### Tạo file `.env`
```bash
cp .env.example .env
```

### Cập nhật `.env`
```env
NODE_ENV=development
PORT=5000

# PostgreSQL Connection String
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/flashcard_db?schema=public"

# JWT
JWT_SECRET=super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=super-secret-refresh-key
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:3000,exp://192.168.1.100:8081

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

**⚠️ LƯU Ý**: Thay `your_password` bằng password PostgreSQL của bạn!

---

## 4. Chạy Migrations

### Generate Prisma Client
```bash
npm run prisma:generate
```

Lệnh này sẽ:
- Đọc `prisma/schema.prisma`
- Generate Prisma Client code
- Tạo types TypeScript

### Tạo và chạy Migration
```bash
npm run prisma:migrate
```

Lệnh này sẽ:
- Tạo SQL migration file trong `prisma/migrations/`
- Chạy migration lên database
- Tạo tất cả bảng theo schema

**Output:**
```
✔ Enter a name for the new migration: … init
Applying migration `20240908123456_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20240908123456_init/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

### Xem SQL được tạo
```bash
cat prisma/migrations/*/migration.sql
```

---

## 5. Seed Database

### Chạy Seed Script
```bash
npm run prisma:seed
```

**Script sẽ tạo:**
- ✅ 3 users (1 admin + 2 users thường)
- ✅ 5 topics (Giao tiếp, Gia đình, Đồ ăn, Động vật, Trường học)
- ✅ 20 words với examples
- ✅ 3 favorites
- ✅ 1 learning session hoàn thành
- ✅ 5 learning results
- ✅ 5 learning progress records

**Thông tin đăng nhập sau khi seed:**
```
📧 Email: admin@flashcard.com
🔑 Password: 123456
👤 Role: Admin

📧 Email: thuan@example.com
🔑 Password: 123456
👤 Role: User

📧 Email: mai@example.com
🔑 Password: 123456
👤 Role: User
```

---

## 6. Prisma Studio

**Prisma Studio** là GUI tool để xem và chỉnh sửa database trực quan.

### Mở Prisma Studio
```bash
npm run prisma:studio
```

Browser sẽ tự động mở: `http://localhost:5555`

**Bạn có thể:**
- ✅ Xem tất cả records trong bảng
- ✅ Thêm, sửa, xóa records
- ✅ Filter và search
- ✅ Xem relationships giữa các bảng

---

## 7. Các lệnh Prisma thường dùng

### Generate Client
```bash
npx prisma generate
```
Dùng khi thay đổi `schema.prisma`

### Format Schema
```bash
npx prisma format
```
Format lại file `schema.prisma`

### Validate Schema
```bash
npx prisma validate
```
Kiểm tra schema có lỗi không

### Create Migration
```bash
npx prisma migrate dev --name ten_migration
```
Tạo migration mới khi thay đổi schema

### Reset Database (XÓA TẤT CẢ DỮ LIỆU!)
```bash
npx prisma migrate reset
```
⚠️ **CẢNH BÁO**: Lệnh này sẽ:
- Drop database
- Tạo lại database
- Chạy lại tất cả migrations
- Chạy seed script

### Prisma Studio
```bash
npx prisma studio
```
Mở GUI để quản lý database

### Push Schema (Development only)
```bash
npx prisma db push
```
Push schema lên DB mà không cần migration (nhanh, dùng cho dev)

---

## 8. Sử dụng Prisma Client trong Code

### Import Prisma Client
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

### Ví dụ Queries

#### Lấy tất cả users
```typescript
const users = await prisma.user.findMany();
```

#### Lấy user theo email
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'thuan@example.com' }
});
```

#### Tạo user mới
```typescript
const newUser = await prisma.user.create({
  data: {
    fullName: 'Nguyễn Văn A',
    email: 'vana@example.com',
    password: hashedPassword,
    role: 'user',
    status: 'active',
  }
});
```

#### Lấy words kèm topic và examples
```typescript
const words = await prisma.word.findMany({
  where: { topicId: 'topic-id-xxx' },
  include: {
    topic: true,
    examples: true,
  },
  orderBy: { displayOrder: 'asc' }
});
```

#### Update learning progress
```typescript
const progress = await prisma.learningProgress.upsert({
  where: {
    userId_wordId: {
      userId: 'user-id',
      wordId: 'word-id',
    }
  },
  update: {
    status: 'remembered',
    reviewCount: { increment: 1 },
    lastReviewedAt: new Date(),
    nextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
  },
  create: {
    userId: 'user-id',
    wordId: 'word-id',
    status: 'remembered',
    reviewCount: 1,
    lastReviewedAt: new Date(),
    nextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }
});
```

#### Lấy từ cần ôn tập
```typescript
const wordsToReview = await prisma.word.findMany({
  where: {
    learningProgress: {
      some: {
        userId: 'user-id',
        status: { in: ['forgotten', 'uncertain'] },
        nextReviewAt: { lte: new Date() },
      }
    }
  },
  include: {
    examples: true,
    learningProgress: {
      where: { userId: 'user-id' }
    }
  },
  take: 50,
});
```

#### Transaction
```typescript
const result = await prisma.$transaction(async (tx) => {
  // Tạo session
  const session = await tx.learningSession.create({
    data: { userId, topicId, totalWords: 20, status: 'in_progress' }
  });

  // Lưu kết quả
  await tx.learningResult.create({
    data: { sessionId: session.id, wordId, status: 'remembered' }
  });

  return session;
});
```

---

## 9. Troubleshooting

### Lỗi: "Can't reach database server"
```bash
# Kiểm tra PostgreSQL có đang chạy không
# Windows:
services.msc (tìm "postgresql")

# macOS/Linux:
ps aux | grep postgres

# Khởi động lại PostgreSQL
# macOS:
brew services restart postgresql@14

# Linux:
sudo systemctl restart postgresql
```

### Lỗi: "Database does not exist"
```sql
-- Tạo database
psql -U postgres
CREATE DATABASE flashcard_db;
\q
```

### Lỗi: "Authentication failed"
```env
# Kiểm tra lại DATABASE_URL trong .env
# Đảm bảo username và password đúng
DATABASE_URL="postgresql://postgres:CORRECT_PASSWORD@localhost:5432/flashcard_db"
```

### Lỗi: "Schema not in sync"
```bash
# Reset và chạy lại migrations
npm run prisma:migrate
```

### Xóa và tạo lại database
```bash
# Cách 1: Dùng Prisma
npm run prisma:migrate reset

# Cách 2: Thủ công
psql -U postgres
DROP DATABASE flashcard_db;
CREATE DATABASE flashcard_db;
\q

npm run prisma:migrate
npm run prisma:seed
```

---

## 10. Best Practices

### 1. Không commit file .env
```bash
# .gitignore đã có
.env
```

### 2. Tạo Singleton Prisma Client
```typescript
// src/config/database.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
```

### 3. Disconnect khi shutdown
```typescript
// Thêm vào server.ts
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

### 4. Sử dụng Transactions cho operations phức tạp
```typescript
// Đảm bảo tính nhất quán dữ liệu
await prisma.$transaction([
  prisma.user.create({ data: {...} }),
  prisma.profile.create({ data: {...} }),
]);
```

### 5. Logging queries trong Development
```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

---

## 11. Migration Workflow

### Development
```bash
# Thay đổi schema.prisma
nano prisma/schema.prisma

# Tạo và chạy migration
npm run prisma:migrate

# Generate client mới
npm run prisma:generate
```

### Production
```bash
# Deploy migrations
npx prisma migrate deploy

# Không dùng prisma migrate dev trên production!
```

---

## 📚 Tài liệu tham khảo
- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**✅ HOÀN THÀNH! Bây giờ bạn có thể bắt đầu code backend API.**
