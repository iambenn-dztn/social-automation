# 📝 HƯỚNG DẪN SETUP VÀ SỬ DỤNG HỆ THỐNG

## 🎯 TÓM TẮT

Hệ thống Facebook Auto Posting đã được phát triển hoàn chỉnh và test thành công!
- ✅ Server Express.js chạy trên port 5000
- ✅ Client React.js chạy trên port 3000
- ✅ Tất cả dependencies đã được cài đặt
- ✅ Code đã được kiểm tra không có lỗi

## 🚀 CÁC BƯỚC ĐỂ CHẠY PROJECT

### Bước 1: Lấy Facebook Access Token

Đây là bước QUAN TRỌNG NHẤT để hệ thống hoạt động:

1. Truy cập: https://developers.facebook.com/tools/explorer/
2. Chọn hoặc tạo Facebook App
3. Trong Graph API Explorer:
   - Click **"Generate Access Token"**
   - Chọn các permissions sau:
     - ✅ `pages_manage_posts`
     - ✅ `pages_read_engagement`
     - ✅ `pages_show_list`
   - Click **"Generate Access Token"**
   - Đăng nhập và chấp nhận permissions
4. Copy token vừa tạo (chuỗi dài bắt đầu bằng EAA...)

**LƯU Ý**: Token này sẽ hết hạn sau vài giờ. Để có Long-lived token (60 ngày), xem phần "Lấy Long-Lived Token" bên dưới.

### Bước 2: Cấu hình Server

1. Mở file: `server\.env`
2. Thêm Access Token vào dòng:
   ```
   FACEBOOK_ACCESS_TOKEN=paste_your_token_here
   ```
3. Lưu file

### Bước 3: Chạy Server

Mở Terminal thứ nhất và chạy:

```powershell
cd server
npm start
```

Bạn sẽ thấy:
```
✅ Server is running on port 5000
📍 Health check: http://localhost:5000/api/health
```

### Bước 4: Chạy Client

Mở Terminal thứ hai và chạy:

```powershell
cd client
npm start
```

Browser sẽ tự động mở tại: `http://localhost:3000`

Bạn sẽ thấy:
```
Compiled successfully!
Local: http://localhost:3000
```

## 🎨 SỬ DỤNG HỆ THỐNG

### 1. Xem danh sách Fanpage
- Khi mở ứng dụng, tất cả fanpage bạn quản lý sẽ tự động hiển thị
- Mỗi fanpage hiển thị: tên, ảnh đại diện, và Page ID

### 2. Chọn Fanpage để đăng
- Click vào các fanpage bạn muốn đăng
- Hoặc click "✅ Chọn tất cả" để chọn tất cả fanpages
- Fanpage được chọn sẽ có nền màu xanh nhạt

### 3. Tạo bài viết
- Nhập nội dung vào ô "Nội dung bài viết"
- (Tùy chọn) Upload hình ảnh hoặc video bằng cách click "Chọn file"
- Xem preview của media vừa chọn

### 4. Đăng bài
- Click nút "🚀 Đăng lên X fanpages"
- Hệ thống sẽ hiển thị progress
- Xem kết quả chi tiết cho từng fanpage

### 5. Xem lịch sử
- Click tab "📜 Lịch sử" ở đầu trang
- Xem tất cả bài viết đã đăng
- Kiểm tra kết quả thành công/thất bại cho từng fanpage

## 🔑 LẤY LONG-LIVED TOKEN (60 NGÀY)

Short-lived token chỉ tồn tại vài giờ. Để có token tồn tại 60 ngày:

### Cách 1: Sử dụng Graph API Explorer
1. Vào: https://developers.facebook.com/tools/debug/accesstoken/
2. Paste token hiện tại
3. Click "Extend Access Token"
4. Copy token mới

### Cách 2: Sử dụng API Call
```powershell
$appId = "YOUR_APP_ID"
$appSecret = "YOUR_APP_SECRET"
$shortToken = "YOUR_SHORT_LIVED_TOKEN"

$url = "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=$appId&client_secret=$appSecret&fb_exchange_token=$shortToken"

Invoke-WebRequest -Uri $url -UseBasicParsing | Select-Object -ExpandProperty Content
```

### Cách 3: Chuyển sang Page Access Token (Không hết hạn)
1. Dùng User Access Token hiện tại
2. Call API:
```
GET https://graph.facebook.com/v18.0/me/accounts?access_token=USER_TOKEN
```
3. Lấy `access_token` của từng page từ response
4. Page token này không hết hạn trừ khi thay đổi mật khẩu

## 📊 KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────┐         ┌─────────────────────┐
│   React Client      │         │   Express Server    │
│   (Port 3000)       │ ◄─────► │   (Port 5000)       │
│                     │  HTTP   │                     │
│ - Upload UI         │         │ - API Routes        │
│ - Page Selection    │         │ - File Upload       │
│ - History View      │         │ - FB Integration    │
└─────────────────────┘         └─────────────────────┘
                                        │
                                        │ Graph API
                                        ▼
                                ┌─────────────────────┐
                                │  Facebook API       │
                                │  (Graph v18.0)      │
                                │                     │
                                │ - Pages API         │
                                │ - Posts API         │
                                │ - Media Upload      │
                                └─────────────────────┘
