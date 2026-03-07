# Hot Articles Auto Crawler - User Guide

## Tổng quan

Hệ thống tự động crawl bài báo hot từ VnExpress và Dân Trí mỗi giờ, lưu vào database articles để có thể rewrite và đăng bài sau.

## Nguồn bài viết

- **VnExpress**: https://vnexpress.net/
  - Tin mới nhất
  - Tin xem nhiều
  - Tin tiêu điểm
  - Tin nổi bật

- **Dân Trí**: https://dantri.com.vn/tin-moi-nhat.htm
  - Tin mới nhất
  - Bài viết nổi bật

Mỗi nguồn lấy top 10 bài viết hot nhất.

## Cơ chế hoạt động

### 1. Auto Crawl (Mỗi giờ)

Cron job chạy tự động:

- **Lịch**: Mỗi giờ đúng phút 0 (10:00, 11:00, 12:00, ...)
- **Thời gian**: `0 * * * *` (node-cron format)
- **Khởi động**: Server tự động bật crawler khi start
- **Crawl ngay**: Chạy ngay 1 lần khi server khởi động

### 2. Quy trình crawl

```
VnExpress + Dân Trí
    ↓
Lọc URL hợp lệ
    ↓
Loại bỏ trùng lặp
    ↓
Kiểm tra database
    ↓
Lưu bài mới (status: pending)
```

### 3. Lưu trữ

File: `server/data/articles.json`

Mẫu article:

```json
{
  "id": "uuid",
  "link": "https://vnexpress.net/...",
  "status": "pending",
  "source": "vnexpress",
  "crawledAt": "2026-03-07T10:00:00.000Z",
  "createdAt": "2026-03-07T10:00:00.000Z"
}
```

## API Endpoints

### 1. Trigger Manual Crawl

```bash
POST /api/auto-post/crawl-hot
```

**Response:**

```json
{
  "success": true,
  "message": "Đã bắt đầu crawl bài báo hot"
}
```

**Sử dụng:**

```bash
curl -X POST http://localhost:3001/api/auto-post/crawl-hot
```

### 2. Start Crawler

```bash
POST /api/auto-post/hot-crawler/start
```

**Response:**

```json
{
  "success": true,
  "message": "Đã bật hot articles crawler (chạy mỗi giờ)"
}
```

### 3. Stop Crawler

```bash
POST /api/auto-post/hot-crawler/stop
```

**Response:**

```json
{
  "success": true,
  "message": "Đã tắt hot articles crawler"
}
```

### 4. Check Status

```bash
GET /api/auto-post/status
```

**Response:**

```json
{
  "success": true,
  "data": {
    "enabled": false,
    "channels": [],
    "intervalMinutes": 60,
    "schedulerRunning": false,
    "hotArticlesCrawlerRunning": false,
    "hotArticlesCrawlerActive": true
  }
}
```

## Logs

Server logs hiển thị thông tin crawl:

```
[HOT CRAWLER] 🚀 Started - Running every hour at minute 0
[HOT CRAWLER] Running initial crawl...

[CRAWL HOT] ========== Starting hot articles crawl ==========
[CRAWL HOT] Crawling VnExpress...
[CRAWL HOT] VnExpress: Found 22 articles
[CRAWL HOT] Crawling Dân Trí...
[CRAWL HOT] Dân Trí: Found 17 articles
[CRAWL HOT] ✅ Saved 20 new articles to database
[CRAWL HOT] Summary:
  - VnExpress: 10/10 new
  - Dân Trí: 10/10 new
  - Total new articles: 20
[CRAWL HOT] ========== Crawl completed ==========
```

## Workflow tích hợp

### 1. Crawl → Rewrite → Post

```
Hot Crawler (mỗi giờ)
    ↓
Articles saved (status: pending)
    ↓
User select article từ UI
    ↓
POST /api/articles (add article)
    ↓
Auto rewrite content
    ↓
Post to all channels
```

### 2. Frontend Integration

**Danh sách articles** hiện có thể hiển thị:

- Articles từ VnExpress/Dân Trí (source: "vnexpress", "dantri")
- Status: pending (chưa rewrite), completed (đã post)
- Thời gian crawl

## Cấu hình

### Thay đổi lịch crawl

File: `server/flows/auto-post.js`

```javascript
// Mỗi giờ: "0 * * * *"
// Mỗi 30 phút: "*/30 * * * *"
// Mỗi 2 giờ: "0 */2 * * *"

hotArticlesCronTask = cron.schedule("0 * * * *", async () => {
  // ...
});
```

### Thay đổi số lượng articles

File: `server/flows/crawl-hot-articles.js`

```javascript
// Lấy top 10 → thay đổi số 10
return articles.slice(0, 10);
```

### Thay đổi nguồn crawl

Thêm function mới trong `crawl-hot-articles.js`:

```javascript
async function crawlNewSource() {
  // Crawl logic
  return articles;
}

// Update main function
const newsourceArticles = await crawlNewSource();
```

## Troubleshooting

### Crawler không chạy

```bash
# Check status
curl http://localhost:3001/api/auto-post/status

# Restart crawler
curl -X POST http://localhost:3001/api/auto-post/hot-crawler/stop
curl -X POST http://localhost:3001/api/auto-post/hot-crawler/start
```

### Không tìm thấy bài mới

- Kiểm tra các bài đã tồn tại trong database
- VnExpress/Dân Trí có thể thay đổi cấu trúc HTML → update selectors

### Lỗi timeout

Tăng timeout trong `crawl-hot-articles.js`:

```javascript
const { data } = await axios.get(url, {
  timeout: 30000, // 30 giây
});
```

## Best Practices

1. **Monitor logs** để phát hiện lỗi crawl sớm
2. **Backup articles.json** định kỳ
3. **Clean up old articles** (pending > 7 ngày)
4. **Rate limiting**: Crawler tự động skip nếu job trước chưa hoàn thành

## Next Steps

- [ ] Thêm filter theo category (thể thao, giải trí, ...)
- [ ] Scoring system để rank bài viết hot
- [ ] Integration với sentiment analysis
- [ ] Notification khi có bài viral
