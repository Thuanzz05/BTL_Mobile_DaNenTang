USE hoc_tu_vung;

-- ==========================================
-- DỮ LIỆU MẪU - FLASHCARD APP
-- ==========================================

-- XÓA DỮ LIỆU CŨ
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE thanh_tich_nguoi_dung;
TRUNCATE TABLE thanh_tich;
TRUNCATE TABLE hoat_dong_hoc_tap;
TRUNCATE TABLE tien_do_tu_vung;
TRUNCATE TABLE ket_qua_hoc;
TRUNCATE TABLE phien_hoc_tap;
TRUNCATE TABLE yeu_thich;
TRUNCATE TABLE vi_du;
TRUNCATE TABLE tu_vung;
TRUNCATE TABLE chu_de;
TRUNCATE TABLE token_lam_moi;
TRUNCATE TABLE nguoi_dung;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- 1. NGƯỜI DÙNG
-- ==========================================

-- Admin (password: admin123)
INSERT INTO nguoi_dung (id, ho_ten, email, mat_khau_hash, phuong_thuc_dang_nhap, vai_tro) VALUES
('admin001-0000-0000-0000-000000000001', 'Quản Trị Viên', 'admin@hoctuvung.vn', '$2b$10$Atg4B785eqXXtkdTzjnm9OAzDvwpgbbinjiIjjOIWdIxlNfucMP7q', 'local', 'admin');

-- Users (password: user123)
INSERT INTO nguoi_dung (id, ho_ten, email, mat_khau_hash, phuong_thuc_dang_nhap, vai_tro) VALUES
('user0001-0000-0000-0000-000000000001', 'Nguyễn Văn Thuấn', 'thuan@example.com', '$2b$10$Atg4B785eqXXtkdTzjnm9OAzDvwpgbbinjiIjjOIWdIxlNfucMP7q', 'local', 'user'),
('user0002-0000-0000-0000-000000000002', 'Trần Thị Mai', 'mai@example.com', '$2b$10$Atg4B785eqXXtkdTzjnm9OAzDvwpgbbinjiIjjOIWdIxlNfucMP7q', 'local', 'user'),
('user0003-0000-0000-0000-000000000003', 'Lê Quang Hùng', 'hung@example.com', NULL, 'google', 'user');

-- ==========================================
-- 2. CHỦ ĐỀ
-- ==========================================

INSERT INTO chu_de (id, ten, mo_ta, hinh_anh, trang_thai, thu_tu_hien_thi) VALUES
('topic001-0000-0000-0000-000000000001', 'Giao tiếp hàng ngày', 'Các từ vựng thường dùng trong giao tiếp', '/images/topics/daily.jpg', 'active', 1),
('topic002-0000-0000-0000-000000000002', 'Gia đình', 'Từ vựng về các thành viên trong gia đình', '/images/topics/family.jpg', 'active', 2),
('topic003-0000-0000-0000-000000000003', 'Đồ ăn', 'Tên các loại thức ăn, đồ uống', '/images/topics/food.jpg', 'active', 3),
('topic004-0000-0000-0000-000000000004', 'Động vật', 'Tên các loài động vật phổ biến', '/images/topics/animals.jpg', 'active', 4),
('topic005-0000-0000-0000-000000000005', 'Trường học', 'Từ vựng liên quan đến trường học', '/images/topics/school.jpg', 'active', 5),
('topic006-0000-0000-0000-000000000006', 'Công việc', 'Từ vựng về nghề nghiệp và công việc', '/images/topics/work.jpg', 'active', 6),
('topic007-0000-0000-0000-000000000007', 'Du lịch', 'Từ vựng khi đi du lịch', '/images/topics/travel.jpg', 'active', 7),
('topic008-0000-0000-0000-000000000008', 'Mua sắm', 'Từ vựng về mua sắm', '/images/topics/shopping.jpg', 'active', 8),
('topic009-0000-0000-0000-000000000009', 'Thời tiết', 'Từ vựng mô tả thời tiết', '/images/topics/weather.jpg', 'active', 9);

-- ==========================================
-- 3. TỪ VỰNG
-- ==========================================

