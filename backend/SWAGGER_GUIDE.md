# 📚 SWAGGER API DOCUMENTATION

## 🌐 Truy cập Swagger UI

**URL**: http://localhost:5000/api-docs

## 🎯 Tính năng

### 1. **Interactive API Documentation**
- Xem tất cả endpoints có sẵn
- Xem request/response schemas
- Test API trực tiếp trên trình duyệt

### 2. **Try it out**
- Click nút **"Try it out"** trên mỗi endpoint
- Điền parameters và body
- Click **"Execute"** để gửi request
- Xem response ngay lập tức

### 3. **Authentication**
- Click nút **"Authorize"** ở góc phải trên
- Nhập JWT token: `Bearer <your_token>`
- Tất cả requests sau đó sẽ tự động có token

### 4. **Export OpenAPI Spec**
- Truy cập: http://localhost:5000/api-docs.json
- Download file JSON để import vào Postman/Insomnia

## 🔧 Cách thêm API Documentation

### Ví dụ đơn giản (Health Check):

```typescript
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server is running
 */
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running' });
});
```

### Ví dụ với Authentication:

```typescript
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Invalid credentials
 */
```

### Ví dụ với Bearer Token:

```typescript
/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
```

## 📋 Available Tags

Các tags đã được định nghĩa:
- **Health** - Health check endpoints
- **Authentication** - Login, Register, Token refresh
- **Topics** - Vocabulary topics
- **Words** - Vocabulary words
- **Learning** - Learning sessions and progress
- **Favorites** - User favorite words
- **Admin** - Admin management

## 🎨 Customization

### Thay đổi title/description:

Edit file `backend/src/config/swagger.ts`:

```typescript
info: {
  title: 'Your API Title',
  version: '1.0.0',
  description: 'Your API Description',
}
```

### Thêm servers:

```typescript
servers: [
  {
    url: 'http://localhost:5000',
    description: 'Development server',
  },
  {
    url: 'https://api.production.com',
    description: 'Production server',
  },
]
```

## 💡 Tips

1. **Organize by Tags**: Group related endpoints với cùng tag
2. **Use Examples**: Luôn cung cấp example values
3. **Document Errors**: Liệt kê tất cả response codes có thể
4. **Security**: Đánh dấu endpoints cần authentication
5. **Keep Updated**: Update docs khi thay đổi API

## 🔗 Useful Links

- **Swagger UI**: http://localhost:5000/api-docs
- **OpenAPI JSON**: http://localhost:5000/api-docs.json
- **Swagger Spec**: https://swagger.io/specification/
- **JSDoc Guide**: https://github.com/Surnet/swagger-jsdoc

---

🚀 Happy API Testing!
