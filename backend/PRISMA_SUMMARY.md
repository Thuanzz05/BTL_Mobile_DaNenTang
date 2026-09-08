# 📊 TÓM TẮT PRISMA SCHEMA

## ✅ ĐÃ HOÀN THÀNH

### 1. **Prisma Schema** (`prisma/schema.prisma`)
File định nghĩa cấu trúc database với đầy đủ:
- ✅ 8 Models (bảng)
- ✅ 5 Enums
- ✅ Tất cả relationships (Foreign Keys)
- ✅ Indexes để tối ưu queries
- ✅ Cascade Delete
- ✅ Unique constraints
- ✅ Default values

### 2. **Seed Script** (`prisma/seed.ts`)
Script để tạo dữ liệu mẫu:
- ✅ 3 users (1 admin, 2 users)
- ✅ 5 topics
- ✅ 20 words với examples
- ✅ 3 favorites
- ✅ 1 learning session
- ✅ 5 learning results
- ✅ 5 learning progress

### 3. **Setup Guide** (`PRISMA_SETUP.md`)
Hướng dẫn chi tiết từng bước:
- ✅ Cài PostgreSQL
- ✅ Config environment
- ✅ Chạy migrations
- ✅ Seed database
- ✅ Sử dụng Prisma Studio
- ✅ Troubleshooting

---

## 🗂️ CẤU TRÚC DATABASE

```
┌─────────────┐
│   users     │ (3 records after seed)
│  - id       │
│  - email    │ ← "admin@flashcard.com"
│  - role     │ ← "admin" | "user"
└──────┬──────┘
       │
       ├────────────┬─────────────┬──────────────┐
       │            │             │              │
       ▼            ▼             ▼              ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐
│favorites │ │learning_ │ │learning_     │ │              │
│          │ │sessions  │ │progress      │ │              │
└────┬─────┘ └────┬─────┘ └─────┬────────┘ │              │
     │            │              │          │              │
     │            │              │          │              │
     │            ▼              │          │              │
     │      ┌──────────┐         │          │              │
     │      │learning_ │         │          │              │
     │      │results   │         │          │              │
     │      └────┬─────┘         │          │              │
     │           │               │          │              │
┌────▼───────────▼───────────────▼──────────┘              │
│               words            │ (20 records)            │
│  - word: "Apple"               │                         │
│  - meaning: "Quả táo"          │                         │
│  - topic_id ───────────────────┼────────────┐            │
└────┬───────────────────────────┘            │            │
     │                                        │            │
     ▼                                        ▼            │
┌──────────┐                           ┌──────────┐        │
│examples  │ (20+ records)             │ topics   │        │
│          │                           │          │ (5)    │
└──────────┘                           └──────────┘        │
                                             │             │
                                             └─────────────┘
```

---

## 📋 CHI TIẾT 8 MODELS

### 1. User
```prisma
- id: UUID
- fullName: String
- email: String (UNIQUE)
- password: String (hashed)
- avatar: String?
- role: UserRole (user | admin)
- status: UserStatus (active | inactive | locked)
- createdAt, updatedAt
```

### 2. Topic
```prisma
- id: UUID
- name: String (VD: "Đồ ăn")
- description: Text?
- image: String?
- status: TopicStatus (active | inactive)
- displayOrder: Int
- createdAt, updatedAt
```

### 3. Word
```prisma
- id: UUID
- topicId: UUID → topics
- word: String (VD: "Apple")
- pronunciation: String? (VD: "/ˈæpəl/")
- vietnameseMeaning: String (VD: "Quả táo")
- partOfSpeech: Enum (noun | verb | adjective...)
- audioUrl: String?
- imageUrl: String?
- level: WordLevel (beginner | intermediate | advanced)
- displayOrder: Int
- createdAt, updatedAt
```

### 4. Example
```prisma
- id: UUID
- wordId: UUID → words
- englishSentence: Text (VD: "I eat an apple")
- vietnameseSentence: Text (VD: "Tôi ăn táo")
- displayOrder: Int
- createdAt, updatedAt
```

### 5. Favorite
```prisma
- id: UUID
- userId: UUID → users
- wordId: UUID → words
- createdAt

UNIQUE(userId, wordId) ← Không thể thêm từ 2 lần
```

### 6. LearningSession
```prisma
- id: UUID
- userId: UUID → users
- topicId: UUID → topics
- totalWords: Int
- startedAt: DateTime
- completedAt: DateTime?
- status: SessionStatus (in_progress | completed | abandoned)
```

### 7. LearningResult
```prisma
- id: UUID
- sessionId: UUID → learning_sessions
- wordId: UUID → words
- status: LearningStatus (remembered | uncertain | forgotten)
- createdAt
```

### 8. LearningProgress
```prisma
- id: UUID
- userId: UUID → users
- wordId: UUID → words
- status: LearningStatus (forgotten | uncertain | remembered | mastered)
- reviewCount: Int (số lần ôn)
- lastReviewedAt: DateTime
- nextReviewAt: DateTime (lịch ôn tiếp theo)
- createdAt, updatedAt

UNIQUE(userId, wordId) ← Mỗi user + word chỉ có 1 record
```

---

## 🔄 DATA FLOW CHÍNH

### Flow 1: User học từ mới
```
1. User chọn Topic "Đồ ăn"
   ↓
2. POST /api/learning/start
   → Tạo LearningSession
   ↓
3. User xem Flashcard từng từ
   ↓
4. User đánh giá: "Đã nhớ" / "Chưa nhớ"
   ↓
5. POST /api/learning/result
   → Tạo LearningResult
   → UPSERT LearningProgress
   ↓
6. POST /api/learning/complete
   → Update LearningSession.status = 'completed'
```

