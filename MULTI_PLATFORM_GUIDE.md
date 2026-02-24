# 🚀 HỆ THỐNG AUTO POSTING ĐA NỀN TẢNG

## 📋 Tổng quan

Hệ thống đã được **nâng cấp** để hỗ trợ đăng bài tự động lên **nhiều nền tảng**:

- ✅ **Facebook** (Fanpages)
- ✅ **Shopee** (Shop Video)
- 🔄 **Sẵn sàng mở rộng**: TikTok, YouTube, Instagram, Lazada, etc.

## 🏗️ KIẾN TRÚC MỚI

### **Pattern-Based Architecture**

Hệ thống sử dụng **Strategy Pattern** và **Factory Pattern** để dễ dàng thêm platform mới:

```
server/
├── platforms/                    ← Nơi chứa tất cả platform integrations
│   ├── base/
│   │   └── BasePlatform.js      ← Abstract base class
│   ├── facebook/
│   │   └── FacebookPlatform.js  ← Facebook implementation
│   ├── shopee/
│   │   └── ShopeePlatform.js    ← Shopee implementation
│   └── index.js                 ← Platform Factory
│
├── controllers/
│   └── platformController.js    ← Multi-platform controller
│
└── routes/
    └── platform.js              ← Multi-platform routes
```

### **Luồng hoạt động:**

```
Client                    Server                   Platforms
  │                         │                         │
  │─── Get Channels ────────│                         │
  │                         │                         │
  │                         │───── Facebook API ──────│
  │                         │                         │
  │                         │───── Shopee API ────────│
  │                         │                         │
  │◄──── Response ──────────│                         │
  │                         │                         │
  │─── Post Content ────────│                         │
  │                         │                         │
  │                         │───► Upload & Post ──────│
  │                         │                         │
  │◄──── Results ───────────│                         │
```

## 🔌 THÊM PLATFORM MỚI

### **Bước 1: Tạo Platform Class**

Tạo file mới trong `server/platforms/your-platform/YourPlatform.js`:

```javascript
const BasePlatform = require("../base/BasePlatform");
const axios = require("axios");

class YourPlatform extends BasePlatform {
  constructor(config) {
    super("YourPlatform", config);
    this.apiKey = config.apiKey;
    // ... other config
  }

  static getConfigSchema() {
    return {
      name: "YourPlatform",
      requiredFields: [{ name: "apiKey", label: "API Key", type: "text" }],
      optionalFields: [],
      documentation: "https://your-platform-docs.com",
    };
  }

  async validateCredentials() {
    // Verify API credentials
    try {
      // Test API call
      return true;
    } catch (error) {
      return false;
    }
  }

  async getChannels() {
    // Fetch channels/accounts/pages
    try {
      const response = await axios.get("API_URL");
      return response.data.map((channel) => ({
        id: channel.id,
        name: channel.name,
        picture: channel.avatar,
        platform: "yourplatform",
      }));
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async uploadMedia(mediaFile, options = {}) {
    // Upload video/image to platform
    // Return mediaId
  }

  async post(postData, options = {}) {
    // Post content to platform
    const { message, channelId, media } = postData;

    try {
      const response = await axios.post("API_URL", {
        content: message,
        // ... other fields
      });

      return {
        success: true,
        postId: response.data.id,
        platform: "yourplatform",
        channelId: channelId,
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }
}

module.exports = YourPlatform;
```

### **Bước 2: Đăng ký Platform**

Mở `server/platforms/index.js` và thêm:

```javascript
const YourPlatform = require('./yourplatform/YourPlatform');

registerDefaultPlatforms() {
  this.register('facebook', FacebookPlatform);
  this.register('shopee', ShopeePlatform);
  this.register('yourplatform', YourPlatform); // ← Thêm dòng này
}
```

### **Bước 3: Thêm Environment Variables**

Trong `server/.env`:

```env
# Your Platform
YOURPLATFORM_API_KEY=your_api_key_here
YOURPLATFORM_SECRET=your_secret_here
```

### **Bước 4: Update Controller**

Trong `server/controllers/platformController.js`, thêm config:

```javascript
const configs = {
  facebook: { ... },
  shopee: { ... },
  yourplatform: {
    apiKey: process.env.YOURPLATFORM_API_KEY,
    secret: process.env.YOURPLATFORM_SECRET
  }
};
```

### **Bước 5: Update React UI** (Optional)

Thêm icon và color trong `client/src/components/ChannelList.js`:

```javascript
const platformIcons = {
  facebook: "📘",
  shopee: "🛍️",
  yourplatform: "🎯", // ← Thêm icon
};

const platformColors = {
  facebook: "#4267B2",
  shopee: "#EE4D2D",
  yourplatform: "#FF6B6B", // ← Thêm màu
};
```

### **XONG!** 🎉

Platform mới của bạn đã được tích hợp! Hệ thống tự động:

- ✅ Hiển thị trong danh sách platforms
- ✅ Fetch channels tự động
- ✅ Xử lý upload và posting
- ✅ Hiển thị kết quả chi tiết

## 📚 API DOCUMENTATION

### **1. Get Platforms**

```http
GET /api/platform/platforms
```

**Response:**

```json
{
  "success": true,
  "platforms": [
    {
      "platform": "facebook",
      "name": "Facebook",
      "requiredFields": [...],
      "permissions": [...]
    },
    {
      "platform": "shopee",
      "name": "Shopee",
      "requiredFields": [...]
    }
  ]
}
```

### **2. Get Channels**

