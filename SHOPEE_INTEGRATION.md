# 🛍️ HƯỚNG DẪN TÍCH HỢP SHOPEE

## 📋 Tổng quan

Shopee Platform cho phép bạn:
- ✅ Upload video lên Shopee Video
- ✅ Quản lý video content
- ✅ Hiển thị video trên shop của bạn

## 🔑 LẤY SHOPEE CREDENTIALS

### **Bước 1: Đăng ký Shopee Open Platform**

1. Truy cập: **https://open.shopee.com/**
2. Click **"Register"** hoặc **"Login"**
3. Đăng nhập bằng tài khoản Shopee Seller của bạn

### **Bước 2: Tạo App**

1. Sau khi đăng nhập, vào **"My Apps"**
2. Click **"Create New App"**
3. Điền thông tin:
   - **App Name**: Tên app của bạn (ví dụ: "Auto Posting Tool")
   - **Category**: Chọn category phù hợp
   - **Description**: Mô tả app
4. Click **"Create"**

### **Bước 3: Lấy Partner ID và Partner Key**

1. Vào app vừa tạo
2. Trong **"App Credentials"**, bạn sẽ thấy:
   - **Partner ID**: Copy số này
   - **Partner Key**: Copy key này (giữ bí mật!)

### **Bước 4: Lấy Shop ID**

#### **Cách 1: Từ Seller Center**
1. Vào: https://seller.shopee.vn/
2. Đăng nhập
3. Vào **"Pengaturan Toko"** (Shop Settings)
4. Shop ID sẽ hiển thị ở phần **"Informasi Toko"**

#### **Cách 2: Từ URL**
1. Vào shop của bạn
2. URL sẽ có dạng: `https://shopee.vn/shop/123456789`
3. Số `123456789` là Shop ID

#### **Cách 3: Dùng API**
```powershell
# Sử dụng Access Token để lấy shop info
$url = "https://partner.shopeemobile.com/api/v2/shop/get_shop_info"
# ... call API
```

### **Bước 5: Configure trong hệ thống**

Mở file `server/.env` và thêm:

```env
SHOPEE_PARTNER_ID=YOUR_PARTNER_ID_HERE
SHOPEE_PARTNER_KEY=YOUR_PARTNER_KEY_HERE
SHOPEE_SHOP_ID=YOUR_SHOP_ID_HERE
```

**Ví dụ:**
```env
SHOPEE_PARTNER_ID=123456
SHOPEE_PARTNER_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx
SHOPEE_SHOP_ID=987654321
```

## 🔐 AUTHENTICATION

Shopee sử dụng **HMAC-SHA256** signature authentication:

### **Signature Generation:**

```javascript
const crypto = require('crypto');

const partnerId = 'YOUR_PARTNER_ID';
const partnerKey = 'YOUR_PARTNER_KEY';
const path = '/api/v2/shop/get_shop_info';
const timestamp = Math.floor(Date.now() / 1000);

const baseString = `${partnerId}${path}${timestamp}`;
const sign = crypto
  .createHmac('sha256', partnerKey)
  .update(baseString)
  .digest('hex');

// Use trong headers:
headers = {
  'partner-id': partnerId,
  'timestamp': timestamp,
  'sign': sign
}
```

## 📹 UPLOAD VIDEO WORKFLOW

### **Shopee Video Upload Process:**

```
1. Initialize Upload
   ↓
2. Get Upload URL
   ↓
3. Upload Video File
   ↓
4. Update Video Info
   ↓
5. Publish/Use Video
```

### **Detailed Steps:**

#### **1. Initialize Upload**
```javascript
POST https://partner.shopeemobile.com/api/v2/media_space/upload_video

Body:
{
  "shop_id": 123456789
}

Response:
{
  "response": {
    "video_id": "v_abc123",
    "upload_url": "https://upload.shopee.com/..."
  }
}
```

#### **2. Upload File**
```javascript
POST [upload_url]
Content-Type: multipart/form-data

Body:
- video: [file binary]
```

#### **3. Update Video Info**
```javascript
POST https://partner.shopeemobile.com/api/v2/media_space/update_video

Body:
{
  "shop_id": 123456789,
  "video_id": "v_abc123",
  "title": "Video title",
  "description": "Video description"
}
```

#### **4. Check Status**
```javascript
POST https://partner.shopeemobile.com/api/v2/media_space/get_video_upload_result

Body:
{
  "shop_id": 123456789,
  "video_id": "v_abc123"
}

Response:
{
  "response": {
    "status": "success", // or "processing", "failed"
    "video_url": "https://..."
  }
}
```

## ⚙️ CONFIGURATION OPTIONS

### **Video Requirements:**