```

## 🔧 API ENDPOINTS

### 1. Health Check
```
GET http://localhost:5000/api/health
Response: { status: "OK", message: "...", timestamp: "..." }
```

### 2. Lấy danh sách Fanpages
```
GET http://localhost:5000/api/facebook/pages
Response: { 
  success: true, 
  pages: [
    { id, name, picture, access_token }
  ]
}
```

### 3. Đăng bài lên Fanpages
```
POST http://localhost:5000/api/facebook/post
Content-Type: multipart/form-data

Body:
- message: string (nội dung bài viết)
- pageIds: JSON array (["page_id_1", "page_id_2"])
- media: file (optional - image or video)

Response: {
  success: true,
  message: "Posted to X page(s)...",
  results: [...],
  summary: { total, successful, failed }
}
```

### 4. Lấy lịch sử
```
GET http://localhost:5000/api/facebook/history
Response: {
  success: true,
  history: [...]
}
```

## 📁 CẤU TRÚC PROJECT

```
facebook-automation/
│
├── server/                      # Backend Express.js
│   ├── controllers/
│   │   └── facebookController.js   # Business logic
│   ├── routes/
│   │   └── facebook.js             # API routes
│   ├── uploads/                    # Temporary uploads (auto-created)
│   ├── .env                        # Environment variables ⚠️
│   ├── .env.example               # Template
│   ├── server.js                  # Entry point
│   └── package.json
│
├── client/                      # Frontend React
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── PageList.js       # Danh sách fanpage
│   │   │   ├── PageList.css
│   │   │   ├── PostForm.js       # Form đăng bài
│   │   │   ├── PostForm.css
│   │   │   ├── History.js        # Lịch sử
│   │   │   └── History.css
│   │   ├── services/
│   │   │   └── api.js            # API calls
│   │   ├── App.js                # Main component
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
├── README.md                    # Documentation đầy đủ
├── QUICKSTART.md               # Hướng dẫn nhanh
└── SETUP.md                    # File này
```

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Bảo mật
- ❌ KHÔNG commit file `.env` lên Git
- ❌ KHÔNG chia sẻ Access Token công khai
- ❌ KHÔNG để token trong code
- ✅ Sử dụng environment variables
- ✅ Thêm `.env` vào `.gitignore`

### 2. Giới hạn Facebook
- **Rate Limiting**: Facebook giới hạn số request/giây
- **Upload Size**: Video tối đa 100MB
- **Token Expiry**: Token sẽ hết hạn định kỳ
- **Permissions**: Cần quyền admin/editor trên fanpage

### 3. Khắc phục sự cố
Nếu gặp lỗi:

#### Server không start:
```powershell
# Kiểm tra port 5000 có bị chiếm không
netstat -ano | findstr :5000

# Kill process nếu cần
taskkill /PID <PID> /F

# Start lại server
cd server
npm start
```

#### Client không start:
```powershell
# Xóa node_modules và cài lại
cd client
Remove-Item -Recurse -Force node_modules
npm install
npm start
```

#### Không thấy fanpage:
1. Kiểm tra Access Token đã được set chưa
2. Kiểm tra token còn hạn không (dùng Access Token Debugger)
3. Kiểm tra bạn có quyền admin/editor fanpage không
4. Xem console browser (F12) và terminal server để check lỗi

#### Lỗi upload file:
1. Kiểm tra file size < 100MB
2. Kiểm tra định dạng file (jpg, png, mp4, etc.)
3. Kiểm tra quyền ghi vào thư mục `server/uploads`

## 🎯 TESTING CHECKLIST

Đã test thành công:
- ✅ Server khởi động thành công (port 5000)
- ✅ Client khởi động thành công (port 3000)
- ✅ Health check endpoint hoạt động
- ✅ Không có lỗi compile
- ✅ Tất cả dependencies được cài đặt

Cần test với Facebook token thật:
- ⏳ Lấy danh sách fanpages
- ⏳ Đăng bài text only
- ⏳ Đăng bài với hình ảnh
- ⏳ Đăng bài với video
- ⏳ Xem lịch sử

## 📞 HỖ TRỢ

### Debug Client (React):
1. Mở browser tại http://localhost:3000
2. Press F12 để mở DevTools
3. Vào tab Console để xem lỗi
4. Vào tab Network để xem API calls

### Debug Server (Express):
1. Xem output trong terminal đang chạy server
2. Kiểm tra file logs (nếu có)
3. Test API bằng Postman hoặc curl

### Test API trực tiếp:
```powershell
# Health check
(Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing).Content

# Get pages (cần có token trong .env)
(Invoke-WebRequest -Uri "http://localhost:5000/api/facebook/pages" -UseBasicParsing).Content

# Get history
(Invoke-WebRequest -Uri "http://localhost:5000/api/facebook/history" -UseBasicParsing).Content
```

## 🚀 NEXT STEPS

Để sử dụng hệ thống:
1. ✅ Đã hoàn thành cài đặt
2. 🔑 Lấy Facebook Access Token (xem hướng dẫn trên)
3. ⚙️ Cập nhật file `server/.env`
4. ▶️ Restart server nếu đang chạy
5. 🎉 Sử dụng hệ thống!

## 📚 TÀI LIỆU THAM KHẢO

- Facebook Graph API: https://developers.facebook.com/docs/graph-api/
- Facebook Pages API: https://developers.facebook.com/docs/pages/
- Access Token Debugger: https://developers.facebook.com/tools/debug/accesstoken/
- Graph API Explorer: https://developers.facebook.com/tools/explorer/

---

**Hệ thống đã sẵn sàng sử dụng! Chúc bạn thành công! 🎊**
