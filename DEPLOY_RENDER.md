# 🚀 Hướng Dẫn Deploy Tamtam Tarot lên Render

## 📋 Checklist Trước Khi Deploy

- [x] Langflow đã chạy trên ngrok: `https://a8d0b6f3f22d.ngrok-free.app/flows`
- [ ] Có tài khoản GitHub
- [ ] Có tài khoản Render.com (miễn phí)
- [ ] Code đã push lên GitHub

---

## 🎯 Kiến Trúc Deployment

```
┌─────────────────────────────────────────┐
│   Frontend (HTML/CSS/JS)                │
│   Deploy trên Render Static Site        │
│   hoặc cùng với Backend                 │
└──────────────┬──────────────────────────┘
               │
               ↓ API Calls
┌─────────────────────────────────────────┐
│   Backend (Flask API)                   │
│   tarot_api_final.py                    │
│   Deploy trên Render Web Service        │
└──────┬─────────────────────┬────────────┘
       │                     │
       ↓                     ↓
   External API         Langflow (Ngrok)
   Tarot Cards      a8d0b6f3f22d.ngrok-free.app
```

---

## 🔧 Bước 1: Chuẩn Bị Repository

### 1.1. Đảm bảo các file cần thiết đã có:

```
testflowtarot/
├── tarot_api_final.py       ✅ Main backend
├── requirements.txt          ✅ Dependencies
├── build.sh                  ✅ Build script (mới tạo)
├── render.yaml               ✅ Render config (mới tạo)
├── .gitignore                ✅ Git ignore (mới tạo)
├── index.html                ✅ Frontend
├── app.js                    ✅ Frontend logic
├── styles.css                ✅ Styling
└── particles.js              ✅ Effects
```

### 1.2. Tạo file `.env.example` (template cho production)

Tạo file `.env.example`:
```bash
# Langflow Configuration
LANGFLOW_URL=https://a8d0b6f3f22d.ngrok-free.app/api/v1/run/YOUR_FLOW_ID
LANGFLOW_API_KEY=your_langflow_api_key_here

# Port (Render sẽ tự set)
PORT=10000
```

**⚠️ QUAN TRỌNG:** 
- KHÔNG commit file `.env` thật (đã có trong `.gitignore`)
- Chỉ commit `.env.example` làm template

### 1.3. Push code lên GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## 🚀 Bước 2: Deploy Backend lên Render

### 2.1. Tạo Web Service mới

1. Truy cập: https://render.com
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository của bạn
4. Chọn repository: `testflowtarot`

### 2.2. Cấu hình Web Service

**Basic Settings:**
- **Name:** `tamtam-tarot-api` (hoặc tên bạn thích)
- **Region:** `Singapore` (gần Việt Nam nhất)
- **Branch:** `main`
- **Runtime:** `Python 3`

**Build Settings:**
- **Build Command:** `./build.sh`
- **Start Command:** `python tarot_api_final.py`

**Instance Settings:**
- **Instance Type:** `Free` (hoặc chọn paid nếu cần)

### 2.3. Thêm Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Thêm các biến sau:

```
LANGFLOW_URL = https://a8d0b6f3f22d.ngrok-free.app/api/v1/run/eaa8dfa7-2bfb-4dc1-98fd-b110b2e71994
```

```
LANGFLOW_API_KEY = sk-t-cDOotEqOWn_6fLSg3ufyLK6G8rYxaaDyYtjy4mJgM
```

```
PYTHON_VERSION = 3.10.0
```

**⚠️ LƯU Ý về Ngrok:**
- URL ngrok của bạn là URL tạm thời
- Mỗi lần restart ngrok, URL sẽ thay đổi
- Free tier ngrok: URL thay đổi mỗi 2 giờ
- **Giải pháp:** 
  - Upgrade ngrok Pro để có static URL
  - HOẶC deploy Langflow lên cloud (Langflow Cloud, Railway, etc.)

### 2.4. Deploy!

1. Click **"Create Web Service"**
2. Render sẽ tự động:
   - Clone repo
   - Run build.sh
   - Install dependencies
   - Start app
3. Đợi 3-5 phút
4. Backend của bạn sẽ live tại: `https://tamtam-tarot-api.onrender.com`

### 2.5. Kiểm tra deployment

Test health endpoint:
```bash
curl https://tamtam-tarot-api.onrender.com/api/health
```

Kết quả mong đợi:
```json
{
  "status": "healthy",
  "tarot_api": "online",
  "langflow_configured": true,
  "cached_cards": 78
}
```

---

## 🌐 Bước 3: Deploy Frontend

### Cách 1: Deploy Static Site riêng (Recommended)

#### 3.1. Tạo Static Site mới

1. Render Dashboard → **"New +"** → **"Static Site"**
2. Connect cùng GitHub repo
3. **Name:** `tamtam-tarot-web`
4. **Branch:** `main`
5. **Root Directory:** để trống (root)
6. **Build Command:** để trống
7. **Publish Directory:** `.` (current directory)

#### 3.2. Cập nhật API URL trong app.js

Sửa file `app.js`, tìm function `getApiUrl()`:

```javascript
getApiUrl() {
    // Check if running on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000/api';
    }
    // Production: Dùng backend URL từ Render
    return 'https://tamtam-tarot-api.onrender.com/api';
}
```

**Thay `tamtam-tarot-api` bằng tên backend service của bạn!**

#### 3.3. Push changes và redeploy

```bash
git add app.js
git commit -m "Update production API URL"
git push origin main
```