| Parameter | Value |
|-----------|-------|
| **Max File Size** | 500MB |
| **Format** | MP4, MOV, AVI |
| **Min Duration** | 3 seconds |
| **Max Duration** | 60 minutes |
| **Resolution** | 720p or higher recommended |
| **Aspect Ratio** | 9:16 (vertical) or 16:9 (horizontal) |

### **API Limits:**

| Limit Type | Value |
|------------|-------|
| **Requests/second** | 10 |
| **Daily requests** | 100,000 |
| **Concurrent uploads** | 5 |

## 🐛 COMMON ERRORS

### **1. "Invalid signature"**
**Nguyên nhân:** Signature không đúng
**Giải pháp:**
- Check Partner ID và Partner Key
- Check timestamp (Unix timestamp in seconds)
- Check path string chính xác
- Đảm bảo HMAC-SHA256 encoding đúng

### **2. "Shop not found"**
**Nguyên nhân:** Shop ID sai
**Giải pháp:**
- Verify Shop ID từ Seller Center
- Check quyền truy cập shop

### **3. "Upload failed"**
**Nguyên nhân:** Video không đúng format hoặc quá lớn
**Giải pháp:**
- Check file size < 500MB
- Check format (MP4 recommended)
- Check video không corrupt

### **4. "Rate limit exceeded"**
**Nguyên nhân:** Quá nhiều requests
**Giải pháp:**
- Implement rate limiting
- Add delay giữa requests
- Use queue system

## 🧪 TESTING

### **Test Connection:**

```javascript
const ShopeePlatform = require('./platforms/shopee/ShopeePlatform');

const config = {
  partnerId: 'YOUR_PARTNER_ID',
  partnerKey: 'YOUR_PARTNER_KEY',
  shopId: 'YOUR_SHOP_ID'
};

const shopee = new ShopeePlatform(config);

// Test credentials
const isValid = await shopee.validateCredentials();
console.log('Credentials valid:', isValid);

// Get shop info
const channels = await shopee.getChannels();
console.log('Shop info:', channels);
```

### **Test Video Upload:**

```javascript
const mediaFile = {
  path: '/path/to/video.mp4',
  filename: 'video.mp4'
};

// Upload
const uploadResult = await shopee.uploadMedia(mediaFile);
console.log('Upload result:', uploadResult);

// Check status
const status = await shopee.getVideoStatus(uploadResult.mediaId);
console.log('Video status:', status);
```

## 📚 API ENDPOINTS REFERENCE

### **Shop APIs:**

```
GET /api/v2/shop/get_shop_info
- Get shop information
```

### **Media Space APIs:**

```
POST /api/v2/media_space/upload_video
- Initialize video upload

POST /api/v2/media_space/update_video
- Update video information

POST /api/v2/media_space/get_video_upload_result
- Get upload status

POST /api/v2/media_space/get_video_list
- Get list of videos

POST /api/v2/media_space/delete_video
- Delete a video
```

## 🔗 USEFUL LINKS

- **Shopee Open Platform**: https://open.shopee.com/
- **API Documentation**: https://open.shopee.com/documents/v2/v2.media_space.upload_video
- **Developer Portal**: https://partner.shopeemobile.com/
- **Seller Center**: https://seller.shopee.vn/

## ⚠️ IMPORTANT NOTES

### **Permissions Required:**
- Shop owner hoặc authorized user
- App phải được approve bởi Shopee (trong một số thị trường)

### **Production vs Development:**
- Development: Dùng sandbox environment (nếu có)
- Production: Dùng production credentials

### **Security Best Practices:**
- ❌ KHÔNG commit Partner Key vào Git
- ❌ KHÔNG share Partner Key công khai
- ✅ Store trong environment variables
- ✅ Rotate keys định kỳ
- ✅ Monitor API usage

### **Video Guidelines:**
- Video phải tuân thủ Shopee policies
- Không chứa content vi phạm
- Không spam hoặc duplicate content
- Quality video để engagement tốt hơn

## 💡 TIPS & OPTIMIZATION

### **1. Batch Upload:**
```javascript
// Upload nhiều video cùng lúc
const videos = [video1, video2, video3];
const results = await Promise.all(
  videos.map(v => shopee.uploadMedia(v))
);
```

### **2. Progress Tracking:**
```javascript
// Check upload progress
const checkProgress = async (videoId) => {
  let status = 'processing';
  while (status === 'processing') {
    await sleep(5000); // Wait 5s
    const result = await shopee.getVideoStatus(videoId);
    status = result.status;
  }
  return status;
};
```

### **3. Error Retry:**
```javascript
// Retry failed uploads
const uploadWithRetry = async (file, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await shopee.uploadMedia(file);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
};
```

---

**Shopee integration sẵn sàng sử dụng!** 🛍️✨

Nếu gặp vấn đề, check [Shopee Developer Forum](https://openplatform.shopee.com/forum/) hoặc contact Shopee support.
