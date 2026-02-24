# 🚀 QUICK START GUIDE

## Hướng dẫn nhanh để chạy project

### 📋 Yêu cầu

- Node.js đã cài đặt
- Facebook Developer Account
- Facebook Access Token

### ⚡ Các bước thực hiện

#### 1️⃣ Cài đặt Server

```bash
cd server
npm install
copy .env.example .env
```

Mở file `server/.env` và thêm Facebook Access Token của bạn:

```
FACEBOOK_ACCESS_TOKEN=your_token_here
```

#### 2️⃣ Cài đặt Client

```bash
cd client
npm install
```

#### 3️⃣ Chạy ứng dụng

**Terminal 1 - Chạy Server:**

```bash
cd server
npm start
```

**Terminal 2 - Chạy Client:**

```bash
cd client
npm start
```

#### 4️⃣ Truy cập

- Client: http://localhost:3000
- Server: http://localhost:3001

### 🔑 Lấy Facebook Access Token

1. Vào https://developers.facebook.com/tools/explorer/
2. Chọn app của bạn (hoặc tạo app mới)
3. Click "Generate Access Token"
4. Chọn permissions:
   - pages_manage_posts
   - pages_read_engagement
   - pages_show_list
5. Copy token và paste vào file `.env`

### ✅ Xong!

Bây giờ bạn có thể:

- Chọn fanpages
- Viết nội dung
- Upload hình/video
- Đăng bài đồng thời lên nhiều fanpage

---

**Need help?** Check README.md for detailed documentation