### Flow 2: Spaced Repetition Algorithm
```typescript
// Khi user đánh giá từ:
if (status === 'remembered') {
  nextReviewAt = NOW() + 7 days
} else if (status === 'uncertain') {
  nextReviewAt = NOW() + 1 day
} else if (status === 'forgotten') {
  nextReviewAt = NOW() // Ôn ngay
}

// Nếu reviewCount >= 5 và luôn "remembered":
status = 'mastered'
nextReviewAt = NOW() + 30 days
```

### Flow 3: Lấy từ cần ôn
```sql
SELECT words.*
FROM words
JOIN learning_progress ON words.id = learning_progress.word_id
WHERE learning_progress.user_id = 'current-user'
  AND learning_progress.status IN ('forgotten', 'uncertain')
  AND learning_progress.next_review_at <= NOW()
ORDER BY learning_progress.next_review_at ASC
LIMIT 50;
```

---

## 🚀 CÁCH SỬ DỤNG

### 1. Cài đặt
```bash
cd backend
npm install
```

### 2. Config Database
```bash
# Tạo .env
cp .env.example .env

# Sửa DATABASE_URL
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/flashcard_db"
```

### 3. Chạy Migration
```bash
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Tạo database tables
```

### 4. Seed Data
```bash
npm run prisma:seed
```

**Kết quả:**
```
🎉 Seed database hoàn thành!

📊 Tổng kết:
   - Users: 3 (1 admin, 2 users)
   - Topics: 5
   - Words: 20
   - Examples: 20+
   - Favorites: 3
   - Learning Sessions: 1
   - Learning Results: 5
   - Learning Progress: 5

🔑 Đăng nhập:
   admin@flashcard.com / 123456
   thuan@example.com / 123456
```

### 5. Xem Database
```bash
npm run prisma:studio
```

Browser mở: `http://localhost:5555`

---

## 📝 EXAMPLE QUERIES

### Lấy tất cả từ của topic "Đồ ăn"
```typescript
const words = await prisma.word.findMany({
  where: {
    topic: { name: 'Đồ ăn' }
  },
  include: {
    examples: true,
    topic: true,
  },
  orderBy: { displayOrder: 'asc' }
});
```

### Kiểm tra user đã yêu thích từ chưa
```typescript
const isFavorite = await prisma.favorite.findUnique({
  where: {
    userId_wordId: {
      userId: 'user-id',
      wordId: 'word-id',
    }
  }
});
```

### Lấy tiến độ học tập
```typescript
const progress = await prisma.learningProgress.groupBy({
  by: ['status'],
  where: { userId: 'user-id' },
  _count: true,
});

// Result:
// [
//   { status: 'remembered', _count: 15 },
//   { status: 'forgotten', _count: 5 },
// ]
```

### Lấy lịch sử học tập
```typescript
const history = await prisma.learningSession.findMany({
  where: {
    userId: 'user-id',
    status: 'completed',
  },
  include: {
    topic: { select: { name: true, image: true } },
    learningResults: {
      select: { status: true }
    }
  },
  orderBy: { completedAt: 'desc' },
  take: 10,
});
```

---

## ⚡ INDEXES ĐÃ TỐI ƯU

```prisma
// Users
@@index([email])
@@index([status])

// Words
@@index([topicId])     ← Lấy từ theo chủ đề
@@index([word])        ← Tìm kiếm từ

// Favorites
@@unique([userId, wordId])  ← Không trùng
@@index([userId])           ← Lấy yêu thích của user

// LearningProgress
@@unique([userId, wordId])
@@index([userId, status])      ← Lấy từ theo trạng thái
@@index([userId, nextReviewAt]) ← Lấy từ cần ôn
```

---

## 🎯 NHỮNG ĐIỂM QUAN TRỌNG

### 1. Cascade Delete
```prisma
// Khi xóa user → tự động xóa:
- favorites
- learning_sessions
- learning_progress

// Khi xóa topic → tự động xóa:
- words
- learning_sessions

// Khi xóa word → tự động xóa:
- examples
- favorites
- learning_results
- learning_progress
```

### 2. Unique Constraints
```prisma
// users.email → UNIQUE (không trùng email)
// favorites(userId, wordId) → UNIQUE (không thêm từ 2 lần)
// learning_progress(userId, wordId) → UNIQUE (1 từ 1 record tiến độ)
```

### 3. Enum Types
```typescript
// Đảm bảo data integrity
enum UserRole { user, admin }
enum LearningStatus { forgotten, uncertain, remembered, mastered }
// ...
```

---

## 📚 NEXT STEPS

Bây giờ database đã sẵn sàng! Bước tiếp theo:

1. ✅ **Tạo API Routes**
   - auth.routes.ts
   - user.routes.ts
   - topic.routes.ts
   - word.routes.ts
   - ...

2. ✅ **Tạo Controllers**
   - auth.controller.ts
   - user.controller.ts
   - ...

3. ✅ **Tạo Services** (Business Logic)
   - auth.service.ts
   - learning.service.ts
   - ...

4. ✅ **Middlewares**
   - auth.middleware.ts
   - admin.middleware.ts
   - validation.middleware.ts

5. ✅ **Utils**
   - jwt.util.ts
   - password.util.ts
   - response.util.ts

---

**🎉 PRISMA SCHEMA HOÀN CHỈNH! Database sẵn sàng cho backend development.**
