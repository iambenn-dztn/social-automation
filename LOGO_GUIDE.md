# 🎨 Logo Design Guide

## Logo hiện tại

Logo được thiết kế với các yếu tố:

### 📐 Cấu trúc

- **Chữ "M"**: Đại diện cho Media/Marketing/Multi-platform
- **Sóng (Wave)**: Biểu trưng cho Communication/Social networking
- **Dots (Chấm tròn)**: Mạng lưới kết nối, các nền tảng

### 🎨 Màu sắc

- **Orange Gradient**: #FF6B35 → #FF8C42 (Năng động, sáng tạo)
- **Blue Gradient**: #004E89 → #1A535C (Chuyên nghiệp, tin cậy)

### ✨ Hiệu ứng

- Float animation: Logo có hiệu ứng nhẹ nhàng lên xuống
- Drop shadow cho độ sâu
- Responsive: Tự động điều chỉnh kích thước theo màn hình

## 🔧 Tùy chỉnh

### Để thay đổi logo:

1. **Thay bằng ảnh PNG/SVG**:

```jsx
// Trong Logo.js
<img src="/logo.png" alt="Company Logo" className="logo-image" />
```

2. **Chỉnh sửa SVG hiện tại**:

- Mở file: `client/src/components/Logo.js`
- Chỉnh sửa phần `<svg>...</svg>`

3. **Thay đổi màu**:

- Sửa gradient colors trong `<defs>`
- Hoặc thay thế bằng màu solid

### Kích thước mặc định:

- Desktop: 60x60px
- Mobile: 45x45px
- Small mobile: 50x50px (chỉ icon)

## 📍 Vị trí

- **Header**: Góc trái, với text bên cạnh
- **SideNav**: Icon 🚀 ở đầu menu (có thể thay bằng logo nhỏ)

## 🎯 Đề xuất nếu cần logo thật

Có thể sử dụng các công cụ:

- **Figma/Adobe Illustrator**: Thiết kế chuyên nghiệp
- **Canva**: Template có sẵn cho media company
- **Looka/Brandmark**: AI generate logo
- **99designs**: Thuê designer

### Specs khi đặt logo:

- Format: SVG (tốt nhất) hoặc PNG transparent
- Kích thước: 200x200px minimum
- Có cả version dark/light nếu cần
- Files: logo-full.svg (có text), logo-icon.svg (chỉ icon)