-- Chủ đề: Đồ ăn
INSERT INTO tu_vung (id, chu_de_id, tu_tieng_anh, phien_am, loai_tu, nghia_tieng_viet, url_am_thanh, url_hinh_anh, thu_tu_hien_thi) VALUES
('word0001-0000-0000-0000-000000000001', 'topic003-0000-0000-0000-000000000003', 'Apple', '/ˈæpəl/', 'danh-tu', 'Quả táo', '/audio/apple.mp3', '/images/words/apple.jpg', 1),
('word0002-0000-0000-0000-000000000002', 'topic003-0000-0000-0000-000000000003', 'Banana', '/bəˈnænə/', 'danh-tu', 'Quả chuối', '/audio/banana.mp3', '/images/words/banana.jpg', 2),
('word0003-0000-0000-0000-000000000003', 'topic003-0000-0000-0000-000000000003', 'Bread', '/bred/', 'danh-tu', 'Bánh mì', '/audio/bread.mp3', '/images/words/bread.jpg', 3),
('word0004-0000-0000-0000-000000000004', 'topic003-0000-0000-0000-000000000003', 'Milk', '/mɪlk/', 'danh-tu', 'Sữa', '/audio/milk.mp3', '/images/words/milk.jpg', 4),
('word0005-0000-0000-0000-000000000005', 'topic003-0000-0000-0000-000000000003', 'Water', '/ˈwɔːtər/', 'danh-tu', 'Nước', '/audio/water.mp3', '/images/words/water.jpg', 5),
('word0006-0000-0000-0000-000000000006', 'topic003-0000-0000-0000-000000000003', 'Rice', '/raɪs/', 'danh-tu', 'Gạo, cơm', '/audio/rice.mp3', '/images/words/rice.jpg', 6),
('word0007-0000-0000-0000-000000000007', 'topic003-0000-0000-0000-000000000003', 'Egg', '/eɡ/', 'danh-tu', 'Trứng', '/audio/egg.mp3', '/images/words/egg.jpg', 7),
('word0008-0000-0000-0000-000000000008', 'topic003-0000-0000-0000-000000000003', 'Fish', '/fɪʃ/', 'danh-tu', 'Cá', '/audio/fish.mp3', '/images/words/fish.jpg', 8),
('word0009-0000-0000-0000-000000000009', 'topic003-0000-0000-0000-000000000003', 'Chicken', '/ˈtʃɪkɪn/', 'danh-tu', 'Thịt gà', '/audio/chicken.mp3', '/images/words/chicken.jpg', 9),
('word0010-0000-0000-0000-000000000010', 'topic003-0000-0000-0000-000000000003', 'Vegetable', '/ˈvedʒtəbl/', 'danh-tu', 'Rau củ', '/audio/vegetable.mp3', '/images/words/vegetable.jpg', 10);

-- Chủ đề: Gia đình
INSERT INTO tu_vung (id, chu_de_id, tu_tieng_anh, phien_am, loai_tu, nghia_tieng_viet, url_am_thanh, url_hinh_anh, thu_tu_hien_thi) VALUES
('word0011-0000-0000-0000-000000000011', 'topic002-0000-0000-0000-000000000002', 'Father', '/ˈfɑːðər/', 'danh-tu', 'Cha, bố', '/audio/father.mp3', '/images/words/father.jpg', 1),
('word0012-0000-0000-0000-000000000012', 'topic002-0000-0000-0000-000000000002', 'Mother', '/ˈmʌðər/', 'danh-tu', 'Mẹ', '/audio/mother.mp3', '/images/words/mother.jpg', 2),
('word0013-0000-0000-0000-000000000013', 'topic002-0000-0000-0000-000000000002', 'Brother', '/ˈbrʌðər/', 'danh-tu', 'Anh trai, em trai', '/audio/brother.mp3', '/images/words/brother.jpg', 3),
('word0014-0000-0000-0000-000000000014', 'topic002-0000-0000-0000-000000000002', 'Sister', '/ˈsɪstər/', 'danh-tu', 'Chị gái, em gái', '/audio/sister.mp3', '/images/words/sister.jpg', 4),
('word0015-0000-0000-0000-000000000015', 'topic002-0000-0000-0000-000000000002', 'Grandfather', '/ˈɡrændˌfɑːðər/', 'danh-tu', 'Ông (nội/ngoại)', '/audio/grandfather.mp3', '/images/words/grandfather.jpg', 5),
('word0016-0000-0000-0000-000000000016', 'topic002-0000-0000-0000-000000000002', 'Grandmother', '/ˈɡrænˌmʌðər/', 'danh-tu', 'Bà (nội/ngoại)', '/audio/grandmother.mp3', '/images/words/grandmother.jpg', 6),
('word0017-0000-0000-0000-000000000017', 'topic002-0000-0000-0000-000000000002', 'Uncle', '/ˈʌŋkl/', 'danh-tu', 'Chú, bác, cậu', '/audio/uncle.mp3', '/images/words/uncle.jpg', 7),
('word0018-0000-0000-0000-000000000018', 'topic002-0000-0000-0000-000000000002', 'Aunt', '/ænt/', 'danh-tu', 'Cô, dì, bác gái', '/audio/aunt.mp3', '/images/words/aunt.jpg', 8);