Render sẽ tự động redeploy.

### Cách 2: Serve Frontend từ Backend (Đơn giản hơn)

Nếu muốn frontend và backend cùng một URL:

#### 3.1. Cập nhật `tarot_api_final.py`

Thêm route serve static files:

```python
from flask import send_from_directory

# Add before __main__
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)
```

#### 3.2. Push và deploy

```bash
git add tarot_api_final.py
git commit -m "Add static file serving"
git push origin main
```

Bây giờ truy cập: `https://tamtam-tarot-api.onrender.com` sẽ thấy web!

---

## 🔒 Bước 4: Bảo Mật (Quan Trọng!)

### 4.1. Ẩn API Keys

**KHÔNG** hardcode API keys trong code!

File `tarot_api_final.py` đã dùng environment variables:
```python
LANGFLOW_URL = os.getenv('LANGFLOW_URL', 'default_value')
LANGFLOW_API_KEY = os.getenv('LANGFLOW_API_KEY', 'default_value')
```

### 4.2. Cập nhật `.gitignore`

Đảm bảo file `.env` KHÔNG bị commit:
```
# Environment Variables
.env
.env.local
```

### 4.3. Rotate Keys nếu đã leak

Nếu bạn đã commit keys lên GitHub:
1. Tạo keys mới
2. Update trong Render Environment Variables
3. Restart service

---

## 📊 Bước 5: Monitoring & Logs

### 5.1. Xem Logs trên Render

1. Vào Dashboard → Chọn service
2. Tab **"Logs"** → Xem real-time logs
3. Tab **"Events"** → Xem deployment history

### 5.2. Health Checks

Render tự động ping `/api/health` mỗi 30s.

Nếu health check fail 3 lần → service sẽ restart.

### 5.3. Performance

**Free Tier Limitations:**
- Service sleep sau 15 phút không có traffic
- First request sau khi sleep: ~30s để wake up
- **Giải pháp:** Upgrade paid plan hoặc dùng uptime monitoring

---

## 🐛 Troubleshooting

### Lỗi 1: Build Failed

**Triệu chứng:** Render báo "Build failed"

**Giải pháp:**
```bash
# Kiểm tra build.sh có executable permission
chmod +x build.sh
git add build.sh
git commit -m "Make build.sh executable"
git push
```

### Lỗi 2: Application Error

**Triệu chứng:** 500 Internal Server Error

**Giải pháp:**
1. Check Render logs
2. Verify environment variables
3. Test locally: `python tarot_api_final.py`

### Lỗi 3: CORS Error

**Triệu chứng:** Frontend không call được API

**Giải pháp:**

File `tarot_api_final.py` đã có CORS:
```python
from flask_cors import CORS
CORS(app)
```

Nếu vẫn lỗi, thêm config:
```python
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

### Lỗi 4: Ngrok URL Changed

**Triệu chứng:** Langflow không kết nối được

**Giải pháp:**
1. Restart ngrok → Lấy URL mới
2. Update `LANGFLOW_URL` trong Render Environment Variables
3. Restart Render service

**Long-term solution:**
- Deploy Langflow lên cloud thay vì ngrok
- Hoặc upgrade ngrok Pro

### Lỗi 5: Cold Start Chậm

**Triệu chứng:** Request đầu tiên mất 30s+

**Giải pháp:**
- Free tier sleep sau 15 phút
- Upgrade paid plan ($7/month)
- Hoặc dùng cron job ping mỗi 10 phút

---

## 🎯 Next Steps

### 1. Deploy Langflow lên Cloud (Recommended)

Thay vì ngrok (URL thay đổi), deploy Langflow lên:

**Option 1: Langflow Cloud** (Easiest)
- Truy cập: https://www.langflow.org/
- Sign up
- Import flow
- Lấy production URL
- Update env vars

**Option 2: Railway.app**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy Langflow
railway login
railway init
railway add langflow
railway up
```

**Option 3: Render (như backend)**
- Deploy Langflow như một Python service riêng
- Cấu hình giống backend

### 2. Custom Domain

1. Mua domain (Namecheap, GoDaddy, etc.)
2. Render Dashboard → Settings → Custom Domain
3. Add domain và config DNS

### 3. SSL Certificate

Render tự động enable HTTPS cho tất cả services!

---

## 📞 Support

Nếu gặp vấn đề:

1. **Check Logs:**
   ```bash
   # Xem logs local
   python tarot_api_final.py
   
   # Xem logs Render
   Render Dashboard → Logs tab
   ```

2. **Test Health:**
   ```bash
   curl https://YOUR_SERVICE.onrender.com/api/health
   ```

3. **Test API:**
   ```bash
   curl -X POST https://YOUR_SERVICE.onrender.com/api/tarot/reading \
     -H "Content-Type: application/json" \
     -d '{"spread":"three","question":"Test"}'
   ```

---

## 🎉 Hoàn Thành!

Bây giờ bạn có:

✅ Backend Flask chạy trên Render  
✅ Frontend accessible from anywhere  
✅ Langflow connected qua ngrok (hoặc cloud)  
✅ Production-ready với proper error handling  
✅ Secure với environment variables  

**Live URLs:**
- Frontend: `https://tamtam-tarot-web.onrender.com` (hoặc từ backend)
- Backend API: `https://tamtam-tarot-api.onrender.com`
- Health Check: `https://tamtam-tarot-api.onrender.com/api/health`

---

**Made with ✨ by Tamtam Tarot**  
*Version: 1.0 - Render Deployment Guide*

