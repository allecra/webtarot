# 🚀 Hướng Dẫn Deploy Web Tarot lên GitHub

## 📋 Tổng Quan

Bạn có thể deploy web Tarot này lên GitHub theo **2 cách**:

1. **GitHub Pages** - Chỉ deploy **Frontend** (HTML/JS/CSS) - **MIỄN PHÍ**
2. **GitHub Repository** - Lưu trữ code và deploy backend lên các platform khác (Render, Railway, Vercel)

---

## 🎯 Option 1: Deploy Frontend lên GitHub Pages (Đơn giản nhất)

### ✅ Ưu điểm:
- **Hoàn toàn miễn phí**
- Tự động deploy khi push code
- URL đẹp: `https://YOUR_USERNAME.github.io/testflowtarot`
- Không cần server

### ⚠️ Hạn chế:
- **Chỉ deploy được Frontend** (HTML/JS/CSS)
- Backend phải deploy riêng trên Render/Railway/Vercel
- Cần cấu hình CORS

### 📝 Các bước thực hiện:

#### Bước 1: Chuẩn bị code

1. **Tạo file `.github/workflows/deploy.yml`** (tự động tạo khi push)

Hoặc đơn giản hơn, chỉ cần:

2. **Sửa file `app.js`** để trỏ đến backend production:

Tìm dòng 20-29 trong `app.js`:

```javascript
getApiUrl() {
    // Check if running on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    // Production: use same domain or custom API URL
    // Nếu deploy cùng domain, dùng relative path
    return window.location.origin + '/api';
    // Hoặc nếu backend deploy riêng, uncomment dòng dưới và thay YOUR_BACKEND_URL:
    // return 'https://YOUR_BACKEND_URL.onrender.com/api';
}
```

**Sửa thành:**

```javascript
getApiUrl() {
    // Check if running on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    // Production: Backend URL (thay bằng URL backend của bạn)
    return 'https://tamtam-tarot-api.onrender.com/api';
    // Hoặc nếu bạn deploy backend ở nơi khác, thay URL ở đây
}
```

#### Bước 2: Push code lên GitHub

```bash
# Nếu chưa có Git repo
git init
git add .
git commit -m "Initial commit - Ready for GitHub Pages"

# Tạo repo mới trên GitHub:
# 1. Vào https://github.com/new
# 2. Tên repo: testflowtarot (hoặc tên bạn muốn)
# 3. Chọn Public (GitHub Pages chỉ hoạt động với Public repo trên free tier)
# 4. Click "Create repository"

# Sau đó:
git remote add origin https://github.com/YOUR_USERNAME/testflowtarot.git
git branch -M main
git push -u origin main
```

#### Bước 3: Bật GitHub Pages

1. Vào repo trên GitHub: `https://github.com/YOUR_USERNAME/testflowtarot`
2. Click **Settings** (cài đặt)
3. Scroll xuống phần **Pages** (bên trái)
4. **Source**: Chọn `Deploy from a branch`
5. **Branch**: Chọn `main` và folder `/ (root)`
6. Click **Save**

#### Bước 4: Đợi deploy (1-2 phút)

GitHub sẽ tự động build và deploy. Sau đó bạn sẽ có URL:

```
https://YOUR_USERNAME.github.io/testflowtarot
```

#### Bước 5: Deploy Backend (Bắt buộc)

Frontend cần backend API để hoạt động. Deploy backend lên Render:

**Xem hướng dẫn chi tiết trong file `QUICKSTART_DEPLOY.md`**

Tóm tắt:
1. Tạo tài khoản Render: https://render.com
2. Connect GitHub repo
3. Tạo Web Service với:
   - Build: `./build.sh`
   - Start: `python tarot_api_final.py`
4. Thêm Environment Variables:
   - `LANGFLOW_URL`
   - `LANGFLOW_API_KEY`
5. Lấy URL backend và cập nhật vào `app.js` (Bước 1)

---

## 🎯 Option 2: Deploy Full Stack (Frontend + Backend cùng domain)

### ✅ Ưu điểm:
- Frontend và Backend cùng domain
- Không cần cấu hình CORS phức tạp
- Dễ quản lý hơn

### 📝 Các bước:

#### Bước 1: Cập nhật Backend để serve static files

Thêm vào file `tarot_api_final.py` (trước dòng `if __name__ == '__main__':`):

```python
# Serve static files for frontend
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Serve static files (CSS, JS, images)
    if path.endswith(('.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.mp3')):
        return send_from_directory('.', path)
    # Fallback to index.html for SPA routing
    return send_from_directory('.', 'index.html')
```

#### Bước 2: Sửa `app.js`

Đảm bảo `getApiUrl()` trả về relative path:

```javascript
getApiUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    // Production: same domain
    return window.location.origin + '/api';
}
```