-- Chủ đề: Động vật
INSERT INTO tu_vung (id, chu_de_id, tu_tieng_anh, phien_am, loai_tu, nghia_tieng_viet, url_am_thanh, url_hinh_anh, thu_tu_hien_thi) VALUES
('word0019-0000-0000-0000-000000000019', 'topic004-0000-0000-0000-000000000004', 'Dog', '/dɒɡ/', 'danh-tu', 'Chó', '/audio/dog.mp3', '/images/words/dog.jpg', 1),
('word0020-0000-0000-0000-000000000020', 'topic004-0000-0000-0000-000000000004', 'Cat', '/kæt/', 'danh-tu', 'Mèo', '/audio/cat.mp3', '/images/words/cat.jpg', 2),
('word0021-0000-0000-0000-000000000021', 'topic004-0000-0000-0000-000000000004', 'Bird', '/bɜːd/', 'danh-tu', 'Chim', '/audio/bird.mp3', '/images/words/bird.jpg', 3),
('word0022-0000-0000-0000-000000000022', 'topic004-0000-0000-0000-000000000004', 'Elephant', '/ˈelɪfənt/', 'danh-tu', 'Voi', '/audio/elephant.mp3', '/images/words/elephant.jpg', 4),
('word0023-0000-0000-0000-000000000023', 'topic004-0000-0000-0000-000000000004', 'Lion', '/ˈlaɪən/', 'danh-tu', 'Sư tử', '/audio/lion.mp3', '/images/words/lion.jpg', 5);

-- ==========================================
-- 4. VÍ DỤ
-- ==========================================

INSERT INTO vi_du (id, tu_vung_id, cau_tieng_anh, cau_tieng_viet, thu_tu_hien_thi) VALUES
-- Apple
('exam0001-0000-0000-0000-000000000001', 'word0001-0000-0000-0000-000000000001', 'I eat an apple every day.', 'Tôi ăn một quả táo mỗi ngày.', 1),
('exam0002-0000-0000-0000-000000000002', 'word0001-0000-0000-0000-000000000001', 'This apple is very sweet.', 'Quả táo này rất ngọt.', 2),
-- Banana
('exam0003-0000-0000-0000-000000000003', 'word0002-0000-0000-0000-000000000002', 'She likes bananas.', 'Cô ấy thích chuối.', 1),
('exam0004-0000-0000-0000-000000000004', 'word0002-0000-0000-0000-000000000002', 'Bananas are yellow.', 'Chuối có màu vàng.', 2),
-- Bread
('exam0005-0000-0000-0000-000000000005', 'word0003-0000-0000-0000-000000000003', 'I want some bread.', 'Tôi muốn ít bánh mì.', 1),
-- Milk
('exam0006-0000-0000-0000-000000000006', 'word0004-0000-0000-0000-000000000004', 'He drinks milk every morning.', 'Anh ấy uống sữa mỗi sáng.', 1),
-- Water
('exam0007-0000-0000-0000-000000000007', 'word0005-0000-0000-0000-000000000005', 'We need water to live.', 'Chúng ta cần nước để sống.', 1),
-- Father
('exam0008-0000-0000-0000-000000000008', 'word0011-0000-0000-0000-000000000011', 'My father is a teacher.', 'Bố tôi là giáo viên.', 1),
-- Mother
('exam0009-0000-0000-0000-000000000009', 'word0012-0000-0000-0000-000000000012', 'My mother loves cooking.', 'Mẹ tôi thích nấu ăn.', 1),
-- Dog
('exam0010-0000-0000-0000-000000000010', 'word0019-0000-0000-0000-000000000019', 'I have a dog.', 'Tôi có một con chó.', 1),
-- Cat
('exam0011-0000-0000-0000-000000000011', 'word0020-0000-0000-0000-000000000020', 'The cat is sleeping.', 'Con mèo đang ngủ.', 1);

