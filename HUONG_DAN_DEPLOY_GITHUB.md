# 🚀 Hướng Dẫn Deploy Web Tarot lên GitHub Pages

## ✅ Có thể deploy được!

**GitHub Pages** hoàn toàn miễn phí và phù hợp để deploy frontend của bạn.

---

## 📋 Các bước thực hiện (5 phút)

### Bước 1: Sửa URL Backend trong `app.js`

Mở file `app.js`, tìm function `getApiUrl()` (dòng 20-30) và sửa như sau:

```javascript
getApiUrl() {
    // Check if running on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    // Production: Thay YOUR_BACKEND_URL bằng URL backend của bạn
    return 'https://tarot-eu34.onrender.com/api';  // ← Sửa dòng này
}
```

**Lưu ý:** Thay `tarot-eu34.onrender.com` bằng URL backend thực tế của bạn (từ Render.com hoặc platform khác).

### Bước 2: Tạo GitHub Repository

1. Vào https://github.com/new
2. Repository name: `tarot-mystic` (hoặc tên bạn muốn)
3. Chọn **Public** (GitHub Pages free chỉ hoạt động với Public repo)
4. Click **Create repository**

### Bước 3: Push code lên GitHub

Mở terminal trong thư mục project và chạy:

```bash
# Khởi tạo Git (nếu chưa có)
git init

# Thêm tất cả files
git add .

# Commit
git commit -m "Initial commit - Tarot Web App"

# Thêm remote (thay YOUR_USERNAME bằng username GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/tarot-mystic.git

# Push lên GitHub
git branch -M main
git push -u origin main
```

### Bước 4: Bật GitHub Pages

1. Vào repo trên GitHub: `https://github.com/YOUR_USERNAME/tarot-mystic`
2. Click tab **Settings** (ở trên cùng)
3. Scroll xuống phần **Pages** (bên menu trái)
4. **Source**: Chọn `Deploy from a branch`
5. **Branch**: Chọn `main` và folder `/ (root)`
6. Click **Save**

### Bước 5: Đợi deploy (1-2 phút)

GitHub sẽ tự động build và deploy. Sau đó bạn sẽ có URL:

```
https://YOUR_USERNAME.github.io/tarot-mystic
```

**Ví dụ:** Nếu username là `allecra`, URL sẽ là:
```
https://allecra.github.io/tarot-mystic
```

---

## ⚠️ Lưu ý quan trọng

### 1. Backend phải deploy riêng

GitHub Pages **chỉ host static files** (HTML/CSS/JS), không chạy được Python backend.

**Giải pháp:** Deploy backend lên Render.com (miễn phí):
- Xem hướng dẫn trong file `QUICKSTART_DEPLOY.md`
- Hoặc file `DEPLOY_GITHUB.md` (chi tiết hơn)

### 2. CORS Configuration

Backend phải cho phép request từ GitHub Pages domain. Code đã có `CORS(app)` nên sẽ hoạt động.

### 3. Files cần thiết

GitHub Pages sẽ tự động deploy tất cả files trong repo. Đảm bảo có:
- ✅ `index.html`
- ✅ `app.js`
- ✅ `styles.css`
- ✅ `particles.js`
- ✅ `music/background.mp3` (nếu có)

### 4. Không commit file nhạy cảm

Đảm bảo file `.gitignore` có:
```
.env
venv/
__pycache__/
*.pyc
```

---

## 🧪 Test sau khi deploy

1. Mở URL GitHub Pages: `https://YOUR_USERNAME.github.io/tarot-mystic`
2. Mở Developer Tools (F12) → Console
3. Thử bói một lá bài
4. Kiểm tra:
   - ✅ Website load được
   - ✅ Không có lỗi CORS
   - ✅ API call thành công
   - ✅ Kết quả hiển thị đúng

---

## 🐛 Troubleshooting

### Lỗi: "Cannot connect to backend"

**Nguyên nhân:** URL backend trong `app.js` sai hoặc backend chưa deploy.

**Giải pháp:**
1. Kiểm tra URL backend trong `app.js` có đúng không
2. Test backend trực tiếp: `curl https://YOUR_BACKEND_URL/api/health`
3. Đảm bảo backend đã deploy và đang chạy

### Lỗi: "404 Not Found"

**Nguyên nhân:** GitHub Pages chưa được bật hoặc file không tồn tại.

**Giải pháp:**
1. Kiểm tra Settings → Pages đã bật chưa
2. Đợi 2-3 phút sau khi enable
3. Hard refresh: `Ctrl + F5`

### Lỗi: CORS Error

**Nguyên nhân:** Backend chưa cho phép request từ GitHub Pages.

**Giải pháp:**
1. Kiểm tra backend có `CORS(app)` chưa
2. Kiểm tra `flask-cors` đã được cài: `pip install flask-cors`
3. Restart backend

---

## 📊 Kiến trúc sau khi deploy

```
┌─────────────────────────────────────┐
│   GitHub Pages (Frontend)          │
│   https://username.github.io/...   │
│   • index.html                     │
│   • app.js                         │
│   • styles.css                     │
└──────────────┬──────────────────────┘
               │ API Call
               ↓
┌─────────────────────────────────────┐
│   Render.com (Backend)              │
│   https://tarot-api.onrender.com    │
│   • tarot_api_final.py             │
│   • Flask API                      │
└──────────────┬──────────────────────┘
               │
               ↓
        ┌──────────────┐
        │  Langflow    │
        │  + Gemini AI │
        └──────────────┘
```

---

## ✅ Checklist hoàn thành

- [ ] Sửa URL backend trong `app.js`
- [ ] Tạo GitHub repository
- [ ] Push code lên GitHub
- [ ] Bật GitHub Pages trong Settings
- [ ] Deploy backend lên Render.com
- [ ] Test website hoạt động
- [ ] Kiểm tra không có lỗi trong Console

---

## 🎉 Hoàn thành!

Sau khi hoàn thành, bạn sẽ có:

✅ **Frontend:** `https://YOUR_USERNAME.github.io/tarot-mystic`  
✅ **Backend:** `https://YOUR_BACKEND_URL.onrender.com`  
✅ **Ứng dụng Tarot hoàn chỉnh** chạy trên internet!

---

## 📚 Tài liệu tham khảo

- **GitHub Pages Docs:** https://docs.github.com/en/pages
- **Hướng dẫn chi tiết:** Xem file `DEPLOY_GITHUB.md`
- **Deploy Backend:** Xem file `QUICKSTART_DEPLOY.md`

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-16

