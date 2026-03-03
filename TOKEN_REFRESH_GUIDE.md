# Token Auto-Refresh Guide

## Tổng quan

Tính năng auto-refresh giúp bạn tự động làm mới Facebook Access Token để tránh bị hết hạn. Token từ Facebook Graph API Explorer có thời hạn ngắn (1-2 giờ), nhưng với tính năng này, bạn có thể:

1. **Exchange Token**: Đổi short-lived token (1-2h) thành long-lived token (60 ngày)
2. **Get Page Token**: Lấy Page Access Token (không bao giờ hết hạn) từ long-lived token
3. **Auto Update**: Tự động cập nhật token mới vào file `.env`

## Cấu hình ban đầu

### Bước 1: Lấy Facebook App ID và App Secret

1. Truy cập: https://developers.facebook.com/apps/
2. Chọn App của bạn (hoặc tạo mới)
3. Vào **Settings** → **Basic**
4. Copy **App ID** và **App Secret**
5. Thêm vào file `server/.env`:

```env
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
```

### Bước 2: Lấy Short-Lived Token

1. Truy cập: https://developers.facebook.com/tools/explorer/
2. Chọn App của bạn
3. Click **Generate Access Token**
4. Grant permissions: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`
5. Copy token (bắt đầu bằng `EAAA...`)

## Cách sử dụng

### Phương pháp 1: Sử dụng UI (Khuyến nghị)

1. Khởi động server và client
2. Truy cập: http://localhost:3000/token
3. Nhập short-lived token vừa lấy được
4. Click **"Làm mới Token mới"**
5. Kiểm tra kết quả:
   - ✅ Thành công: Token mới được hiển thị và tự động lưu vào `.env`
   - ❌ Thất bại: Xem message lỗi và kiểm tra lại token/credentials

### Phương pháp 2: Sử dụng CLI

```bash
cd server
node utils/refreshFacebookToken.js YOUR_SHORT_LIVED_TOKEN
```

Kết quả:

```
🔄 Step 1: Exchanging short-lived token for long-lived token...
✅ Long-lived token received (expires in 60 days)

🔄 Step 2: Getting user info...
✅ User: Your Name (ID: 123456789)

🔄 Step 3: Getting page access tokens...
✅ Found 2 pages
   - Page 1: Your Page Name
   - Page 2: Another Page

🔄 Step 4: Verifying new token...
✅ Token valid for: Your Page Name
   App ID: 123456789
   Expires: Never

🔄 Step 5: Updating .env file...
✅ .env updated with new page access token

🎉 Token refresh completed!
```

### Phương pháp 3: Refresh token hiện tại

Nếu token hiện tại vẫn còn hạn (chưa đến 60 ngày):

**UI:**

1. Vào http://localhost:3000/token
2. Click **"Làm mới Token hiện tại"**

**CLI:**

```bash
cd server
node utils/refreshFacebookToken.js
```

## Kiểm tra Token

### Xem thông tin token hiện tại

**UI:**

- Vào http://localhost:3000/token
- Thông tin hiển thị:
  - ✅ Valid / ❌ Invalid
  - Token Type (USER / PAGE)
  - Expiration Date
  - Scopes/Permissions
  - User/Page Info

**API:**

```bash
curl http://localhost:3001/api/token/info
```

### Debug token thủ công

Truy cập: https://developers.facebook.com/tools/debug/accesstoken/

Paste token và click **Debug** để xem chi tiết.

## Troubleshooting

### Lỗi: "Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET"

**Nguyên nhân:** Chưa cấu hình App credentials

**Giải pháp:**

1. Kiểm tra file `server/.env`
2. Đảm bảo có `FACEBOOK_APP_ID` và `FACEBOOK_APP_SECRET`
3. Restart server sau khi thêm

### Lỗi: "Invalid OAuth access token" (Code 190)

**Nguyên nhân:** Token đã hết hạn hoặc không hợp lệ

**Giải pháp:**

1. Lấy short-lived token mới từ Graph API Explorer
2. Đảm bảo grant đủ permissions
3. Sử dụng token ngay sau khi generate (1-2h)

### Lỗi: "No pages found for this user"

**Nguyên nhân:** User không có Facebook Page nào

**Giải pháp:**

1. Tạo Facebook Page tại: https://www.facebook.com/pages/create/
2. Đảm bảo user có role Admin/Editor trên Page
3. Grant permission `pages_show_list` khi lấy token

### Lỗi: "Error updating .env file"

**Nguyên nhân:** Server không có quyền ghi file

**Giải pháp:**

```bash
chmod 644 server/.env
```

### Token refresh thành công nhưng auto-post vẫn lỗi

**Nguyên nhân:** Server đang dùng old token trong memory

**Giải pháp:**

1. Restart server để load .env mới:
   ```bash
   # Ctrl+C để stop server
   npm run server
   ```
2. Hoặc dùng nodemon (auto-restart):
   ```bash
   cd server
   npm install -D nodemon
   npx nodemon server.js
   ```

## Best Practices

### 1. Refresh định kỳ

Mặc dù Page Token không hết hạn, nên refresh 1-2 lần/năm để:

- Cập nhật permissions mới
- Đảm bảo token không bị revoke

### 2. Backup token

Lưu file `.env` vào nơi an toàn (KHÔNG commit lên Git)

### 3. Monitor token health

Sử dụng `/token` page để kiểm tra trạng thái token thường xuyên

### 4. Security

- **KHÔNG** share token với người khác
- **KHÔNG** commit `.env` lên repository
- Kiểm tra `.gitignore` có chứa `.env`

## Flow hoàn chỉnh

```
┌─────────────────────────────────────────────────────┐
│ 1. Get Short-Lived Token (Graph API Explorer)      │
│    - Expires: 1-2 hours                             │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ 2. Exchange → Long-Lived Token                      │
│    - Expires: 60 days                               │
│    - Uses: APP_ID + APP_SECRET                      │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ 3. Get Page Access Token                            │
│    - Expires: Never                                 │
│    - Automatically saved to .env                    │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ 4. Verify Token                                      │
│    - Check validity                                 │
│    - Confirm permissions                            │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ 5. Ready for Auto-Post! 🎉                          │
└─────────────────────────────────────────────────────┘
```

## API Reference

### GET /api/token/info

**Response:**

```json
{
  "success": true,
  "data": {
    "isValid": true,
    "tokenType": "PAGE",
    "expiresAt": null,
    "scopes": ["pages_manage_posts", "pages_read_engagement"],
    "user": {
      "id": "123456789",
      "name": "Your Page Name"
    }
  }
}
```

### POST /api/token/refresh

**Request:**

```json
{
  "shortLivedToken": "EAAA..." // Optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "pageId": "123456789",
    "pageName": "Your Page Name",
    "tokenType": "PAGE",
    "expiresAt": null
  }
}
```

## Tham khảo

- [Facebook Access Tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens)
- [Facebook Token Exchange](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived)
- [Page Access Tokens](https://developers.facebook.com/docs/pages/access-tokens)