-- ==========================================
-- 5. YÊU THÍCH
-- ==========================================

INSERT INTO yeu_thich (id, nguoi_dung_id, tu_vung_id) VALUES
('fav00001-0000-0000-0000-000000000001', 'user0001-0000-0000-0000-000000000001', 'word0001-0000-0000-0000-000000000001'),
('fav00002-0000-0000-0000-000000000002', 'user0001-0000-0000-0000-000000000001', 'word0005-0000-0000-0000-000000000005'),
('fav00003-0000-0000-0000-000000000003', 'user0001-0000-0000-0000-000000000001', 'word0011-0000-0000-0000-000000000011');

-- ==========================================
-- 6. PHIÊN HỌC TẬP (Flashcard Sessions)
-- ==========================================

INSERT INTO phien_hoc_tap (id, nguoi_dung_id, chu_de_id, tong_so_tu, bat_dau_luc, ket_thuc_luc, trang_thai) VALUES
-- Thuấn học chủ đề Đồ ăn hôm qua
('session1-0000-0000-0000-000000000001', 'user0001-0000-0000-0000-000000000001', 'topic003-0000-0000-0000-000000000003', 10, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 'hoan-thanh'),
-- Thuấn học chủ đề Gia đình hôm nay
('session2-0000-0000-0000-000000000002', 'user0001-0000-0000-0000-000000000001', 'topic002-0000-0000-0000-000000000002', 8, NOW(), NULL, 'dang-hoc');

-- ==========================================
-- 7. KẾT QUẢ HỌC (Flashcard Results)
-- ==========================================

INSERT INTO ket_qua_hoc (id, phien_hoc_tap_id, tu_vung_id, trang_thai) VALUES
-- Session 1: Đồ ăn (10 từ)
('result01-0000-0000-0000-000000000001', 'session1-0000-0000-0000-000000000001', 'word0001-0000-0000-0000-000000000001', 'da-nho'),
('result02-0000-0000-0000-000000000002', 'session1-0000-0000-0000-000000000001', 'word0002-0000-0000-0000-000000000002', 'da-nho'),
('result03-0000-0000-0000-000000000003', 'session1-0000-0000-0000-000000000001', 'word0003-0000-0000-0000-000000000003', 'chua-nho'),
('result04-0000-0000-0000-000000000004', 'session1-0000-0000-0000-000000000001', 'word0004-0000-0000-0000-000000000004', 'da-nho'),
('result05-0000-0000-0000-000000000005', 'session1-0000-0000-0000-000000000001', 'word0005-0000-0000-0000-000000000005', 'chua-chac'),
('result06-0000-0000-0000-000000000006', 'session1-0000-0000-0000-000000000001', 'word0006-0000-0000-0000-000000000006', 'da-nho'),
('result07-0000-0000-0000-000000000007', 'session1-0000-0000-0000-000000000001', 'word0007-0000-0000-0000-000000000007', 'chua-nho'),
('result08-0000-0000-0000-000000000008', 'session1-0000-0000-0000-000000000001', 'word0008-0000-0000-0000-000000000008', 'da-nho'),
('result09-0000-0000-0000-000000000009', 'session1-0000-0000-0000-000000000001', 'word0009-0000-0000-0000-000000000009', 'da-nho'),
('result10-0000-0000-0000-000000000010', 'session1-0000-0000-0000-000000000001', 'word0010-0000-0000-0000-000000000010', 'chua-chac');

-- ==========================================
-- 8. TIẾN ĐỘ TỪ VỰNG (Spaced Repetition)
-- ==========================================