#### Bước 3: Deploy lên Render

1. Push code lên GitHub (như Option 1, Bước 2)
2. Deploy trên Render như hướng dẫn trong `QUICKSTART_DEPLOY.md`
3. Render sẽ tự động serve cả frontend và backend

**URL:** `https://tamtam-tarot-api.onrender.com`

---

## 🔧 Cấu Hình Bổ Sung

### Tạo file `.github/workflows/deploy.yml` (Tùy chọn)

Nếu muốn tự động deploy khi push code:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

**Lưu ý:** Với GitHub Pages đơn giản, bạn không cần file này. Chỉ cần bật Pages trong Settings là đủ.

---

## 📁 Cấu Trúc File Cần Deploy

### Cho GitHub Pages (Frontend only):

```
testflowtarot/
├── index.html          ✅ Cần
├── app.js              ✅ Cần
├── styles.css          ✅ Cần
├── particles.js        ✅ Cần
├── music/              ✅ Cần (nếu có)
│   └── background.mp3
└── .gitignore          ✅ Cần (để không commit file nhạy cảm)
```

### File KHÔNG cần cho GitHub Pages:

```
├── tarot_api_final.py  ❌ Backend (deploy riêng)
├── requirements.txt    ❌ Backend dependencies
├── venv/              ❌ Virtual environment
├── .env               ❌ Secrets (đã có trong .gitignore)
└── test_*.py          ❌ Test files
```

**Lưu ý:** GitHub Pages sẽ tự động deploy tất cả file trong repo. Bạn có thể tạo branch `gh-pages` riêng chỉ chứa frontend files nếu muốn.

---

## 🐛 Troubleshooting

### Lỗi: "Cannot connect to backend"

**Nguyên nhân:** Frontend không tìm thấy backend API.

**Giải pháp:**
1. Kiểm tra URL backend trong `app.js` có đúng không
2. Kiểm tra backend đã deploy và đang chạy chưa
3. Test backend trực tiếp: `curl https://YOUR_BACKEND_URL/api/health`
4. Kiểm tra CORS trong backend (đã có `CORS(app)` trong code)

### Lỗi: "404 Not Found" trên GitHub Pages

**Nguyên nhân:** GitHub Pages không tìm thấy file.

**Giải pháp:**
1. Kiểm tra file `index.html` có trong root directory không
2. Kiểm tra Settings → Pages đã bật chưa
3. Đợi 1-2 phút sau khi enable Pages
4. Hard refresh browser: `Ctrl + F5`

### Lỗi: CORS Error

**Nguyên nhân:** Backend chưa cho phép request từ GitHub Pages domain.

**Giải pháp:**
Backend đã có `CORS(app)` nên sẽ cho phép tất cả origins. Nếu vẫn lỗi:
1. Kiểm tra backend có đang chạy không
2. Kiểm tra `flask-cors` đã được cài đặt: `pip install flask-cors`

---

## 🔒 Bảo Mật

### ✅ Đã được bảo vệ:

- File `.gitignore` đã loại trừ:
  - `.env` (chứa API keys)
  - `venv/` (dependencies)
  - `__pycache__/` (Python cache)

### ⚠️ Lưu ý:

- **KHÔNG commit file `.env`** lên GitHub
- **KHÔNG hardcode API keys** trong code
- Sử dụng **Environment Variables** trên Render cho backend
- GitHub Pages repo nên là **Public** (free tier)

---

## 📊 So Sánh Các Phương Án

| Phương án | Chi phí | Độ khó | Frontend | Backend |
|-----------|---------|--------|----------|---------|
| **GitHub Pages + Render** | Miễn phí | Dễ | ✅ GitHub Pages | ✅ Render |
| **Render Full Stack** | Miễn phí | Trung bình | ✅ Render | ✅ Render |
| **Vercel Frontend + Railway Backend** | Miễn phí | Trung bình | ✅ Vercel | ✅ Railway |

**Khuyến nghị:** Option 1 (GitHub Pages + Render) - Đơn giản và miễn phí!

---

## 🎉 Hoàn Thành!

Sau khi deploy xong, bạn sẽ có:

✅ **Frontend:** `https://YOUR_USERNAME.github.io/testflowtarot`  
✅ **Backend:** `https://tamtam-tarot-api.onrender.com`  
✅ **Ứng dụng Tarot hoàn chỉnh** chạy trên internet!

---

## 📚 Tài Liệu Tham Khảo

- **GitHub Pages Docs:** https://docs.github.com/en/pages
- **Render Docs:** https://render.com/docs
- **Hướng dẫn deploy Render:** Xem file `QUICKSTART_DEPLOY.md`
- **Architecture:** Xem file `README.md`

---

**Made with ✨ by Tamtam Tarot**

**Version:** 1.0.0  
**Last Updated:** 2025-01-11

