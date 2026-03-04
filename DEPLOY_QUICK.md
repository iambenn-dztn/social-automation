# 🚀 Quick Deploy Guide - Render.com

## ⚡ 5 Phút Setup Nhanh

### 1️⃣ Push Code Lên GitHub

```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2️⃣ Tạo Service Trên Render

1. Vào: https://dashboard.render.com
2. Click: **New + → Web Service**
3. Connect: Repository `social-automation`

### 3️⃣ Cấu Hình Service

**Build & Deploy:**

```
Build Command: cd server && npm install && npm run build
Start Command: cd server && npm start
```

**Environment Variables (6 biến):**

```
NODE_ENV=production
PORT=10000
FACEBOOK_ACCESS_TOKEN=<your_token>
FACEBOOK_APP_ID=<your_app_id>
FACEBOOK_APP_SECRET=<your_app_secret>
GROQ_API_KEY=<your_groq_key>
```

**Disk:**

```
Name: social-automation-data
Mount Path: /opt/render/project/src/server/data
Size: 1 GB
```

### 4️⃣ Deploy

Click **"Create Web Service"** → Đợi 5-10 phút → Done! ✅

---

## 🔗 URL Sau Khi Deploy

- **Web App:** https://social-automation-XXXX.onrender.com
- **Health Check:** https://social-automation-XXXX.onrender.com/api/health

---

## 📖 Chi Tiết

Xem hướng dẫn đầy đủ tại: **[DEPLOY_RENDER.md](DEPLOY_RENDER.md)**

---

## ✅ Auto-Deploy

Mỗi lần push code mới, Render tự động deploy:

```bash
git add .
git commit -m "Update feature"
git push  # → Auto deploy!
```

---

## 🛠️ Troubleshooting

**Build Failed?**

```bash
# Test locally first
cd server && npm install && npm run build
```

**App Crashed?**

- Check Environment Variables
- View Logs in Render Dashboard

**Data Lost?**

- Verify Disk is mounted at: `/opt/render/project/src/server/data`

---

## 💰 Chi Phí

**Free Plan:**

- ✅ 750 giờ/tháng (free forever)
- ✅ 1 GB persistent disk
- ✅ Auto SSL (HTTPS)
- ⚠️ Ngủ sau 15 phút idle

**Upgrade:** $7/tháng → Không ngủ + Better performance