INSERT INTO tien_do_tu_vung (nguoi_dung_id, tu_vung_id, da_hoc, yeu_thich, so_lan_on_tap, trang_thai_nho, ngay_on_tap_tiep_theo, lan_on_tap_cuoi) VALUES
-- Từ đã học và CẦN ÔN TẬP HÔM NAY
('user0001-0000-0000-0000-000000000001', 'word0001-0000-0000-0000-000000000001', TRUE, TRUE, 3, 'da-nho', DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('user0001-0000-0000-0000-000000000001', 'word0003-0000-0000-0000-000000000003', TRUE, FALSE, 1, 'chua-nho', NOW(), DATE_SUB(NOW(), INTERVAL 1 DAY)),
('user0001-0000-0000-0000-000000000001', 'word0007-0000-0000-0000-000000000007', TRUE, FALSE, 1, 'chua-nho', NOW(), DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Từ đã học, chưa cần ôn
('user0001-0000-0000-0000-000000000001', 'word0002-0000-0000-0000-000000000002', TRUE, FALSE, 1, 'da-nho', DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
('user0001-0000-0000-0000-000000000001', 'word0004-0000-0000-0000-000000000004', TRUE, FALSE, 1, 'da-nho', DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Từ yêu thích nhưng chưa học
('user0001-0000-0000-0000-000000000001', 'word0005-0000-0000-0000-000000000005', FALSE, TRUE, 0, 'chua-hoc', NULL, NULL),
('user0001-0000-0000-0000-000000000001', 'word0011-0000-0000-0000-000000000011', FALSE, TRUE, 0, 'chua-hoc', NULL, NULL);

-- ==========================================
-- 9. THÀNH TÍCH
-- ==========================================

INSERT INTO thanh_tich (id, tieu_de, mo_ta, bieu_tuong, diem_thuong) VALUES
('achv0001-0000-0000-0000-000000000001', 'Bước đầu tiên', 'Hoàn thành phiên học đầu tiên', 'medal', 50),
('achv0002-0000-0000-0000-000000000002', 'Người chăm chỉ', 'Học 3 ngày liên tục', 'flame', 100),
('achv0003-0000-0000-0000-000000000003', 'Học giả', 'Học được 50 từ mới', 'book', 200),
('achv0004-0000-0000-0000-000000000004', 'Bậc thầy', 'Học được 100 từ mới', 'star', 500);

INSERT INTO thanh_tich_nguoi_dung (nguoi_dung_id, thanh_tich_id) VALUES
('user0001-0000-0000-0000-000000000001', 'achv0001-0000-0000-0000-000000000001');

-- ==========================================
-- 10. HOẠT ĐỘNG HỌC TẬP
-- ==========================================

INSERT INTO hoat_dong_hoc_tap (id, nguoi_dung_id, loai_hoat_dong, mo_ta, diem_kinh_nghiem) VALUES
('act00001-0000-0000-0000-000000000001', 'user0001-0000-0000-0000-000000000001', 'hoan_thanh_session', 'Hoàn thành học chủ đề: Đồ ăn - 10 từ', 100),
('act00002-0000-0000-0000-000000000002', 'user0001-0000-0000-0000-000000000001', 'them_yeu_thich', 'Thêm từ "Apple" vào yêu thích', 5),
('act00003-0000-0000-0000-000000000003', 'user0001-0000-0000-0000-000000000001', 'on_tap', 'Ôn tập 3 từ', 30);

-- ==========================================
-- KẾT THÚC SEED DATA
-- ==========================================

SELECT '✅ Đã thêm dữ liệu mẫu thành công!' AS thong_bao;

-- Kiểm tra dữ liệu
SELECT 
    'Tổng quan dữ liệu' AS loai,
    '' AS ten_bang,
    '' AS so_luong
UNION ALL
SELECT '', 'Người dùng:', COUNT(*) FROM nguoi_dung
UNION ALL
SELECT '', 'Chủ đề:', COUNT(*) FROM chu_de
UNION ALL
SELECT '', 'Từ vựng:', COUNT(*) FROM tu_vung
UNION ALL
SELECT '', 'Ví dụ:', COUNT(*) FROM vi_du
UNION ALL
SELECT '', 'Yêu thích:', COUNT(*) FROM yeu_thich
UNION ALL
SELECT '', 'Phiên học:', COUNT(*) FROM phien_hoc_tap
UNION ALL
SELECT '', 'Kết quả học:', COUNT(*) FROM ket_qua_hoc
UNION ALL
SELECT '', 'Tiến độ từ vựng:', COUNT(*) FROM tien_do_tu_vung
UNION ALL
SELECT '', 'Thành tích:', COUNT(*) FROM thanh_tich
UNION ALL
SELECT '', 'Hoạt động:', COUNT(*) FROM hoat_dong_hoc_tap;
