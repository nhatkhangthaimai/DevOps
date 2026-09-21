# Fashion Store Mini - Node.js + DevOps CI/CD 🚀

Hệ thống website thương mại điện tử thời trang mini hoàn chỉnh bao gồm giao diện khách hàng (Storefront), cổng quản trị viên (Admin Portal), backend Node.js + Express, quản trị phiên Session an toàn, lưu trữ dữ liệu JSON, Dockerfile đóng gói container và GitHub Actions CI/CD pipeline tự động build & push Docker image lên Docker Hub.

---

## 🌟 1. Công Nghệ Sử Dụng

- **Frontend**: HTML5, CSS3 hiện đại (Design System tùy chỉnh, Google Fonts *Plus Jakarta Sans*, Glassmorphism), Vanilla JavaScript.
- **Backend**: Node.js, Express.js, Session Authentication (`express-session`).
- **Data Layer**: JSON Database (`data/products.json`, `data/orders.json`).
- **DevOps**: Docker (Alpine Linux), Docker Hub, Git, GitHub Actions, Render.

---

## 🚀 2. Địa Chỉ Truy Cập & Tài Khoản Demo

- **Website Khách Hàng**: `http://localhost:3000`
- **Cổng Quản Trị (Admin)**: `http://localhost:3000/admin`
- **Tài khoản Admin Demo (Hard-coded)**:
  - **Tên đăng nhập**: `admin`
  - **Mật khẩu**: `admin123`

---

## 🛍️ 3. Chức Năng Chính

### Phía Khách Hàng:
- Trang chủ giới thiệu thương hiệu, hero banner ấn tượng, các danh mục xu hướng.
- Tìm kiếm sản phẩm realtime và lọc danh mục (Áo, Quần, Áo khoác, Váy đầm, Phụ kiện).
- Lọc theo khoảng giá tùy chỉnh và sắp xếp theo giá/đánh giá/mới nhất.
- Modal xem nhanh sản phẩm (Quick View).
- Giỏ hàng lưu trữ bằng `localStorage` (thêm, sửa số lượng, xóa sản phẩm, làm trống).
- Mã khuyến mãi: `GIAM10` (giảm 10%), `FREESHIP` (miễn phí vận chuyển).
- Modal đặt hàng Checkout: Nhập họ tên, số điện thoại, địa chỉ, phương thức thanh toán (COD / Chuyển khoản QR).
- Xác nhận đặt hàng thành công và sinh mã đơn tự động (`ORD-XXXXXX`).

### Phía Quản Trị Viên (Admin):
- Đăng nhập bảo mật qua backend session.
- **Dashboard**: Thống kê 4 chỉ số KPI quan trọng (Doanh thu demo, Tổng đơn hàng, Tổng sản phẩm trong kho, Đơn chờ xử lý) kèm bảng 5 đơn hàng mới nhất.
- **Quản lý Sản phẩm (CRUD)**:
  - Xem danh sách sản phẩm với ảnh đại diện và tồn kho.
  - Thêm mới sản phẩm có preview và phân loại.
  - Chỉnh sửa thông tin, giá bán, giá gốc, tồn kho.
  - Xóa sản phẩm an toàn với hộp thoại xác nhận.
- **Quản lý Đơn hàng**:
  - Tra cứu đơn hàng theo mã đơn hoặc tên/SĐT khách hàng.
  - Lọc theo trạng thái đơn hàng.
  - Modal xem chi tiết từng món khách đặt.
  - Cập nhật trạng thái đơn: *Chờ xác nhận*, *Đang xử lý*, *Đang giao*, *Đã giao*, *Đã hủy*.

---

## 💻 4. Hướng Dẫn Khởi Chạy Cục Bộ (Local)

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Chạy ứng dụng
- Chế độ thông thường:
  ```bash
  npm start
  ```
- Chế độ tự động reload khi sửa code (Node v18+):
  ```bash
  npm run dev
  ```

Mở trình duyệt truy cập: `http://localhost:3000`.

---

## 🐳 5. Đóng Gói & Chạy Bằng Docker

### Bước 1: Build Docker Image
```bash
docker build -t devops-shop .
```

### Bước 2: Khởi chạy Container
```bash
docker run -d -p 3000:3000 --name devops-fashion devops-shop
```

Kiểm tra container đang chạy:
```bash
docker ps
```
Mở trình duyệt: `http://localhost:3000`.

Dừng container:
```bash
docker stop devops-fashion
docker rm devops-fashion
```

---

## 🔄 6. Cấu Hình CI/CD Pipeline (GitHub Actions)

Quy trình tự động hóa được định nghĩa tại [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

```
Developer -> git push main -> GitHub Actions -> Build Docker Image -> Push lên Docker Hub (nhatkhang2405/devops:latest)
```

### Cấu hình Secrets trên GitHub Repository:
1. Vào repository trên GitHub -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Thêm 2 Repository Secrets:
   - `DOCKER_USERNAME`: Username tài khoản Docker Hub của bạn (ví dụ: `nhatkhang2405`).
   - `DOCKER_PASSWORD`: Personal Access Token hoặc mật khẩu tài khoản Docker Hub.

Mỗi khi bạn thực hiện `git push` lên branch `main`, GitHub Actions sẽ tự động kích hoạt, build image và push lên Docker Hub `nhatkhang2405/devops:latest`.

---

## 🌐 7. Triển Khai Lên Render (Deploy to Render)

1. Đăng nhập [Render.com](https://render.com).
2. Tạo mới **Web Service** -> Chọn **Deploy an existing image from a registry**.
3. Nhập image URL: `docker.io/nhatkhang2405/devops:latest` (hoặc kết nối trực tiếp kho GitHub).
4. Cấu hình Port: `3000`.
5. Bấm **Create Web Service** để ứng dụng của bạn chính thức hoạt động trên Internet!
