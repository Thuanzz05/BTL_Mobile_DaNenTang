# PHÂN TÍCH THIẾT KẾ CƠ SỞ DỮ LIỆU HỆ THỐNG HỌC TỪ VỰNG

## 📋 MỤC LỤC
1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Phân tích nghiệp vụ](#2-phân-tích-nghiệp-vụ)
3. [Danh sách bảng](#3-danh-sách-bảng)
4. [Chi tiết từng bảng](#4-chi-tiết-từng-bảng)
5. [Mối quan hệ giữa các bảng](#5-mối-quan-hệ-giữa-các-bảng)
6. [Indexes và Optimization](#6-indexes-và-optimization)
7. [Data Flow](#7-data-flow)
8. [Query Examples](#8-query-examples)

---

## 1. TỔNG QUAN HỆ THỐNG

### Đối tượng sử dụng
- **Người học (User)**: Học từ vựng qua Flashcard
- **Quản trị viên (Admin)**: Quản lý nội dung và người dùng

### Chức năng chính
1. Đăng ký/Đăng nhập
2. Xem danh sách chủ đề
3. Học từ vựng qua Flashcard
4. Đánh giá mức độ nhớ từ
5. Ôn tập từ chưa nhớ
6. Lưu từ yêu thích
7. Theo dõi tiến độ học tập
8. Xem lịch sử học tập
9. Admin quản lý toàn bộ nội dung

---

## 2. PHÂN TÍCH NGHIỆP VỤ

### 2.1. Quy trình học từ vựng
```
User đăng nhập
    ↓
Chọn chủ đề (Topic)
    ↓
Bắt đầu session học (LearningSession)
    ↓
Xem từng từ qua Flashcard (Word)
    ↓
Đánh giá: Đã nhớ / Chưa chắc / Chưa nhớ (LearningResult)
    ↓
Hệ thống cập nhật tiến độ (LearningProgress)
    ↓
Kết thúc session
    ↓
Hiển thị kết quả + từ cần ôn tập
```

### 2.2. Quy trình ôn tập
```
User vào phần "Ôn tập"
    ↓
Hệ thống query từ LearningProgress
    - WHERE status IN ('forgotten', 'uncertain')
    - WHERE nextReviewAt <= NOW()
    ↓
Hiển thị danh sách từ cần ôn
    ↓
User ôn lại qua Flashcard
    ↓
Cập nhật LearningProgress
    - Tăng reviewCount
    - Cập nhật lastReviewedAt
    - Tính toán nextReviewAt (Spaced Repetition)
```

### 2.3. Thuật toán Spaced Repetition đơn giản
```javascript
Khi user đánh giá từ:

1. "Đã nhớ" (remembered):
   - status = 'remembered'
   - nextReviewAt = NOW() + 7 ngày
   - reviewCount++

2. "Chưa chắc" (uncertain):
   - status = 'uncertain'
   - nextReviewAt = NOW() + 1 ngày
   - reviewCount++

3. "Chưa nhớ" (forgotten):
   - status = 'forgotten'
   - nextReviewAt = NOW() (ôn ngay)
   - reviewCount++

4. Nếu từ được đánh giá "Đã nhớ" liên tục >= 5 lần:
   - status = 'mastered' (đã thành thạo)
   - nextReviewAt = NOW() + 30 ngày
```

---

## 3. DANH SÁCH BẢNG

### Bảng chính (8 bảng)
1. **users** - Người dùng (cả User và Admin)
2. **topics** - Chủ đề từ vựng
3. **words** - Từ vựng
4. **examples** - Câu ví dụ của từ vựng
5. **favorites** - Từ yêu thích của user
6. **learning_sessions** - Phiên học tập
7. **learning_results** - Kết quả đánh giá từng từ trong session
8. **learning_progress** - Tiến độ học tập tổng thể của user

### Mối quan hệ tổng quan
```
users (1) ──── (N) favorites ──── (1) words
  │                                   │
  │                                   │
  ├─── (N) learning_sessions          │
  │           │                       │
  │           └─── (N) learning_results ─┘
  │                                   │
  └─── (N) learning_progress ─────────┘

topics (1) ──── (N) words (1) ──── (N) examples
    │
    └─── (N) learning_sessions
```

---

## 4. CHI TIẾT TỪNG BẢNG

### 4.1. Bảng: users

**Mục đích**: Lưu thông tin người dùng (cả User và Admin)

| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|-----------|
| id | UUID | Primary Key | PK, NOT NULL |
| full_name | VARCHAR(255) | Họ và tên | NOT NULL |
| email | VARCHAR(255) | Email đăng nhập | UNIQUE, NOT NULL |
| password | VARCHAR(255) | Mật khẩu đã hash | NOT NULL |
| avatar | VARCHAR(500) | URL ảnh đại diện | NULLABLE |
| role | ENUM | 'user' hoặc 'admin' | DEFAULT 'user' |
| status | ENUM | 'active', 'inactive', 'locked' | DEFAULT 'active' |
| created_at | TIMESTAMP | Ngày đăng ký | DEFAULT NOW() |
| updated_at | TIMESTAMP | Ngày cập nhật | AUTO UPDATE |

**Indexes**:
- PRIMARY KEY (id)
- UNIQUE (email)
- INDEX (status)

**Business Rules**:
- Email phải unique
- Password phải hash bằng bcrypt (salt rounds: 10)
- Admin tạo bằng cách set role = 'admin'
- Khi status = 'locked' → không thể đăng nhập

---

### 4.2. Bảng: topics

**Mục đích**: Lưu các chủ đề từ vựng (Gia đình, Đồ ăn, Du lịch,...)

| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|-----------|
| id | UUID | Primary Key | PK, NOT NULL |
| name | VARCHAR(255) | Tên chủ đề (VD: "Gia đình") | NOT NULL |
| description | TEXT | Mô tả ngắn | NULLABLE |
| image | VARCHAR(500) | URL hình ảnh chủ đề | NULLABLE |
| status | ENUM | 'active', 'inactive' | DEFAULT 'active' |
| display_order | INTEGER | Thứ tự hiển thị | DEFAULT 0 |
| created_at | TIMESTAMP | Ngày tạo | DEFAULT NOW() |
| updated_at | TIMESTAMP | Ngày cập nhật | AUTO UPDATE |

**Indexes**:
- PRIMARY KEY (id)
- INDEX (status)
- INDEX (display_order)

**Business Rules**:
- Chỉ hiển thị topics có status = 'active' cho user
- Sắp xếp theo display_order ASC
- Admin có thể thay đổi display_order để sắp xếp lại

---

### 4.3. Bảng: words

**Mục đích**: Lưu từ vựng tiếng Anh

| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|-----------|
| id | UUID | Primary Key | PK, NOT NULL |
| topic_id | UUID | Foreign Key → topics | FK, NOT NULL |
| word | VARCHAR(255) | Từ tiếng Anh (VD: "Apple") | NOT NULL |
| pronunciation | VARCHAR(255) | Phiên âm IPA (VD: "/ˈæpəl/") | NULLABLE |
| vietnamese_meaning | VARCHAR(500) | Nghĩa tiếng Việt | NOT NULL |
| part_of_speech | ENUM | Loại từ | NOT NULL |
| audio_url | VARCHAR(500) | URL file phát âm | NULLABLE |
| image_url | VARCHAR(500) | URL hình ảnh minh họa | NULLABLE |
| level | ENUM | 'beginner', 'intermediate', 'advanced' | DEFAULT 'beginner' |
| display_order | INTEGER | Thứ tự trong chủ đề | DEFAULT 0 |
| created_at | TIMESTAMP | Ngày tạo | DEFAULT NOW() |
| updated_at | TIMESTAMP | Ngày cập nhật | AUTO UPDATE |

**Enum part_of_speech**:
- noun (Danh từ)
- verb (Động từ)
- adjective (Tính từ)
- adverb (Trạng từ)
- pronoun (Đại từ)
- preposition (Giới từ)
- conjunction (Liên từ)
- interjection (Thán từ)

**Indexes**:
- PRIMARY KEY (id)
- FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
- INDEX (topic_id)
- INDEX (word)
- INDEX (level)

**Business Rules**:
- Mỗi từ thuộc 1 chủ đề
- Khi xóa topic → tự động xóa tất cả words (CASCADE)
- audio_url: đường dẫn file .mp3
- image_url: đường dẫn file .jpg/.png

---

### 4.4. Bảng: examples

**Mục đích**: Lưu câu ví dụ cho từ vựng

| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|-----------|
| id | UUID | Primary Key | PK, NOT NULL |
| word_id | UUID | Foreign Key → words | FK, NOT NULL |
| english_sentence | TEXT | Câu ví dụ tiếng Anh | NOT NULL |
| vietnamese_sentence | TEXT | Nghĩa câu ví dụ | NOT NULL |
| display_order | INTEGER | Thứ tự hiển thị | DEFAULT 0 |
| created_at | TIMESTAMP | Ngày tạo | DEFAULT NOW() |
| updated_at | TIMESTAMP | Ngày cập nhật | AUTO UPDATE |

**Indexes**:
- PRIMARY KEY (id)
- FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
- INDEX (word_id)

**Business Rules**:
- Mỗi từ có thể có nhiều câu ví dụ
- Khi xóa word → tự động xóa examples (CASCADE)

**Ví dụ dữ liệu**:
```
word_id: uuid-of-apple
english_sentence: "I eat an apple every day."
vietnamese_sentence: "Tôi ăn một quả táo mỗi ngày."
```

---

### 4.5. Bảng: favorites

**Mục đích**: Lưu từ yêu thích của user

| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|-----------|
| id | UUID | Primary Key | PK, NOT NULL |
| user_id | UUID | Foreign Key → users | FK, NOT NULL |
| word_id | UUID | Foreign Key → words | FK, NOT NULL |
| created_at | TIMESTAMP | Ngày thêm | DEFAULT NOW() |

**Indexes**:
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
- UNIQUE (user_id, word_id)
- INDEX (user_id)
- INDEX (word_id)

**Business Rules**:
- 1 user không thể thêm cùng 1 từ 2 lần (UNIQUE constraint)
- Khi xóa user → tự động xóa favorites (CASCADE)
- Khi xóa word → tự động xóa favorites (CASCADE)

---

### 4.6. Bảng: learning_sessions

**Mục đích**: Lưu thông tin mỗi phiên học tập

| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|-----------|
| id | UUID | Primary Key | PK, NOT NULL |
| user_id | UUID | Foreign Key → users | FK, NOT NULL |
| topic_id | UUID | Foreign Key → topics | FK, NOT NULL |
| total_words | INTEGER | Tổng số từ trong session | NOT NULL |
| started_at | TIMESTAMP | Thời gian bắt đầu | DEFAULT NOW() |
| completed_at | TIMESTAMP | Thời gian hoàn thành | NULLABLE |
| status | ENUM | 'in_progress', 'completed', 'abandoned' | DEFAULT 'in_progress' |

**Indexes**:
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
- INDEX (user_id)
- INDEX (topic_id)
- INDEX (started_at)
- INDEX (status)

**Business Rules**:
- Khi user bắt đầu học 1 chủ đề → tạo session mới
- status = 'in_progress' → đang học
- status = 'completed' → hoàn thành, có completed_at
- status = 'abandoned' → bỏ dở giữa chừng
- completed_at chỉ có giá trị khi status = 'completed'

---

### 4.7. Bảng: learning_results

**Mục đích**: Lưu kết quả đánh giá từng từ trong 1 session

| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|-----------|
| id | UUID | Primary Key | PK, NOT NULL |
| session_id | UUID | Foreign Key → learning_sessions | FK, NOT NULL |
| word_id | UUID | Foreign Key → words | FK, NOT NULL |
| status | ENUM | 'remembered', 'uncertain', 'forgotten' | NOT NULL |
| created_at | TIMESTAMP | Thời gian đánh giá | DEFAULT NOW() |

**Indexes**:
- PRIMARY KEY (id)
- FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE
- FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
- INDEX (session_id)
- INDEX (word_id)

**Business Rules**:
- Mỗi từ trong session có 1 record trong bảng này
- status phản ánh đánh giá của user:
  - 'remembered': Đã nhớ (😄)
  - 'uncertain': Chưa chắc (😐)
  - 'forgotten': Chưa nhớ (😟)

**Ví dụ dữ liệu**:
```
Nếu 1 session có 20 từ:
→ Sẽ có 20 records trong learning_results
→ Mỗi record lưu đánh giá của user cho từ đó
```

---

### 4.8. Bảng: learning_progress

**Mục đích**: Lưu tiến độ học tập tổng thể của user cho từng từ

| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|-----------|
| id | UUID | Primary Key | PK, NOT NULL |
| user_id | UUID | Foreign Key → users | FK, NOT NULL |
| word_id | UUID | Foreign Key → words | FK, NOT NULL |
| status | ENUM | Trạng thái nhớ từ | DEFAULT 'forgotten' |
| review_count | INTEGER | Số lần đã ôn | DEFAULT 0 |
| last_reviewed_at | TIMESTAMP | Lần ôn gần nhất | DEFAULT NOW() |
| next_review_at | TIMESTAMP | Lịch ôn tiếp theo | DEFAULT NOW() |
| created_at | TIMESTAMP | Lần đầu học từ | DEFAULT NOW() |
| updated_at | TIMESTAMP | Cập nhật gần nhất | AUTO UPDATE |

**Enum status**:
- 'forgotten': Chưa nhớ
- 'uncertain': Chưa chắc
- 'remembered': Đã nhớ
- 'mastered': Đã thành thạo

**Indexes**:
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
- UNIQUE (user_id, word_id)
- INDEX (user_id)
- INDEX (word_id)
- INDEX (next_review_at)
- INDEX (status)

**Business Rules**:
- 1 user + 1 word chỉ có 1 record duy nhất (UNIQUE)
- next_review_at quyết định khi nào từ này hiện trong "Ôn tập"
- Khi user học từ lần đầu → tạo record mới
- Khi ôn lại → cập nhật record hiện tại

**Ví dụ logic**:
```sql
-- Lấy từ cần ôn tập của user
SELECT w.*
FROM words w
JOIN learning_progress lp ON w.id = lp.word_id
WHERE lp.user_id = '...'
  AND lp.status IN ('forgotten', 'uncertain')
  AND lp.next_review_at <= NOW()
ORDER BY lp.next_review_at ASC
LIMIT 50;
```

---

## 5. MỐI QUAN HỆ GIỮA CÁC BẢNG

### 5.1. Sơ đồ quan hệ (ERD)

```
┌─────────────────┐
│     users       │
│  - id (PK)      │
│  - email        │
│  - password     │
│  - role         │
└────────┬────────┘
         │ 1
         │
         │ N
    ┌────┴─────────────────────┬───────────────────┬──────────────────┐
    │                          │                   │                  │
┌───▼────────────┐   ┌─────────▼────────┐   ┌─────▼────────────┐   │
│   favorites    │   │ learning_sessions│   │learning_progress │   │
│  - user_id(FK) │   │  - user_id (FK)  │   │ - user_id (FK)   │   │
│  - word_id(FK) │   │  - topic_id (FK) │   │ - word_id (FK)   │   │
└───┬────────────┘   └─────────┬────────┘   └─────┬────────────┘   │
    │                          │ 1                 │                │
    │                          │                   │                │
    │                          │ N                 │                │
    │                  ┌───────▼──────────┐        │                │
    │                  │learning_results  │        │                │
    │                  │ - session_id(FK) │        │                │
    │                  │ - word_id (FK)   │        │                │
    │                  └───────┬──────────┘        │                │
    │                          │                   │                │
┌───▼──────────┐               │                   │                │
│    topics    │               │                   │                │
│  - id (PK)   │               │                   │                │
└───┬──────────┘               │                   │                │
    │ 1                        │                   │                │
    │                          │                   │                │
    │ N                        │                   │                │
┌───▼──────────┐               │                   │                │
│    words     │◄──────────────┴───────────────────┴────────────────┘
│  - id (PK)   │
│  - topic_id  │
└───┬──────────┘
    │ 1
    │
    │ N
┌───▼──────────┐
│   examples   │
│ - word_id(FK)│
└──────────────┘
```

### 5.2. Bảng tổng hợp quan hệ

| Bảng cha | Bảng con | Quan hệ | On Delete |
|----------|----------|---------|-----------|
| users | favorites | 1:N | CASCADE |
| users | learning_sessions | 1:N | CASCADE |
| users | learning_progress | 1:N | CASCADE |
| topics | words | 1:N | CASCADE |
| topics | learning_sessions | 1:N | CASCADE |
| words | examples | 1:N | CASCADE |
| words | favorites | 1:N | CASCADE |
| words | learning_results | 1:N | CASCADE |
| words | learning_progress | 1:N | CASCADE |
| learning_sessions | learning_results | 1:N | CASCADE |

---

## 6. INDEXES VÀ OPTIMIZATION

### 6.1. Indexes quan trọng

**users**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

**topics**
```sql
CREATE INDEX idx_topics_status ON topics(status);
CREATE INDEX idx_topics_display_order ON topics(display_order);
```

**words**
```sql
CREATE INDEX idx_words_topic_id ON words(topic_id);
CREATE INDEX idx_words_word ON words(word);
CREATE INDEX idx_words_level ON words(level);
```

**favorites**
```sql
CREATE UNIQUE INDEX idx_favorites_user_word ON favorites(user_id, word_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
```

**learning_sessions**
```sql
CREATE INDEX idx_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX idx_sessions_started_at ON learning_sessions(started_at);
CREATE INDEX idx_sessions_status ON learning_sessions(status);
```

**learning_progress**
```sql
CREATE UNIQUE INDEX idx_progress_user_word ON learning_progress(user_id, word_id);
CREATE INDEX idx_progress_next_review ON learning_progress(next_review_at);
CREATE INDEX idx_progress_status ON learning_progress(status);
```

### 6.2. Query optimization tips

1. **Lấy từ của 1 chủ đề**: Dùng index `idx_words_topic_id`
2. **Tìm kiếm từ**: Dùng index `idx_words_word` hoặc Full-Text Search
3. **Lấy từ yêu thích**: Dùng composite index `idx_favorites_user_word`
4. **Lấy từ cần ôn**: Dùng index `idx_progress_next_review` + `idx_progress_status`

---

## 7. DATA FLOW

### 7.1. Flow: User học từ mới

```
1. User chọn Topic "Đồ ăn"
   ↓
2. Frontend gọi API: GET /api/words?topicId=xxx
   ↓
3. Backend query:
   SELECT * FROM words WHERE topic_id = 'xxx'
   ↓
4. User nhấn "Bắt đầu học"
   ↓
5. Frontend gọi: POST /api/learning/start
   Body: { topicId: 'xxx', totalWords: 20 }
   ↓
6. Backend INSERT vào learning_sessions:
   {
     user_id: 'current-user',
     topic_id: 'xxx',
     total_words: 20,
     status: 'in_progress'
   }
   ↓
7. User xem từng từ qua Flashcard
   ↓
8. User đánh giá: "Đã nhớ" hoặc "Chưa nhớ"
   ↓
9. Frontend gọi: POST /api/learning/result
   Body: {
     sessionId: 'session-xxx',
     wordId: 'word-yyy',
     status: 'remembered'
   }
   ↓
10. Backend:
    a) INSERT vào learning_results
    b) UPSERT vào learning_progress:
       - Nếu chưa có record → INSERT
       - Nếu đã có → UPDATE status, review_count, next_review_at
   ↓
11. Lặp lại bước 7-10 cho tất cả các từ
   ↓
12. User hoàn thành tất cả từ
   ↓
13. Frontend gọi: POST /api/learning/complete
    Body: { sessionId: 'session-xxx' }
   ↓
14. Backend UPDATE learning_sessions:
    SET status = 'completed', completed_at = NOW()
   ↓
15. Frontend hiển thị kết quả:
    - Đã nhớ: X từ
    - Chưa nhớ: Y từ
    - Tỷ lệ: Z%
```

### 7.2. Flow: User ôn tập

```
1. User vào phần "Ôn tập"
   ↓
2. Frontend gọi: GET /api/learning/review
   ↓
3. Backend query:
   SELECT w.*
   FROM words w
   JOIN learning_progress lp ON w.id = lp.word_id
   WHERE lp.user_id = 'current-user'
     AND lp.status IN ('forgotten', 'uncertain')
     AND lp.next_review_at <= NOW()
   ORDER BY lp.next_review_at ASC
   ↓
4. Trả về danh sách từ cần ôn
   ↓
5. User ôn lại qua Flashcard (giống flow học từ mới)
   ↓
6. Cập nhật learning_progress với thuật toán Spaced Repetition
```

### 7.3. Flow: Admin thêm từ mới

```
1. Admin đăng nhập vào Web Admin
   ↓
2. Vào "Quản lý từ vựng" → Nhấn "Thêm từ"
   ↓
3. Admin nhập:
   - Chọn chủ đề
   - Từ tiếng Anh: "Apple"
   - Phiên âm: "/ˈæpəl/"
   - Nghĩa: "Quả táo"
   - Loại từ: "Danh từ"
   - Upload audio
   - Upload hình ảnh
   - Thêm ví dụ
   ↓
4. Frontend gọi: POST /api/words
   ↓
5. Backend:
   a) INSERT vào words
   b) INSERT vào examples (nếu có)
   c) Lưu file audio và image
   ↓
6. Trả về từ vừa tạo
   ↓
7. Mobile App tự động thấy từ mới khi refresh
```

---

## 8. QUERY EXAMPLES

### 8.1. Lấy tất cả chủ đề (có đếm số từ)

```sql
SELECT 
  t.id,
  t.name,
  t.description,
  t.image,
  COUNT(w.id) as word_count
FROM topics t
LEFT JOIN words w ON t.id = w.topic_id
WHERE t.status = 'active'
GROUP BY t.id, t.name, t.description, t.image
ORDER BY t.display_order ASC;
```

### 8.2. Lấy từ vựng của 1 chủ đề (kèm ví dụ)

```sql
SELECT 
  w.*,
  json_agg(
    json_build_object(
      'id', e.id,
      'englishSentence', e.english_sentence,
      'vietnameseSentence', e.vietnamese_sentence
    )
  ) as examples
FROM words w
LEFT JOIN examples e ON w.id = e.word_id
WHERE w.topic_id = 'topic-uuid-xxx'
GROUP BY w.id
ORDER BY w.display_order ASC;
```

### 8.3. Lấy tiến độ học tập của user

```sql
SELECT 
  COUNT(*) as total_words_learned,
  SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as mastered_count,
  SUM(CASE WHEN status = 'remembered' THEN 1 ELSE 0 END) as remembered_count,
  SUM(CASE WHEN status = 'uncertain' THEN 1 ELSE 0 END) as uncertain_count,
  SUM(CASE WHEN status = 'forgotten' THEN 1 ELSE 0 END) as forgotten_count
FROM learning_progress
WHERE user_id = 'user-uuid-xxx';
```

### 8.4. Lấy lịch sử học tập (10 sessions gần nhất)

```sql
SELECT 
  ls.id,
  ls.started_at,
  ls.completed_at,
  ls.total_words,
  ls.status,
  t.name as topic_name,
  t.image as topic_image,
  COUNT(CASE WHEN lr.status = 'remembered' THEN 1 END) as remembered_count,
  COUNT(CASE WHEN lr.status = 'forgotten' THEN 1 END) as forgotten_count
FROM learning_sessions ls
JOIN topics t ON ls.topic_id = t.id
LEFT JOIN learning_results lr ON ls.id = lr.session_id
WHERE ls.user_id = 'user-uuid-xxx'
  AND ls.status = 'completed'
GROUP BY ls.id, t.name, t.image
ORDER BY ls.completed_at DESC
LIMIT 10;
```

### 8.5. Lấy từ cần ôn tập hôm nay

```sql
SELECT 
  w.*,
  lp.status,
  lp.review_count,
  lp.last_reviewed_at,
  lp.next_review_at
FROM words w
JOIN learning_progress lp ON w.id = lp.word_id
WHERE lp.user_id = 'user-uuid-xxx'
  AND lp.status IN ('forgotten', 'uncertain')
  AND lp.next_review_at <= NOW()
ORDER BY lp.next_review_at ASC
LIMIT 50;
```

### 8.6. Lấy từ yêu thích của user

```sql
SELECT 
  w.*,
  f.created_at as favorited_at
FROM words w
JOIN favorites f ON w.id = f.word_id
WHERE f.user_id = 'user-uuid-xxx'
ORDER BY f.created_at DESC;
```

### 8.7. Thống kê tổng quan hệ thống (Admin)

```sql
SELECT 
  (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
  (SELECT COUNT(*) FROM topics) as total_topics,
  (SELECT COUNT(*) FROM words) as total_words,
  (SELECT COUNT(*) FROM learning_sessions) as total_sessions,
  (SELECT COUNT(*) FROM learning_sessions WHERE status = 'completed') as completed_sessions,
  (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_this_week;
```

### 8.8. Chủ đề được học nhiều nhất

```sql
SELECT 
  t.id,
  t.name,
  t.image,
  COUNT(ls.id) as session_count,
  COUNT(DISTINCT ls.user_id) as unique_users
FROM topics t
LEFT JOIN learning_sessions ls ON t.id = ls.topic_id
WHERE ls.status = 'completed'
  AND ls.completed_at >= NOW() - INTERVAL '30 days'
GROUP BY t.id, t.name, t.image
ORDER BY session_count DESC
LIMIT 10;
```

### 8.9. Từ được học nhiều nhất

```sql
SELECT 
  w.word,
  w.vietnamese_meaning,
  w.image_url,
  COUNT(lr.id) as learned_count,
  COUNT(DISTINCT lr.session_id) as session_count
FROM words w
JOIN learning_results lr ON w.id = lr.word_id
JOIN learning_sessions ls ON lr.session_id = ls.id
WHERE ls.completed_at >= NOW() - INTERVAL '30 days'
GROUP BY w.id, w.word, w.vietnamese_meaning, w.image_url
ORDER BY learned_count DESC
LIMIT 20;
```

### 8.10. Tiến độ học tập theo chủ đề

```sql
SELECT 
  t.id,
  t.name,
  COUNT(DISTINCT w.id) as total_words,
  COUNT(DISTINCT lp.word_id) as learned_words,
  ROUND(
    COUNT(DISTINCT lp.word_id) * 100.0 / NULLIF(COUNT(DISTINCT w.id), 0),
    2
  ) as progress_percentage
FROM topics t
LEFT JOIN words w ON t.id = w.topic_id
LEFT JOIN learning_progress lp ON w.id = lp.word_id AND lp.user_id = 'user-uuid-xxx'
WHERE t.status = 'active'
GROUP BY t.id, t.name
ORDER BY progress_percentage DESC;
```

---

## 9. DỮ LIỆU MẪU (SEED DATA)

### 9.1. Admin user
```sql
INSERT INTO users (id, full_name, email, password, role, status) VALUES
('admin-uuid-001', 'Admin', 'admin@flashcard.com', '$2b$10$hashed_password', 'admin', 'active');
```

### 9.2. Sample users
```sql
INSERT INTO users (id, full_name, email, password, role, status) VALUES
('user-uuid-001', 'Nguyễn Văn A', 'user1@example.com', '$2b$10$hashed_password', 'user', 'active'),
('user-uuid-002', 'Trần Thị B', 'user2@example.com', '$2b$10$hashed_password', 'user', 'active');
```

### 9.3. Topics
```sql
INSERT INTO topics (id, name, description, image, status, display_order) VALUES
('topic-001', 'Giao tiếp hàng ngày', 'Các từ vựng thường dùng trong giao tiếp', '/images/topics/daily.jpg', 'active', 1),
('topic-002', 'Gia đình', 'Từ vựng về các thành viên trong gia đình', '/images/topics/family.jpg', 'active', 2),
('topic-003', 'Đồ ăn', 'Tên các loại thức ăn, đồ uống', '/images/topics/food.jpg', 'active', 3),
('topic-004', 'Động vật', 'Tên các loài động vật phổ biến', '/images/topics/animals.jpg', 'active', 4),
('topic-005', 'Trường học', 'Từ vựng liên quan đến trường học', '/images/topics/school.jpg', 'active', 5);
```

### 9.4. Words (ví dụ chủ đề "Đồ ăn")
```sql
INSERT INTO words (id, topic_id, word, pronunciation, vietnamese_meaning, part_of_speech, audio_url, image_url, level, display_order) VALUES
('word-001', 'topic-003', 'Apple', '/ˈæpəl/', 'Quả táo', 'noun', '/audio/apple.mp3', '/images/words/apple.jpg', 'beginner', 1),
('word-002', 'topic-003', 'Banana', '/bəˈnænə/', 'Quả chuối', 'noun', '/audio/banana.mp3', '/images/words/banana.jpg', 'beginner', 2),
('word-003', 'topic-003', 'Bread', '/bred/', 'Bánh mì', 'noun', '/audio/bread.mp3', '/images/words/bread.jpg', 'beginner', 3),
('word-004', 'topic-003', 'Milk', '/mɪlk/', 'Sữa', 'noun', '/audio/milk.mp3', '/images/words/milk.jpg', 'beginner', 4),
('word-005', 'topic-003', 'Water', '/ˈwɔːtər/', 'Nước', 'noun', '/audio/water.mp3', '/images/words/water.jpg', 'beginner', 5);
```

### 9.5. Examples
```sql
INSERT INTO examples (id, word_id, english_sentence, vietnamese_sentence, display_order) VALUES
('ex-001', 'word-001', 'I eat an apple every day.', 'Tôi ăn một quả táo mỗi ngày.', 1),
('ex-002', 'word-001', 'This apple is very sweet.', 'Quả táo này rất ngọt.', 2),
('ex-003', 'word-002', 'She likes bananas.', 'Cô ấy thích chuối.', 1),
('ex-004', 'word-003', 'I want some bread.', 'Tôi muốn ít bánh mì.', 1),
('ex-005', 'word-004', 'He drinks milk every morning.', 'Anh ấy uống sữa mỗi sáng.', 1);
```

---

## 10. MIGRATION STRATEGY

### Phase 1: Core Tables
1. users
2. topics
3. words
4. examples

### Phase 2: Learning Features
5. favorites
6. learning_sessions
7. learning_results
8. learning_progress

### Phase 3: Seed Data
- Admin user
- Sample topics (5-10 topics)
- Sample words (50-100 words)
- Sample examples

---

## 11. BACKUP & MAINTENANCE

### Daily Backup
```sql
-- Backup toàn bộ database
pg_dump flashcard_db > backup_$(date +%Y%m%d).sql
```

### Weekly Analysis
```sql
-- Kiểm tra size của các bảng
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Index Maintenance
```sql
-- Reindex để tối ưu performance
REINDEX DATABASE flashcard_db;
```

---

## 12. TỔNG KẾT

### Số lượng bảng: 8
1. users
2. topics
3. words
4. examples
5. favorites
6. learning_sessions
7. learning_results
8. learning_progress

### Tính năng chính được hỗ trợ:
✅ Đăng ký / Đăng nhập
✅ Quản lý chủ đề và từ vựng
✅ Học từ qua Flashcard
✅ Đánh giá mức độ nhớ
✅ Ôn tập thông minh (Spaced Repetition)
✅ Từ yêu thích
✅ Theo dõi tiến độ
✅ Lịch sử học tập
✅ Thống kê (cho Admin)

### Database Size Estimate (1000 users, 2000 words):
- users: ~100KB
- topics: ~5KB
- words: ~500KB
- examples: ~300KB
- favorites: ~1MB (trung bình 50 favorites/user)
- learning_sessions: ~2MB
- learning_results: ~10MB
- learning_progress: ~5MB

**Total**: ~20MB (rất nhẹ)

---

**DONE! Database design hoàn chỉnh và chi tiết. 🎉**
