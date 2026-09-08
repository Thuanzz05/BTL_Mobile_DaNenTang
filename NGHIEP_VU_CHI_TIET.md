# TÀI LIỆU NGHIỆP VỤ CHI TIẾT - ỨNG DỤNG HỌC TỪ VỰNG QUA FLASHCARD

## 📋 MỤC LỤC
1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Người dùng hệ thống](#2-người-dùng-hệ-thống)
3. [Chức năng Mobile App](#3-chức-năng-mobile-app)
4. [Chức năng Web Admin](#4-chức-năng-web-admin)
5. [Nghiệp vụ chi tiết](#5-nghiệp-vụ-chi-tiết)
6. [Luồng xử lý](#6-luồng-xử-lý)
7. [Quy tắc nghiệp vụ](#7-quy-tắc-nghiệp-vụ)
8. [API Endpoints](#8-api-endpoints)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Mục tiêu
Xây dựng ứng dụng học từ vựng tiếng Anh qua **Flashcard** dành cho người mới bắt đầu học tiếng Anh.

### 1.2. Công nghệ
- **Mobile App**: React Native + Expo SDK 54
- **Web Admin**: React + Vite + TypeScript
- **Backend**: Node.js hoặc ASP.NET Core
- **Database**: MySQL
- **Authentication**: JWT (Local + Google OAuth)

### 1.3. Ngôn ngữ giao diện
- **Tiếng Việt** là ngôn ngữ chính của toàn bộ giao diện
- Phù hợp với người mới bắt đầu học tiếng Anh

---

## 2. NGƯỜI DÙNG HỆ THỐNG

### 2.1. User (Người học)
- Đăng ký, đăng nhập (Local hoặc Google)
- Học từ vựng qua Flashcard
- Đánh giá mức độ nhớ từ
- Ôn tập từ chưa nhớ
- Lưu từ yêu thích
- Xem tiến độ học tập
- Xem lịch sử học tập

### 2.2. Admin (Quản trị viên)
- Đăng nhập hệ thống Admin
- Quản lý người dùng
- Quản lý chủ đề từ vựng
- Quản lý từ vựng và ví dụ
- Upload file phát âm và hình ảnh
- Xem thống kê hệ thống

---

## 3. CHỨC NĂNG MOBILE APP

### 3.1. Đăng ký / Đăng nhập

#### Đăng ký Local
**Input:**
- Họ tên
- Email
- Mật khẩu
- Xác nhận mật khẩu

**Xử lý:**
- Validate email format
- Validate mật khẩu (tối thiểu 6 ký tự)
- Kiểm tra mật khẩu khớp
- Kiểm tra email đã tồn tại chưa
- Hash mật khẩu (bcrypt)
- Tạo user mới

**Output:**
- Thành công → Chuyển đến màn đăng nhập
- Lỗi → Hiển thị message tiếng Việt

#### Đăng nhập Local
**Input:**
- Email
- Mật khẩu

**Xử lý:**
- Kiểm tra email tồn tại
- So sánh password hash
- Tạo JWT token (access + refresh)
- Lưu token vào AsyncStorage

**Output:**
- Thành công → Chuyển đến Trang chủ
- Lỗi → "Email hoặc mật khẩu không chính xác"

#### Đăng nhập Google
**Xử lý:**
- Gọi Google OAuth API
- Lấy thông tin user từ Google
- Kiểm tra email đã tồn tại chưa
  - Nếu có → Đăng nhập
  - Nếu không → Tạo tài khoản mới
- Tạo JWT token

---

### 3.2. Trang chủ

**Hiển thị:**
```
Xin chào, Thuấn 👋
Hôm nay bạn muốn học gì?

[ Bắt đầu học ]

Tiến độ hôm nay
12 / 20 từ ████████░░ 60%

Chủ đề phổ biến
[ Giao tiếp ] [ Gia đình ] 
[ Đồ ăn ]     [ Trường học ]

Ôn tập
Bạn có 5 từ cần ôn lại.
[ Ôn tập ngay ]
```

**Dữ liệu cần load:**
- Tên user
- Tiến độ học hôm nay (từ bảng `hoat_dong_hoc_tap`)
- Top 4 chủ đề phổ biến
- Số từ cần ôn tập (query `tien_do_tu_vung`)

**API:**
```
GET /api/home/dashboard?userId={userId}
```

---

### 3.3. Danh sách chủ đề

**Hiển thị:**
- Tất cả chủ đề có `trang_thai = 'active'`
- Sắp xếp theo `thu_tu_hien_thi`

**Mỗi card chủ đề:**
- Hình ảnh
- Tên chủ đề
- Mô tả ngắn
- Số lượng từ
- Tiến độ học (nếu có)

**API:**
```
GET /api/topics?userId={userId}

Response:
{
  "success": true,
  "data": [
    {
      "id": "topic001",
      "ten": "Đồ ăn",
      "mo_ta": "Tên các loại thức ăn",
      "hinh_anh": "/images/food.jpg",
      "so_luong_tu": 20,
      "tien_do": 15,  // user đã học 15/20 từ
      "phan_tram": 75
    }
  ]
}
```

---

### 3.4. Danh sách từ vựng

**Khi user chọn 1 chủ đề:**
- Hiển thị tất cả từ của chủ đề đó
- Sắp xếp theo `thu_tu_hien_thi`

**Mỗi card từ:**
```
Apple              🔊 ❤️
Quả táo
```

**Tương tác:**
- Tap vào từ → Xem chi tiết
- Tap 🔊 → Phát âm
- Tap ❤️ → Thêm/Bỏ yêu thích

**API:**
```
GET /api/words?topicId={topicId}&userId={userId}

Response:
{
  "success": true,
  "data": [
    {
      "id": "word001",
      "tu_tieng_anh": "Apple",
      "nghia_tieng_viet": "Quả táo",
      "phien_am": "/ˈæpəl/",
      "url_am_thanh": "/audio/apple.mp3",
      "url_hinh_anh": "/images/apple.jpg",
      "da_yeu_thich": true
    }
  ]
}
```

---

### 3.5. Chi tiết từ vựng

**Hiển thị:**
```
┌─────────────────────┐
│  [← Back]     [❤️]  │
├─────────────────────┤
│                     │
│      Apple          │
│     /ˈæpəl/         │
│                     │
│    [  🔊 Nghe  ]    │
│                     │
│   🍎 [Hình ảnh]     │
│                     │
├─────────────────────┤
│                     │
│  Nghĩa: Quả táo     │
│  Loại từ: Danh từ   │
│                     │
│  Ví dụ:             │
│  I eat an apple     │
│  every day.         │
│                     │
│  Tôi ăn một quả táo │
│  mỗi ngày.          │
│                     │
└─────────────────────┘
```

**Chức năng:**
- Phát âm khi nhấn 🔊
- Thêm/Bỏ yêu thích
- Hiển thị tất cả ví dụ

**API:**
```
GET /api/words/{wordId}?userId={userId}

Response:
{
  "success": true,
  "data": {
    "id": "word001",
    "tu_tieng_anh": "Apple",
    "phien_am": "/ˈæpəl/",
    "nghia_tieng_viet": "Quả táo",
    "loai_tu": "danh-tu",
    "url_am_thanh": "/audio/apple.mp3",
    "url_hinh_anh": "/images/apple.jpg",
    "da_yeu_thich": true,
    "vi_du": [
      {
        "cau_tieng_anh": "I eat an apple every day.",
        "cau_tieng_viet": "Tôi ăn một quả táo mỗi ngày."
      }
    ]
  }
}
```

---

### 3.6. Học từ vựng qua Flashcard (CHÍNH)

**Bước 1: Bắt đầu học**
```
User chọn chủ đề → Nhấn "Bắt đầu học"
```

**Bước 2: Tạo phiên học (Session)**
```
POST /api/learning/start

Request:
{
  "nguoi_dung_id": "user001",
  "chu_de_id": "topic003",
  "tong_so_tu": 20
}

Response:
{
  "success": true,
  "data": {
    "phien_hoc_tap_id": "session001",
    "danh_sach_tu": [ ... ]  // 20 từ
  }
}
```

**Bước 3: Hiển thị Flashcard**

**Mặt trước (Front):**
```
┌─────────────────────┐
│                     │
│                     │
│       Apple         │
│                     │
│        🔊           │
│                     │
│   Chạm để xem nghĩa │
│                     │
│                     │
│  ← 1/20 →           │
└─────────────────────┘
```

**Mặt sau (Back):**
```
┌─────────────────────┐
│       Apple         │
│                     │
│     /ˈæpəl/         │
│                     │
│     Quả táo         │
│                     │
│ I eat an apple      │
│ every day.          │
│                     │
│ Tôi ăn một quả táo  │
│ mỗi ngày.           │
│                     │
│  ← 1/20 →           │
└─────────────────────┘
```

**Bước 4: Đánh giá mức độ nhớ**
```
Bạn có nhớ từ này không?

[ 😄 Đã nhớ ] 
[ 😐 Chưa chắc ] 
[ 😟 Chưa nhớ ]
```

**Xử lý:**
```javascript
// User chọn "Đã nhớ"
POST /api/learning/result

Request:
{
  "phien_hoc_tap_id": "session001",
  "tu_vung_id": "word001",
  "trang_thai": "da-nho"
}

// Backend xử lý:
1. INSERT vào bảng ket_qua_hoc
2. UPSERT vào bảng tien_do_tu_vung:
   - Nếu chưa có record → INSERT
   - Nếu đã có → UPDATE
   
   Nếu "Đã nhớ":
     trang_thai_nho = 'da-nho'
     ngay_on_tap_tiep_theo = NOW() + 3 ngày
     so_lan_on_tap++
     
   Nếu "Chưa chắc":
     trang_thai_nho = 'chua-chac'
     ngay_on_tap_tiep_theo = NOW() + 1 ngày
     so_lan_on_tap++
     
   Nếu "Chưa nhớ":
     trang_thai_nho = 'chua-nho'
     ngay_on_tap_tiep_theo = NOW()
     so_lan_on_tap++
```

**Bước 5: Chuyển sang từ tiếp theo**
- Lặp lại bước 3-4 cho tất cả 20 từ
- Có thể vuốt trái/phải để chuyển từ
- Có nút Back/Next

**Bước 6: Hoàn thành phiên học**
```
POST /api/learning/complete

Request:
{
  "phien_hoc_tap_id": "session001"
}

// Backend:
UPDATE phien_hoc_tap
SET trang_thai = 'hoan-thanh',
    ket_thuc_luc = NOW()
WHERE id = 'session001'
```

**Bước 7: Hiển thị kết quả**
```
🎉 Hoàn thành!

Bạn đã học 20 từ.

Đã nhớ: 15 từ
Chưa chắc: 3 từ
Chưa nhớ: 2 từ

Kết quả: 75%

[ Học lại ]
[ Ôn 2 từ chưa nhớ ]
[ Về trang chủ ]
```

**API:**
```
GET /api/learning/result/{sessionId}

Response:
{
  "success": true,
  "data": {
    "tong_so_tu": 20,
    "da_nho": 15,
    "chua_chac": 3,
    "chua_nho": 2,
    "ty_le": 75,
    "danh_sach_tu_chua_nho": [ ... ]
  }
}
```

---

### 3.7. Ôn tập

**Hiển thị:**
```
Ôn tập hôm nay

Bạn có 8 từ cần ôn lại.

[ Bắt đầu ôn tập ]
```

**Query từ cần ôn:**
```sql
SELECT tu_vung.* 
FROM tien_do_tu_vung
JOIN tu_vung ON tien_do_tu_vung.tu_vung_id = tu_vung.id
WHERE tien_do_tu_vung.nguoi_dung_id = 'user001'
  AND tien_do_tu_vung.trang_thai_nho IN ('chua-nho', 'chua-chac')
  AND tien_do_tu_vung.ngay_on_tap_tiep_theo <= NOW()
ORDER BY tien_do_tu_vung.ngay_on_tap_tiep_theo ASC
```

**Luồng ôn tập:**
- Giống luồng học từ mới
- Sử dụng Flashcard
- Đánh giá lại mức độ nhớ
- Cập nhật `tien_do_tu_vung`

**API:**
```
GET /api/learning/review?userId={userId}

Response:
{
  "success": true,
  "data": {
    "so_tu_can_on": 8,
    "danh_sach_tu": [ ... ]
  }
}
```

---

### 3.8. Từ yêu thích

**Hiển thị:**
- Danh sách tất cả từ đã thêm vào yêu thích
- Sắp xếp theo ngày thêm (mới nhất trước)

**Chức năng:**
- Xem chi tiết từ
- Nghe phát âm
- Bỏ khỏi yêu thích

**API:**
```
GET /api/favorites?userId={userId}

POST /api/favorites
{
  "nguoi_dung_id": "user001",
  "tu_vung_id": "word001"
}

DELETE /api/favorites/{favoriteId}
```

---

### 3.9. Tiến độ học tập

**Hiển thị:**
```
Tiến độ học tập

Tổng số từ đã học: 120
Đã nhớ: 90
Chưa chắc: 20
Chưa nhớ: 10

Tiến độ: ████████░░ 75%

━━━━━━━━━━━━━━━━━━━━━━

Thống kê chi tiết:

Hôm nay: 12 từ
Tuần này: 50 từ
Tháng này: 120 từ
```

**API:**
```
GET /api/progress?userId={userId}

Response:
{
  "success": true,
  "data": {
    "tong_so_tu_da_hoc": 120,
    "da_nho": 90,
    "chua_chac": 20,
    "chua_nho": 10,
    "ty_le": 75,
    "hom_nay": 12,
    "tuan_nay": 50,
    "thang_nay": 120
  }
}
```

---

### 3.10. Lịch sử học tập

**Hiển thị:**
```
Lịch sử học tập

04/09/2026 17:30
Học chủ đề: Đồ ăn
20 từ - Kết quả: 80%

03/09/2026 15:20
Ôn tập
10 từ

02/09/2026 19:00
Học chủ đề: Gia đình
15 từ - Kết quả: 90%
```

**API:**
```
GET /api/history?userId={userId}&limit=20

Response:
{
  "success": true,
  "data": [
    {
      "ngay": "2026-09-04T17:30:00",
      "loai": "hoc_moi",
      "chu_de": "Đồ ăn",
      "so_tu": 20,
      "ty_le": 80
    }
  ]
}
```

---

### 3.11. Hồ sơ cá nhân

**Hiển thị:**
```
┌─────────────────────┐
│   [  Ảnh đại diện ] │
│                     │
│  Nguyễn Văn Thuấn   │
│  thuan@example.com  │
├─────────────────────┤
│                     │
│  Số từ đã học: 120  │
│  Số ngày học: 15    │
│  Tiến độ: 75%       │
│                     │
├─────────────────────┤
│  [ Chỉnh sửa ]      │
│  [ Đổi mật khẩu ]   │
│  [ Đăng xuất ]      │
└─────────────────────┘
```

---

## 4. CHỨC NĂNG WEB ADMIN

### 4.1. Đăng nhập Admin
- Email + Password
- Chỉ cho phép `vai_tro = 'admin'`

### 4.2. Dashboard

**Hiển thị:**
```
Dashboard

┌──────────────┐ ┌──────────────┐
│ Người dùng   │ │ Từ vựng      │
│    1,250     │ │    2,500     │
└──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐
│ Chủ đề       │ │ Lượt học     │
│     25       │ │    8,320     │
└──────────────┘ └──────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Biểu đồ người dùng mới
[Chart: 7 ngày gần nhất]

Biểu đồ lượt học
[Chart: 7 ngày gần nhất]
```

**API:**
```
GET /api/admin/dashboard

Response:
{
  "success": true,
  "data": {
    "tong_nguoi_dung": 1250,
    "tong_tu_vung": 2500,
    "tong_chu_de": 25,
    "tong_luot_hoc": 8320,
    "nguoi_dung_moi_7_ngay": [ ... ],
    "luot_hoc_7_ngay": [ ... ]
  }
}
```

---

### 4.3. Quản lý người dùng

**Danh sách:**
```
Quản lý người dùng

[ Tìm kiếm: ___________ ] [ Lọc ▼ ]

+────────────────────────────────────────────────────+
| Họ tên          | Email          | Trạng thái | ... |
+────────────────────────────────────────────────────+
| Nguyễn Văn A    | a@example.com  | Active     | ✏️🔒|
| Trần Thị B      | b@example.com  | Active     | ✏️🔒|
+────────────────────────────────────────────────────+
```

**Chức năng:**
- Xem danh sách
- Tìm kiếm theo tên, email
- Lọc theo trạng thái
- Xem chi tiết user
- Khóa/Mở khóa tài khoản

**API:**
```
GET /api/admin/users?search=&status=&page=1&limit=20

PUT /api/admin/users/{userId}/status
{
  "trang_thai": "locked"  // hoặc "active"
}
```

---

### 4.4. Quản lý chủ đề

**Danh sách:**
```
Quản lý chủ đề

[ + Thêm chủ đề mới ]

+────────────────────────────────────────────+
| Tên chủ đề    | Mô tả          | Số từ | ... |
+────────────────────────────────────────────+
| Đồ ăn         | Các loại...    | 20    | ✏️🗑️|
| Gia đình      | Thành viên...  | 15    | ✏️🗑️|
+────────────────────────────────────────────+
```

**Form thêm/sửa:**
```
Thêm chủ đề mới

Tên chủ đề: [___________________]
Mô tả:      [___________________]
            [___________________]
Hình ảnh:   [ Chọn file ]
Trạng thái: [ Active ▼ ]
Thứ tự:     [___]

[ Hủy ]  [ Lưu ]
```

**API:**
```
GET    /api/admin/topics
POST   /api/admin/topics
PUT    /api/admin/topics/{topicId}
DELETE /api/admin/topics/{topicId}
```

---

### 4.5. Quản lý từ vựng

**Danh sách:**
```
Quản lý từ vựng

[ + Thêm từ mới ]

Chủ đề: [ Tất cả ▼ ] [ Tìm kiếm: _______ ]

+────────────────────────────────────────────────+
| Từ      | Phiên âm | Nghĩa      | Chủ đề | ... |
+────────────────────────────────────────────────+
| Apple   | /ˈæpəl/  | Quả táo    | Đồ ăn  | ✏️🗑️|
| Banana  | /bəˈnænə/| Quả chuối  | Đồ ăn  | ✏️🗑️|
+────────────────────────────────────────────────+
```

**Form thêm/sửa:**
```
Thêm từ vựng mới

Chủ đề:         [ Đồ ăn ▼ ]
Từ tiếng Anh:   [___________________]
Phiên âm:       [___________________]
Nghĩa TV:       [___________________]
Loại từ:        [ Danh từ ▼ ]

Hình ảnh:       [ Chọn file ]
File phát âm:   [ Chọn file MP3 ]

─── Ví dụ ───
Câu tiếng Anh:  [___________________]
Câu tiếng Việt: [___________________]
[ + Thêm ví dụ ]

[ Hủy ]  [ Lưu ]
```

**API:**
```
GET    /api/admin/words?topicId=&search=&page=1
POST   /api/admin/words
PUT    /api/admin/words/{wordId}
DELETE /api/admin/words/{wordId}

POST   /api/admin/upload/audio (multipart/form-data)
POST   /api/admin/upload/image (multipart/form-data)
```

---

### 4.6. Thống kê

**Hiển thị:**
```
Thống kê học tập

┌─────────────────────────────────┐
│ Chủ đề được học nhiều nhất      │
│ 1. Đồ ăn        - 1,200 lượt    │
│ 2. Gia đình     - 980 lượt      │
│ 3. Động vật     - 850 lượt      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Từ được học nhiều nhất          │
│ 1. Apple        - 500 lượt      │
│ 2. Hello        - 450 lượt      │
│ 3. Thank you    - 400 lượt      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Hoạt động học tập (7 ngày)      │
│ [Biểu đồ cột]                   │
└─────────────────────────────────┘
```

**API:**
```
GET /api/admin/statistics

Response:
{
  "chu_de_pho_bien": [ ... ],
  "tu_pho_bien": [ ... ],
  "hoat_dong_7_ngay": [ ... ]
}
```

---

## 5. NGHIỆP VỤ CHI TIẾT

### 5.1. Spaced Repetition System (SRS)

**Mục đích:** Tối ưu hóa việc ôn tập từ vựng

**Thuật toán:**

```javascript
function calculateNextReviewDate(status, reviewCount) {
  let days = 0;
  
  switch(status) {
    case 'da-nho':
      // Đã nhớ → ôn lại sau lâu hơn
      if (reviewCount === 1) days = 1;
      else if (reviewCount === 2) days = 3;
      else if (reviewCount === 3) days = 7;
      else if (reviewCount === 4) days = 14;
      else if (reviewCount >= 5) days = 30;
      break;
      
    case 'chua-chac':
      // Chưa chắc → ôn lại sau 1 ngày
      days = 1;
      break;
      
    case 'chua-nho':
      // Chưa nhớ → ôn lại ngay hôm nay
      days = 0;
      break;
  }
  
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

// Ví dụ:
// Lần 1: Đã nhớ → ôn lại sau 1 ngày
// Lần 2: Đã nhớ → ôn lại sau 3 ngày
// Lần 3: Đã nhớ → ôn lại sau 7 ngày
// Lần 4: Đã nhớ → ôn lại sau 14 ngày
// Lần 5+: Đã nhớ → ôn lại sau 30 ngày

// Nếu chọn "Chưa nhớ" → Reset về ôn ngay
```

**Cập nhật tiến độ:**
```sql
-- UPSERT vào tien_do_tu_vung
INSERT INTO tien_do_tu_vung (
  nguoi_dung_id, 
  tu_vung_id, 
  da_hoc, 
  so_lan_on_tap, 
  trang_thai_nho, 
  ngay_on_tap_tiep_theo,
  lan_on_tap_cuoi
) VALUES (
  'user001',
  'word001',
  TRUE,
  1,
  'da-nho',
  DATE_ADD(NOW(), INTERVAL 1 DAY),
  NOW()
)
ON DUPLICATE KEY UPDATE
  da_hoc = TRUE,
  so_lan_on_tap = so_lan_on_tap + 1,
  trang_thai_nho = 'da-nho',
  ngay_on_tap_tiep_theo = DATE_ADD(NOW(), INTERVAL 1 DAY),
  lan_on_tap_cuoi = NOW();
```

---

### 5.2. Gamification (Tính năng mở rộng)

**Thành tích (Achievements):**
- Bước đầu tiên: Hoàn thành phiên học đầu tiên
- Người chăm chỉ: Học 3 ngày liên tục
- Học giả: Học được 50 từ
- Bậc thầy: Học được 100 từ

**Điểm kinh nghiệm (XP):**
- Hoàn thành 1 phiên học: +100 XP
- Đánh giá "Đã nhớ": +10 XP
- Ôn tập 1 từ: +5 XP
- Mở khóa thành tích: +50-500 XP

---

## 6. LUỒNG XỬ LÝ

### 6.1. Luồng học từ mới

```
1. User chọn chủ đề "Đồ ăn"
   ↓
2. Mobile gọi: POST /api/learning/start
   Body: { nguoi_dung_id, chu_de_id, tong_so_tu: 20 }
   ↓
3. Backend:
   - Query 20 từ của chủ đề
   - INSERT vào phien_hoc_tap
   - Trả về danh sách 20 từ
   ↓
4. Mobile hiển thị Flashcard từng từ
   ↓
5. User xem từ → Đánh giá "Đã nhớ" / "Chưa nhớ"
   ↓
6. Mobile gọi: POST /api/learning/result
   Body: { phien_hoc_tap_id, tu_vung_id, trang_thai }
   ↓
7. Backend:
   - INSERT vào ket_qua_hoc
   - UPSERT vào tien_do_tu_vung (SRS)
   ↓
8. Lặp lại bước 4-7 cho 20 từ
   ↓
9. Hết 20 từ → Mobile gọi: POST /api/learning/complete
   ↓
10. Backend:
    - UPDATE phien_hoc_tap.trang_thai = 'hoan-thanh'
    - INSERT vào hoat_dong_hoc_tap
    ↓
11. Mobile gọi: GET /api/learning/result/{sessionId}
    ↓
12. Backend:
    - Query kết quả từ ket_qua_hoc
    - Tính toán thống kê
    - Trả về: đã nhớ, chưa nhớ, tỷ lệ
    ↓
13. Mobile hiển thị kết quả
```

---

### 6.2. Luồng ôn tập

```
1. User vào màn "Ôn tập"
   ↓
2. Mobile gọi: GET /api/learning/review?userId=user001
   ↓
3. Backend query:
   SELECT tu_vung.*
   FROM tien_do_tu_vung
   JOIN tu_vung ON tien_do_tu_vung.tu_vung_id = tu_vung.id
   WHERE nguoi_dung_id = 'user001'
     AND trang_thai_nho IN ('chua-nho', 'chua-chac')
     AND ngay_on_tap_tiep_theo <= NOW()
   ↓
4. Trả về danh sách từ cần ôn
   ↓
5. Giống luồng học từ mới (từ bước 4)
```

---

## 7. QUY TẮC NGHIỆP VỤ

### 7.1. Authentication
- Mật khẩu tối thiểu 6 ký tự
- Email phải unique
- JWT token expire: 7 ngày
- Refresh token expire: 30 ngày

### 7.2. Flashcard
- Tối thiểu 5 từ, tối đa 50 từ mỗi phiên
- Phải đánh giá tất cả các từ mới hoàn thành
- Không thể bỏ qua từ

### 7.3. Ôn tập
- Chỉ hiển thị từ có `ngay_on_tap_tiep_theo <= NOW()`
- Sắp xếp theo ngày cần ôn (từ cũ nhất trước)
- Giới hạn 50 từ mỗi lần ôn

### 7.4. Admin
- Không thể xóa chủ đề đang có từ vựng
- Không thể xóa từ đang có trong phiên học
- Upload file:
  - Audio: MP3, tối đa 5MB
  - Image: JPG/PNG, tối đa 2MB

---

## 8. API ENDPOINTS

### 8.1. Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/google
POST   /api/auth/refresh
POST   /api/auth/logout
```

### 8.2. Topics
```
GET    /api/topics?userId={userId}
GET    /api/topics/{topicId}
```

### 8.3. Words
```
GET    /api/words?topicId={topicId}&userId={userId}
GET    /api/words/{wordId}
```

### 8.4. Favorites
```
GET    /api/favorites?userId={userId}
POST   /api/favorites
DELETE /api/favorites/{favoriteId}
```

### 8.5. Learning
```
POST   /api/learning/start
POST   /api/learning/result
POST   /api/learning/complete
GET    /api/learning/result/{sessionId}
GET    /api/learning/review?userId={userId}
```

### 8.6. Progress
```
GET    /api/progress?userId={userId}
GET    /api/history?userId={userId}&limit=20
```

### 8.7. Admin
```
GET    /api/admin/dashboard
GET    /api/admin/users
PUT    /api/admin/users/{userId}/status

GET    /api/admin/topics
POST   /api/admin/topics
PUT    /api/admin/topics/{topicId}
DELETE /api/admin/topics/{topicId}

GET    /api/admin/words
POST   /api/admin/words
PUT    /api/admin/words/{wordId}
DELETE /api/admin/words/{wordId}

POST   /api/admin/upload/audio
POST   /api/admin/upload/image

GET    /api/admin/statistics
```

---

## 9. LƯU Ý KỸ THUẬT

### 9.1. Performance
- Index các cột thường query: `ngay_on_tap_tiep_theo`, `nguoi_dung_id`
- Cache danh sách chủ đề (ít thay đổi)
- Pagination cho danh sách dài

### 9.2. Security
- Validate input tất cả API
- Sanitize dữ liệu trước khi lưu DB
- Rate limiting cho API
- HTTPS only

### 9.3. UX
- Loading state khi fetch data
- Empty state khi không có dữ liệu
- Error handling với message tiếng Việt
- Confirmation dialog trước khi xóa

---

**KẾT THÚC TÀI LIỆU NGHIỆP VỤ** 🎉
