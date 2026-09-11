# REACT NATIVE CODING RULES & BEST PRACTICES

## I. KIẾN TRÚC & CẤU TRÚC DỰ ÁN

### 1. Công nghệ Stack
- Framework: React Native + Expo SDK 54
- Language: TypeScript
- Navigation: Expo Router
- Styling: StyleSheet + Flexbox
- State: useState, useEffect, useContext
- APIs: RESTful với Axios
- Storage: AsyncStorage

### 2. Cấu trúc thư mục chuẩn
```
app/          - Screens (Expo Router)
components/   - Reusable components
constants/    - Theme, colors
hooks/        - Custom hooks
assets/       - Images, fonts
utils/        - Utility functions
services/     - API calls
```

---

## II. COMPONENTS

### 1. Functional Components (ƯU TIÊN)
- Luôn dùng Functional Component với Hooks
- Đặt tên PascalCase: UserProfile, ButtonAction
- Mỗi component 1 file riêng
- Export named (không dùng default export)

### 2. Nguyên tắc Component
- Independent: Độc lập
- Reusable: Tái sử dụng được
- Encapsulated: Đóng gói logic
- Single Responsibility: 1 nhiệm vụ

### 3. Props & State
- Props: Read-only, truyền từ cha sang con
- State: Quản lý dữ liệu thay đổi trong component
- Luôn define TypeScript interface cho props

---

## III. HOOKS

### 1. Hooks bắt buộc biết
- useState: Quản lý state
- useEffect: Side effects, gọi API
- useContext: Share data globally
- useCallback: Memoize functions
- useMemo: Memoize values

### 2. Quy tắc Hooks
- Chỉ gọi ở top level (không gọi trong loop, if)
- Chỉ gọi trong Functional Component
- Đặt tên custom hooks: use + TênChứcNăng

---

## IV. STYLING

### 1. StyleSheet (BẮT BUỘC)
- Luôn dùng StyleSheet.create()
- KHÔNG dùng inline style
- Tách style ra khỏi JSX

### 2. Flexbox Layout
- flexDirection: row | column
- justifyContent: flex-start | center | flex-end | space-between
- alignItems: flex-start | center | flex-end | stretch
- flex: số để chia tỷ lệ

### 3. Responsive Design
- Dùng Dimensions.get('window')
- Tránh hardcode kích thước
- Test trên nhiều màn hình

---

## V. NAVIGATION

### 1. Expo Router (File-based)
- app/index.tsx: Home screen
- app/(tabs)/_layout.tsx: Tab layout
- app/[id].tsx: Dynamic routes

### 2. Navigation Best Practices
- Dùng Link component của Expo Router
- Truyền params qua href
- Xử lý back button

---

## VI. API & DATA

### 1. Gọi API
- Dùng axios hoặc fetch
- Gọi trong useEffect
- Xử lý loading, error, success states
- Dùng try-catch

### 2. Lưu trữ dữ liệu
- AsyncStorage: Key-value storage
- Lưu token, user data
- JSON.stringify/parse khi lưu object

---

## VII. CODE QUALITY

### 1. TypeScript
- Luôn define types/interfaces
- Tránh dùng any
- Enable strict mode

### 2. Clean Code
- Tên biến rõ ràng, có ý nghĩa
- Function ngắn gọn (< 20 lines)
- Comment khi logic phức tạp
- Tách logic ra custom hooks

### 3. Git Commit
- feat: Thêm tính năng mới
- fix: Sửa lỗi
- style: Format code
- refactor: Tái cấu trúc

---

## VIII. PERFORMANCE

### 1. Tối ưu Render
- Dùng React.memo() cho component không thay đổi
- useCallback cho functions
- useMemo cho calculations
- FlatList thay vì ScrollView cho danh sách dài

### 2. Image Optimization
- Dùng expo-image
- Resize ảnh trước khi hiển thị
- Lazy load images

---

## IX. TESTING & DEBUG

### 1. Debug Tools
- Console.log()
- React Native Debugger
- Flipper
- Chrome DevTools

### 2. Testing
- Test trên thiết bị thật
- Test cả iOS và Android
- Test nhiều kích thước màn hình

---

## X. BUILD & DEPLOY

### 1. Build Process
- Development: expo start
- Preview: expo build
- Production: eas build

### 2. Checklist trước khi deploy
- [ ] Remove console.log
- [ ] Test all features
- [ ] Check permissions
- [ ] Update version number
- [ ] Test on real devices

---

## XI. BẢO MẬT

### 1. Quyền riêng tư
- Xin quyền trước khi truy cập (camera, location, storage)
- Giải thích tại sao cần quyền
- Xử lý khi người dùng từ chối

### 2. Bảo mật dữ liệu
- Không lưu password dạng plain text
- Dùng HTTPS cho API
- Validate input từ user
- Sanitize data trước khi hiển thị

---

## XII. UI/UX GUIDELINES

### 1. Thiết kế
- Giao diện sạch, hiện đại
- Nút bấm lớn, dễ chạm
- Typography rõ ràng
- Card bo góc
- Icon trực quan

### 2. Trải nghiệm
- Loading state khi fetch data
- Empty state khi không có data
- Error message rõ ràng
- Confirmation dialog trước khi xóa
- Toast/Alert cho feedback

### 3. Accessibility
- Label cho input
- Alt text cho image
- Sufficient color contrast
- Touch target >= 44px

---

## XIII. CODE EXAMPLES

### Component mẫu
```typescript
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface ButtonProps {
  title: string;
  onPress: () => void;
}

export function Button({ title, onPress }: ButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <ThemedText style={styles.text}>{title}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### API call mẫu
```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/data');
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

---

## XIV. COMMON MISTAKES (TRÁNH)

❌ Inline styles
❌ Dùng var thay vì const/let
❌ Không xử lý error
❌ Hardcode values
❌ Quá nhiều logic trong component
❌ Không dùng TypeScript
❌ Component quá lớn 
❌ Không tách reusable components
❌ Không optimize FlatList
❌ Quên cleanup trong useEffect

---

## XV. CHECKLIST KHI TẠO COMPONENT MỚI

- [ ] Đặt tên PascalCase
- [ ] Define Props interface (TypeScript)
- [ ] Tách style ra StyleSheet
- [ ] Dùng Flexbox cho layout
- [ ] Hỗ trợ dark mode (nếu cần)
- [ ] Xử lý loading/error states
- [ ] Test responsive
- [ ] Add comments nếu logic phức tạp
- [ ] Export named
- [ ] Commit với message rõ ràng

---

**LƯU Ý QUAN TRỌNG:**
1. Luôn ưu tiên Functional Component + Hooks
2. Luôn dùng TypeScript
3. Luôn dùng StyleSheet (không inline)
4. Luôn validate input
5. Luôn xử lý error
6. Luôn test trên thiết bị thật
7. Luôn viết code sạch, dễ đọc, dễ maintain
