# 🚀 Hướng Dẫn Deploy Lên Render.com

## 📋 Chuẩn Bị

### 1. Tạo Tài Khoản Render

- Truy cập: **https://render.com**
- Đăng ký/Đăng nhập bằng GitHub (khuyến nghị)

### 2. Push Code Lên GitHub

```bash
# Khởi tạo git (nếu chưa có)
git init

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/social-automation.git

# Add và commit toàn bộ code
git add .
git commit -m "Initial commit for Render deployment"

# Push lên GitHub
git push -u origin main
```

---

## 🔧 Bước 1: Tạo Web Service

### 1.1. Vào Render Dashboard

- Truy cập: https://dashboard.render.com
- Click **"New +"** → Chọn **"Web Service"**

### 1.2. Connect Repository

- Click **"Connect a repository"**
- Authorize GitHub nếu lần đầu
- Chọn repository: `social-automation`
- Click **"Connect"**

### 1.3. Cấu Hình Service

**Basic Settings:**

```
Name: social-automation
Region: Singapore (hoặc gần nhất)
Branch: main
Root Directory: (để trống)
```

**Build & Deploy:**

```
Runtime: Node
Build Command: cd server && npm install && npm run build
Start Command: cd server && npm start
```

**💡 Cách Hoạt Động:**
- **Build:** Cài dependencies cho server → Build React app vào `client/build/`
- **React Production Mode:** Tự động dùng relative URL `/api` thay vì `localhost:3001`
- **Start:** Express serve static files từ `client/build/` + API endpoints
- **Kết Quả:** Single domain cho cả frontend + backend (https://your-app.onrender.com)

**Instance Type:**

```
Plan: Free (hoặc chọn Starter nếu cần)
```

---

## ⚙️ Bước 2: Cấu Hình Environment Variables

Trong phần **Environment Variables**, thêm các biến sau:

### Required Variables:

| Key                     | Value             | Ghi Chú                       |
| ----------------------- | ----------------- | ----------------------------- |
| `NODE_ENV`              | `production`      | Môi trường production         |
| `PORT`                  | `10000`           | Port mặc định của Render      |
| `FACEBOOK_ACCESS_TOKEN` | `YOUR_TOKEN`      | Token từ facebook-config.json |
| `FACEBOOK_APP_ID`       | `YOUR_APP_ID`     | App ID từ .env                |
| `FACEBOOK_APP_SECRET`   | `YOUR_APP_SECRET` | App Secret từ .env            |
| `GROQ_API_KEY`          | `YOUR_GROQ_KEY`   | Key từ console.groq.com       |

**Cách thêm:**

1. Click **"Add Environment Variable"**
2. Nhập **Key** và **Value**
3. Repeat cho tất cả variables
4. ✅ KHÔNG tick vào **"Add from .env file"** (Render sẽ tự load)

---

## 💾 Bước 3: Cấu Hình Persistent Disk (Lưu Trữ Dữ Liệu)

### 3.1. Tạo Disk

- Scroll xuống phần **"Disks"**
- Click **"Add Disk"**

### 3.2. Cấu Hình Disk

```
Name: social-automation-data
Mount Path: /opt/render/project/src/server/data
Size: 1 GB (Free tier)
```

**Giải thích:**

- `data/` folder chứa:
  - `facebook-config.json` (token)
  - `auto-post-config.json` (cấu hình)
  - `auto-post-history.json` (lịch sử)
  - `output/*.json` (content)
  - `images/` (hình ảnh)

**⚠️ Lưu ý:** Không có disk, mọi dữ liệu sẽ mất sau mỗi lần deploy!

---

## 🚀 Bước 4: Deploy

### 4.1. Bắt Đầu Deploy

- Click **"Create Web Service"** (ở cuối trang)
- Render sẽ tự động:
  1. Clone repository
  2. Chạy build command
  3. Start server
  4. Tạo HTTPS domain

### 4.2. Theo Dõi Deploy

- Xem **"Logs"** tab để theo dõi quá trình
- Chờ status: **"Live"** (màu xanh)
- Thời gian: ~5-10 phút

### 4.3. Lấy URL

Sau khi deploy thành công, bạn sẽ có URL:

```
https://social-automation-XXXX.onrender.com
```

---

## ✅ Bước 5: Kiểm Tra Deployment

### 5.1. Test Health Endpoint

```bash
curl https://YOUR_APP_URL.onrender.com/api/health
```

**Expected Response:**

```json
{
  "status": "OK",
  "message": "Multi-Platform Automation Server is running",
  "timestamp": "2026-03-04T...",
  "platforms": ["facebook", "shopee"]
}
```

### 5.2. Truy Cập Web App

Mở browser:

```
https://YOUR_APP_URL.onrender.com
```

Bạn sẽ thấy giao diện React app!

---

## 🔄 Bước 6: Auto-Deploy (Tùy Chọn)

Render tự động deploy khi có commit mới:

```bash
# Làm thay đổi code
git add .
git commit -m "Update feature"
git push

# Render tự động detect và deploy
```

**Tắt auto-deploy:**

- Settings → **"Auto-Deploy"** → Toggle Off

---

## 📂 Bước 7: Upload Dữ Liệu Ban Đầu

### 7.1. SSH vào Container (Nếu cần)

Render không hỗ trợ SSH trên Free plan. Thay vào đó:

**Option 1: Sử dụng API Upload**

- Tạo endpoint upload trong code
- Upload qua POST request

**Option 2: Seed Data trong Code**
Tạo file `server/utils/seedData.js`:

```javascript
const fs = require("fs").promises;
const path = require("path");

const seedData = async () => {
  const configPath = path.join(__dirname, "../data/facebook-config.json");

  // Check if exists
  try {
    await fs.access(configPath);
    console.log("✅ Data already exists");
  } catch {
    // Create default config
    const defaultConfig = {
      accessToken: process.env.FACEBOOK_ACCESS_TOKEN,
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
      tokenType: "USER",
      expiresAt: null,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log("✅ Created default facebook-config.json");
  }
};

module.exports = { seedData };
```

Gọi trong `server.js`:

```javascript
const { seedData } = require("./utils/seedData");

app.listen(PORT, async () => {
  // ... existing code ...

  // Seed data on first run
  await seedData();
});
```

---

## 🛠️ Troubleshooting

### ❌ Build Failed

**Check Logs:**

- Vào **"Logs"** tab
- Tìm dòng lỗi (thường là dependency issue)

**Common Fixes:**

```bash
# Locally test build
cd server && npm install && npm run build
```

### ❌ App Crashes After Deploy

**Check Environment Variables:**

- Đảm bảo tất cả biến đã được set
- Không có typo trong tên biến

**Check Logs:**

```
[Logs] → Filter by "error"
```

### ❌ Disk Not Mounted

**Verify Mount Path:**

```
Mount Path: /opt/render/project/src/server/data
```

**Test trong code:**

```javascript
const fs = require("fs");
console.log(
  "Data dir exists:",
  fs.existsSync("/opt/render/project/src/server/data"),
);
```

### ❌ Free Tier Sleep

Render Free tier "ngủ" sau 15 phút không activity:

- First request sau khi ngủ: ~30 giây
- **Solution:** Dùng cron job ping health check

---

## 📊 Giám Sát App

### 1. Logs

```
Dashboard → Your Service → Logs
```

### 2. Metrics

```
Dashboard → Your Service → Metrics
- CPU Usage
- Memory Usage
- Request Count
```

### 3. Events

```
Dashboard → Your Service → Events
- Deploy history
- Auto-deploy triggers
```

---

## 🔐 Bảo Mật

### 1. Environment Secrets

- ✅ ĐÃ làm: Environment variables
- ❌ KHÔNG commit `.env` vào git

### 2. HTTPS

- ✅ Render tự động cung cấp SSL certificate
- URL: `https://...` (không cần config)

### 3. Firewall

- Render tự động bảo vệ
- Chỉ allow HTTP/HTTPS traffic

---

## 💰 Chi Phí

### Free Plan:

- ✅ 750 giờ/tháng (đủ chạy 24/7)
- ✅ 1 GB disk
- ✅ Auto SSL
- ⚠️ App "ngủ" sau 15 phút idle
- ⚠️ Shared CPU/RAM

### Starter Plan ($7/tháng):

- ✅ Không ngủ
- ✅ Dedicated resources
- ✅ Custom domain

---

## � Chi Tiết Kỹ Thuật: API Endpoints

### Tự Động Phát Hiện Môi Trường

Code đã được thiết kế để tự động detect môi trường và dùng đúng API endpoint:

**Client: `client/src/services/api.js`**

```javascript
const getApiBaseUrl = () => {
  // 1. Ưu tiên env var nếu được set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 2. Production: dùng relative URL (cùng domain)
  if (process.env.NODE_ENV === "production") {
    return "/api";  // ← Render: https://your-app.onrender.com/api
  }
  
  // 3. Development: dùng localhost
  return "http://localhost:3001/api";  // ← Local development
};
```

### Cách Hoạt Động:

| Môi Trường | NODE_ENV | API Base URL | Full URL Example |
|------------|----------|--------------|------------------|
| **Local Dev** | `development` | `http://localhost:3001/api` | `http://localhost:3001/api/health` |
| **Production** | `production` | `/api` | `https://your-app.onrender.com/api/health` |

### Lợi Ích:

✅ **Không cần config thêm** - Tự động detect  
✅ **Không hardcode URL** - Dynamic dựa vào environment  
✅ **Single domain** - Frontend + Backend cùng domain (tránh CORS)  
✅ **Secure** - HTTPS miễn phí từ Render  

### Override (Nếu Cần):

Nếu muốn backend ở domain riêng, set env var khi build:

```bash
# Render Environment Variables
REACT_APP_API_URL=https://api.yourdomain.com/api
```

---

## �🔗 Links Hữu Ích

- **Render Dashboard:** https://dashboard.render.com
- **Docs:** https://render.com/docs
- **Status:** https://status.render.com
- **Community:** https://community.render.com

---

## 📝 Checklist Deploy

- [ ] Push code lên GitHub
- [ ] Tạo Web Service trên Render
- [ ] Connect repository
- [ ] Cấu hình Build/Start commands
- [ ] Thêm Environment Variables (6 biến)
- [ ] Tạo Persistent Disk (1 GB)
- [ ] Click "Create Web Service"
- [ ] Đợi deploy xong (~5-10 phút)
- [ ] Test health endpoint
- [ ] Truy cập web app
- [ ] Upload/seed dữ liệu ban đầu
- [ ] Test các tính năng chính
- [ ] Setup monitoring/alerts (optional)

---

## ✨ Hoàn Thành!

App của bạn đã được deploy thành công! 🎉

**Access URLs:**

- Web App: `https://YOUR_APP.onrender.com`
- API Health: `https://YOUR_APP.onrender.com/api/health`
- API Docs: `https://YOUR_APP.onrender.com/api/platform/platforms`

**Next Steps:**

1. Custom domain (nếu có)
2. Setup monitoring
3. Upgrade to Starter plan (nếu cần)
