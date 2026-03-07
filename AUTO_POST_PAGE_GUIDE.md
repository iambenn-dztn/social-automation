# Auto-Post Page - Hot Articles Crawler

## 🎯 Tổng quan

Đã cập nhật màn hình Auto-Post (`/auto-post`) với 2 chức năng:

### 1. **Hot Articles Auto-Poster** (MỚI) 🔥

- Tự động crawl, chọn bài tốt nhất và đăng lên tất cả page
- Chạy mỗi 10 phút
- Rewrite riêng cho từng page

### 2. **Auto-Post từ Pending Contents** (CŨ) 📝

- Đăng bài từ content đã được gen sẵn
- Chạy theo interval tùy chỉnh

---

## 🚀 Cách sử dụng

### A. Hot Articles Auto-Poster

#### 1. Bật/Tắt Crawler

```
Vào: http://localhost:3000/auto-post
Section: "🔥 Hot Articles Auto-Poster"
Click: Toggle "Bật/Tắt"
```

**Khi bật:**

- Cron tự động chạy mỗi 10 phút
- Crawl từ VnExpress + Dân Trí
- Chọn 1 bài tốt nhất (theo score)
- Rewrite và đăng lên tất cả page

**Khi tắt:**

- Cron dừng hoàn toàn

#### 2. Chạy thủ công

```
Click: "Chạy ngay"
Confirm: Popup xác nhận
```

**Kết quả:**

- Crawl ngay lập tức (không đợi 10 phút)
- Process tương tự workflow tự động

#### 3. Theo dõi trạng thái

**Indicator:**

- 🟢 Chấm xanh + "Đang hoạt động" = Crawler đang bật
- ⚪ Chấm xám + "Đã tắt" = Crawler đã tắt
- ⚡ "Đang chạy..." = Job đang execute

**Thống kê:**

- Lịch chạy: Mỗi 10 phút
- Nguồn: VnExpress + Dân Trí
- Số bài/lần: 1 bài tốt nhất

---

### B. Auto-Post từ Pending Contents

#### 1. Cấu hình kênh

```
Section: "Cấu hình kênh đăng bài"
Check/Uncheck: Các page muốn đăng
```

#### 2. Cấu hình interval

```
Input: Số phút (mặc định 60)
Click: "Lưu cấu hình"
```

#### 3. Bật/Tắt

```
Toggle: "Bật/Tắt"
```

#### 4. Chạy thủ công

```
Click: "Chạy ngay"
```

---

## 📊 Workflow

### Hot Articles Auto-Poster (10 phút/lần)

```
Mỗi 10 phút (hoặc click "Chạy ngay")
    ↓
Crawl VnExpress + Dân Trí (top 15 bài/nguồn)
    ↓
Lọc trùng với database
    ↓
Scoring (drama +10, giá vàng +7, chính trị +6...)
    ↓
Chọn 1 bài điểm cao nhất
    ↓
Lưu vào database (status: pending)
    ↓
┌─────────────────────────┐
│ For each page:          │
│  1. Rewrite riêng       │
│  2. Post lên page       │
│  3. Log kết quả         │
└─────────────────────────┘
    ↓
Update status: posted
```

### Auto-Post từ Pending (Interval tùy chỉnh)

```
Theo interval (60/120/180... phút)
    ↓
Lấy random 1 content từ pending
    ↓
Đăng lên các page đã chọn
    ↓
Update status: posted
```

---

## 🎨 Giao diện

### Layout mới:

```
┌─────────────────────────────────────────────────┐
│ ⏰ Tự động đăng bài                             │
├─────────────────────────────────────────────────┤
│                                                 │
│ 🔥 Hot Articles Auto-Poster                    │
│ ┌─────────────────────────────────────────┐    │
│ │ [●] Đang hoạt động  [Tắt] [Chạy ngay]  │    │
│ │                                          │    │
│ │ 📋 Cách hoạt động:                       │    │
│ │  ⏱️ Tự động chạy mỗi 10 phút             │    │
│ │  📰 Crawl từ VnExpress + Dân Trí         │    │
│ │  🎯 Chọn 1 bài tốt nhất                  │    │
│ │  ✍️ Rewrite riêng cho từng page          │    │
│ │  🚀 Đăng lên tất cả page                 │    │
│ │                                          │    │
│ │ Stats: Mỗi 10 phút | VnExpress + Dân Trí│    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ─────────────────────────────────────────────  │
│                                                 │
│ 📝 Auto-Post từ Pending Contents               │
│ ┌─────────────────────────────────────────┐    │
│ │ [○] Đã tắt          [Bật] [Chạy ngay]   │    │
│ │                                          │    │
│ │ Nguồn: 15 nội dung pending               │    │
│ │ Kênh: [✓] J News  [✓] MốTT              │    │
│ │ Interval: 60 phút                        │    │
│ │                                          │    │
│ │ [Lưu cấu hình]                           │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ 📜 Lịch sử (120)                               │
└─────────────────────────────────────────────────┘
```

---

## 🔧 API Endpoints (Backend)

### Hot Articles Crawler