```http
GET /api/platform/channels?platforms=all
GET /api/platform/channels?platforms=facebook,shopee
```

**Response:**

```json
{
  "success": true,
  "results": {
    "facebook": {
      "success": true,
      "channels": [
        {
          "id": "123456",
          "name": "My Page",
          "picture": "url",
          "platform": "facebook"
        }
      ]
    },
    "shopee": {
      "success": true,
      "channels": [...]
    }
  }
}
```

### **3. Post to Channels**

```http
POST /api/platform/post
Content-Type: multipart/form-data

Body:
- message: string
- channels: JSON array [{ platform, channelId, channelName, accessToken }]
- media: file (optional)
```

**Response:**

```json
{
  "success": true,
  "message": "Posted to 5 channel(s) successfully",
  "results": [
    {
      "platform": "facebook",
      "channelId": "123",
      "channelName": "My Page",
      "success": true,
      "postId": "123_456"
    }
  ],
  "summary": {
    "total": 5,
    "successful": 4,
    "failed": 1
  }
}
```

## ⚙️ CẤU HÌNH

### **Facebook**

```env
FACEBOOK_ACCESS_TOKEN=your_token_here
```

### **Shopee**

```env
SHOPEE_PARTNER_ID=your_partner_id
SHOPEE_PARTNER_KEY=your_partner_key
SHOPEE_SHOP_ID=your_shop_id
```

### **Hướng dẫn lấy credentials:**

#### **Facebook:**

1. Vào: https://developers.facebook.com/tools/explorer/
2. Generate Access Token với permissions
3. Copy token

#### **Shopee:**

1. Đăng ký Shopee Partner: https://open.shopee.com/
2. Tạo App
3. Lấy Partner ID và Partner Key từ App Settings
4. Lấy Shop ID từ shop settings

## 🧪 TESTING

### **Test Multi-Platform API:**

```powershell
# Get all channels
Invoke-WebRequest -Uri "http://localhost:3001/api/platform/channels?platforms=all" -UseBasicParsing

# Get specific platforms
Invoke-WebRequest -Uri "http://localhost:3001/api/platform/channels?platforms=facebook,shopee" -UseBasicParsing
```

### **Test Platform Factory:**

```javascript
const platformFactory = require('./platforms');

// Get available platforms
console.log(platformFactory.getAvailablePlatforms());
// Output: ['facebook', 'shopee']

// Create instance
const facebook = platformFactory.create('facebook', { accessToken: '...' });
const shopee = platformFactory.create('shopee', { partnerId: '...', ... });
```

## 🎯 BEST PRACTICES

### **1. Error Handling**

Mỗi platform tự xử lý errors và trả về format chuẩn qua `formatError()`.

### **2. Logging**

Sử dụng `this.log()` để tracking activities:

```javascript
this.log("Upload started", { filename: file.name });
```

### **3. Configuration**

Luôn define `getConfigSchema()` để document requirements.

### **4. Validation**

Implement `validateCredentials()` để check credentials trước khi dùng.

### **5. Async/Await**

Tất cả methods đều async để handle API calls properly.

## 📊 PLATFORM STATUS

| Platform  | Status          | Features           | Priority |
| --------- | --------------- | ------------------ | -------- |
| Facebook  | ✅ Complete     | Text, Image, Video | High     |
| Shopee    | ✅ Complete     | Video Upload       | High     |
| TikTok    | 🔄 Ready to add | Video              | Medium   |
| YouTube   | 🔄 Ready to add | Video              | Medium   |
| Instagram | 🔄 Ready to add | Image, Video       | Medium   |
| Lazada    | 🔄 Ready to add | Product, Media     | Low      |

## 🚀 ROADMAP

### **Phase 1** (Completed ✅)

- ✅ Tái cấu trúc code theo Pattern
- ✅ Facebook integration
- ✅ Shopee integration
- ✅ Multi-platform UI

### **Phase 2** (Next)

- ⏳ TikTok integration
- ⏳ YouTube integration
- ⏳ Scheduled posting
- ⏳ Template management

### **Phase 3** (Future)

- ⏳ Analytics dashboard
- ⏳ Bulk upload
- ⏳ AI content generator
- ⏳ Database integration

## 💡 TIPS & TRICKS

### **Debugging Platform Issues:**

```javascript
// Enable detailed logging
const platform = platformFactory.create("facebook", config);
platform.log("Debug info", { detail: "..." });
```

### **Handle Platform-Specific Logic:**

```javascript
// In controller
if (platformName === "shopee") {
  // Shopee requires video upload first
  mediaInfo = await platform.uploadMedia(file);
} else if (platformName === "facebook") {
  // Facebook can upload with post
  // Handle inline
}
```

### **Bulk Operations:**

```javascript
// Post to multiple channels in parallel
const promises = channels.map((channel) =>
  platform.post({ message, channelId: channel.id }),
);
const results = await Promise.allSettled(promises);
```

## 🆘 TROUBLESHOOTING

### **Platform không xuất hiện trong UI:**

1. Check `platformFactory.registerDefaultPlatforms()`
2. Check React `platformIcons` đã có icon chưa

### **Lỗi "Platform not configured":**

1. Check `.env` file có đúng variables không
2. Check `platformController.js` có config cho platform đó không

### **Upload video lỗi:**

1. Check file size limit (500MB)
2. Check platform có support video không
3. Check permissions/credentials

---

**Hệ thống hiện đã sẵn sàng để mở rộng! Thêm platform mới chỉ mất ~30 phút!** 🚀
