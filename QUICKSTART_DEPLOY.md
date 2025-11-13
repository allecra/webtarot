# ⚡ Quick Start - Deploy lên Render trong 10 phút

## 🎯 Bạn đã có:
- ✅ Langflow trên ngrok: `https://a8d0b6f3f22d.ngrok-free.app/flows`
- ✅ Code project sẵn sàng
- ✅ Các file config đã được tạo

## 🚀 3 Bước Deploy Nhanh

### Bước 1: Push Code lên GitHub (2 phút)

```bash
# Nếu chưa có Git repo
git init
git add .
git commit -m "Initial commit - Ready for deployment"

# Tạo repo mới trên GitHub: github.com/new
# Sau đó:
git remote add origin https://github.com/YOUR_USERNAME/testflowtarot.git
git branch -M main
git push -u origin main
```

### Bước 2: Deploy Backend trên Render (5 phút)

1. **Tạo tài khoản Render:** https://render.com (Free)

2. **Tạo Web Service mới:**
   - Click **"New +"** → **"Web Service"**
   - Connect GitHub → Chọn repo `testflowtarot`

3. **Cấu hình:**
   ```
   Name: tamtam-tarot-api
   Region: Singapore
   Branch: main
   Runtime: Python 3
   
   Build Command: ./build.sh
   Start Command: python tarot_api_final.py
   
   Instance Type: Free
   ```

4. **Thêm Environment Variables:**
   
   Click "Advanced" → "Add Environment Variable":
   
   ```
   LANGFLOW_URL=https://a8d0b6f3f22d.ngrok-free.app/api/v1/run/eaa8dfa7-2bfb-4dc1-98fd-b110b2e71994
   ```
   
   ```
   LANGFLOW_API_KEY=sk-t-cDOotEqOWn_6fLSg3ufyLK6G8rYxaaDyYtjy4mJgM
   ```
   
   ```
   PYTHON_VERSION=3.10.0
   ```

5. **Click "Create Web Service"** → Đợi 3-5 phút

6. **Lấy URL Backend:**
   - Sau khi deploy xong: `https://tamtam-tarot-api.onrender.com`
   - Copy URL này!

### Bước 3: Cập nhật Frontend & Deploy (3 phút)

**Option A: Deploy Frontend cùng Backend (Đơn giản nhất)**

1. Sửa file `app.js`, tìm dòng 24-26:

```javascript
// Production: use same domain or custom API URL
// Nếu deploy cùng domain, dùng relative path
return window.location.origin + '/api';
```

Không cần sửa gì! Frontend sẽ tự động dùng API từ cùng domain.

2. Thêm vào `tarot_api_final.py` (trước dòng `if __name__ == '__main__':`):

```python
from flask import send_from_directory

# Serve static files
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    try:
        return send_from_directory('.', path)
    except:
        return send_from_directory('.', 'index.html')
```

3. Push code:

```bash
git add .
git commit -m "Add static file serving"
git push origin main
```

4. Render sẽ tự động redeploy!

**✅ XONG! Truy cập:**
```
https://tamtam-tarot-api.onrender.com
```

---

**Option B: Deploy Frontend riêng (Nâng cao)**

1. Sửa file `app.js`, dòng 26:

```javascript
// Thay bằng URL backend của bạn:
return 'https://tamtam-tarot-api.onrender.com/api';
```

2. Push code:

```bash
git add app.js
git commit -m "Update production API URL"
git push origin main
```

3. Tạo Static Site trên Render:
   - New + → Static Site
   - Connect repo
   - Name: `tamtam-tarot-web`
   - Build Command: (để trống)
   - Publish Directory: `.`

4. **✅ XONG! Truy cập:**
```
https://tamtam-tarot-web.onrender.com
```

---

## 🧪 Kiểm Tra Deployment

### Test Backend:

```bash
# Health check
curl https://tamtam-tarot-api.onrender.com/api/health

# Test reading
curl -X POST https://tamtam-tarot-api.onrender.com/api/tarot/reading \
  -H "Content-Type: application/json" \
  -d '{"spread":"three","question":"Test deployment"}'
```

### Test Frontend:

1. Mở browser: `https://tamtam-tarot-api.onrender.com`
2. Click một spread type
3. Click "Bắt Đầu Bói"
4. Xem kết quả!

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Ngrok URL Thay Đổi

**Vấn đề:** Ngrok free tier URL thay đổi sau mỗi 2 giờ hoặc restart.

**Giải pháp:**
- Mỗi khi ngrok URL thay đổi:
  1. Vào Render Dashboard
  2. Service `tamtam-tarot-api` → Environment
  3. Sửa `LANGFLOW_URL` thành URL mới
  4. Restart service

**Long-term solution:**
- Deploy Langflow lên cloud (Langflow Cloud, Railway, Render)
- Hoặc mua ngrok Pro ($8/tháng) để có static URL

### 2. Free Tier Sleep

**Render Free:**
- Service sleep sau 15 phút không có traffic
- Request đầu tiên sau khi sleep: ~30s để wake up

**Giải pháp:**
- Chấp nhận (free mà!)
- Hoặc upgrade Starter Plan: $7/tháng, không sleep

### 3. Build Script Permission

Nếu build fail với lỗi "permission denied":

```bash
chmod +x build.sh
git add build.sh
git commit -m "Fix build.sh permission"
git push origin main
```

---

## 🔒 Bảo Mật

### KHÔNG commit API keys!

File `.gitignore` đã bảo vệ:
- `.env` (local secrets)
- `venv/` (dependencies)
- `__pycache__/` (Python cache)

### Quản lý secrets trên Render:

**✅ ĐÚNG:** Dùng Environment Variables trong Render UI  
**❌ SAI:** Hardcode keys trong code

---

## 📊 Monitor Service

### Xem Logs:

1. Render Dashboard
2. Chọn service `tamtam-tarot-api`
3. Tab "Logs" → Real-time logs
4. Tab "Events" → Deployment history

### Metrics:

- Tab "Metrics" → CPU, Memory, Response time
- Health check status

---

## 🐛 Troubleshooting Nhanh

### Lỗi: Build Failed

```bash
# Fix permission
chmod +x build.sh
git add build.sh
git commit -m "Fix permission"
git push
```

### Lỗi: Application Error

1. Check Render Logs
2. Verify Environment Variables đã set đúng chưa
3. Test local: `python tarot_api_final.py`

### Lỗi: CORS

Backend đã có CORS config. Nếu vẫn lỗi, check:
- API URL trong `app.js` có đúng không?
- Browser console có báo gì không?

### Lỗi: Langflow không kết nối

1. Kiểm tra ngrok có đang chạy không
2. Test Langflow URL trực tiếp: `https://a8d0b6f3f22d.ngrok-free.app`
3. Kiểm tra `LANGFLOW_URL` trong Render Environment Variables

---

## 🎉 Hoàn Thành!

Bây giờ bạn có một ứng dụng Tarot online hoàn chỉnh:

✅ Backend API chạy trên Render  
✅ Frontend accessible from anywhere  
✅ Kết nối với Langflow AI  
✅ Secure với environment variables  
✅ Free hosting!  

**Live URL:** `https://tamtam-tarot-api.onrender.com`

---

## 📚 Tài Liệu Chi Tiết

- **Full Guide:** Xem file `DEPLOY_RENDER.md`
- **Architecture:** Xem file `README.md`
- **Render Docs:** https://render.com/docs

---

**Made with ✨ by Tamtam Tarot**