```bash
# Start crawler
POST /api/auto-post/hot-crawler/start
Response: { "success": true, "message": "Đã bật auto-post crawler (chạy mỗi 10 phút)" }

# Stop crawler
POST /api/auto-post/hot-crawler/stop
Response: { "success": true, "message": "Đã tắt hot articles crawler" }

# Manual trigger
POST /api/auto-post/crawl-and-post
Response: { "success": true, "message": "Đã bắt đầu crawl, chọn bài tốt nhất và đăng lên tất cả page" }

# Check status
GET /api/auto-post/status
Response: {
  "success": true,
  "data": {
    "enabled": false,
    "channels": [...],
    "intervalMinutes": 120,
    "hotCrawlerActive": true,
    "hotCrawlerRunning": false
  }
}
```

---

## 📝 Testing

### 1. Build frontend

```bash
cd client
npm run build
```

### 2. Restart server

```bash
cd server
pkill -f "node server.js"
npm start
```

### 3. Truy cập

```
http://localhost:3001
hoặc
http://localhost:3000  # if client dev server running
```

### 4. Test Hot Crawler

**Bật crawler:**

1. Vào `/auto-post`
2. Section "🔥 Hot Articles Auto-Poster"
3. Click "Bật"
4. Confirm alert

**Chạy ngay:**

1. Click "Chạy ngay"
2. Confirm popup
3. Đợi 10-15 giây
4. Check console logs hoặc database

**Theo dõi logs:**

```bash
tail -f server/startup.log | grep "AUTO-POST"
```

---

## 🎯 Kết quả mong đợi

### Khi chạy thành công:

**Logs:**

```
[AUTO-POST] ========== Starting crawl and auto-post ==========
[AUTO-POST] Step 1/5: Crawling articles from sources...
[AUTO-POST] Total crawled: 30 articles
[AUTO-POST] Step 2/5: Filtering out duplicate articles...
[AUTO-POST] New articles after filtering: 25
[AUTO-POST] Step 3/5: Scoring and selecting best article...
[AUTO-POST]   - [vnexpress] Score: 15 - Giá vàng tăng vọt...
[AUTO-POST]   - [dantri] Score: 12 - Scandal showbiz...
[AUTO-POST] ✅ Best article selected (score: 15)
[AUTO-POST] Step 4/5: Saving selected article to database...
[AUTO-POST] Step 5/5: Rewriting and posting to all channels...
[AUTO-POST] [1/2] Processing facebook/J News...
[AUTO-POST]   ✅ Posted successfully to J News
[AUTO-POST] [2/2] Processing facebook/MốTT...
[AUTO-POST]   ✅ Posted successfully to MốTT
[AUTO-POST] ========== Summary ==========
✅ Selected article: Giá vàng tăng vọt
📝 Total channels: 2
✅ Successful posts: 2
❌ Failed posts: 0
[AUTO-POST] ========== Completed ==========
```

**Database:**

```json
{
  "id": "uuid",
  "link": "https://vnexpress.net/...",
  "status": "posted",
  "source": "vnexpress",
  "title": "Giá vàng tăng vọt",
  "score": 15,
  "crawledAt": "2026-03-07T..."
}
```

**Facebook:**

- Bài post mới xuất hiện trên J News
- Bài post mới xuất hiện trên MốTT
- Nội dung 2 bài KHÁC NHAU (rewrite riêng)

---

## ⚠️ Lưu ý

1. **Hot Crawler chạy độc lập** - Không phụ thuộc vào "Auto-Post từ Pending Contents"
2. **Rewrite mỗi lần post** - Mỗi page nhận content khác nhau
3. **Tự động lọc trùng** - Không post bài đã crawl trước đó
4. **Scoring system** - Ưu tiên bài drama, giá vàng, chính trị
5. **10 phút/lần** - Cron chạy cố định, không thay đổi

---

## 🐛 Troubleshooting

### Crawler không chạy

```bash
# Check status
curl http://localhost:3001/api/auto-post/status

# Restart crawler
curl -X POST http://localhost:3001/api/auto-post/hot-crawler/stop
curl -X POST http://localhost:3001/api/auto-post/hot-crawler/start
```

### Frontend không hiển thị đúng

```bash
# Rebuild
cd client
npm run build

# Restart server
cd ../server
pkill -f "node server.js"
npm start
```

### Không tìm thấy bài mới

- Check logs: Có thể tất cả bài đã được crawl
- Database có thể đã đầy
- VnExpress/Dân Trí có thể thay đổi cấu trúc HTML

---

## 🎉 Kết luận

Màn hình Auto-Post đã được nâng cấp với:

- ✅ Section riêng cho Hot Articles Crawler
- ✅ Toggle bật/tắt crawler
- ✅ Button chạy thủ công
- ✅ Hiển thị status real-time
- ✅ Stats và thông tin workflow
- ✅ UI/UX cải thiện với màu sắc phân biệt
- ✅ Responsive và dễ sử dụng

**Next steps:**

1. Build frontend: `cd client && npm run build`
2. Restart server
3. Test tại http://localhost:3001/auto-post
4. Enjoy! 🚀
