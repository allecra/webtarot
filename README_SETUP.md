# 🔮 K Tarot Mystic - Setup Guide

## 📋 Tổng quan hệ thống

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│ Flask Backend│─────▶│  Langflow   │
│  (HTML/JS)  │      │ (tarot_api.py)│      │   Agent     │
└─────────────┘      └──────────────┘      └─────────────┘
                              │                     │
                              ▼                     ▼
                     ┌──────────────┐      ┌──────────────┐
                     │  Tarot API   │      │ Gemini API   │
                     │ (External)   │      │  (Google)    │
                     └──────────────┘      └──────────────┘
```

---

## 🚀 Quick Start (3 bước)

### 1️⃣ Cài đặt Dependencies

```bash
# Cài đặt Python packages
pip install -r requirements.txt

# Cài đặt Langflow
pip install langflow
```

### 2️⃣ Cấu hình Environment

```bash
# Copy file env template
cp env_config.txt .env

# Sửa file .env, điền các key:
# - LANGFLOW_URL
# - LANGFLOW_API_KEY  
# - API_KEY_GEMINI
```

**Cách lấy keys:**
- **Gemini API Key**: https://ai.google.dev/ (free)
- **Langflow API Key**: Settings trong Langflow UI

### 3️⃣ Chạy hệ thống

```bash
# Terminal 1: Chạy Langflow
langflow run

# Terminal 2: Chạy Flask Backend
python tarot_api.py

# Terminal 3: Test hệ thống
python test_langflow_api.py
```

Sau đó mở `index.html` trong browser để test frontend.

---

## 📚 Chi tiết từng bước

### BƯỚC 1: Setup Langflow Flow

**Đọc hướng dẫn chi tiết:** [LANGFLOW_SETUP_GUIDE.md](LANGFLOW_SETUP_GUIDE.md)

**TL;DR:**
1. Chạy `langflow run`
2. Truy cập http://localhost:7860
3. Tạo flow với các components:
   - **Text Input** (nhận JSON input)
   - **Python Code Tool** (rút bài từ API)
   - **Agent** (Gemini) với instructions
   - **Chat Output**

4. Copy API endpoint và key vào `.env`

### BƯỚC 2: Cấu hình Backend

File `tarot_api.py` đã được update với:
- ✅ Endpoint `/api/draw/<spread>` - Rút bài random
- ✅ Endpoint `/api/langflow/<spread>` - Gọi Langflow
- ✅ Parse output để extract card images
- ✅ CORS enabled cho frontend

### BƯỚC 3: Frontend Integration

File `app.js` sử dụng:
```javascript
// Call backend để bói bài
const response = await fetch('/api/langflow/three', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        question: "Câu hỏi của user"
    })
});

const data = await response.json();
// data.text - Nội dung giải nghĩa
// data.cards - Array of {name, url}
```

---

## 🧪 Testing

### Test từng phần:

```bash
# Test 1: Tarot API (external)
curl https://tarot-eu34.onrender.com/cards

# Test 2: Flask backend
curl http://localhost:5000/api/draw/three

# Test 3: Langflow
python test_langflow_api.py

# Test 4: Full system
# Mở index.html, click spread type, thử bói
```

### Expected Results:

✅ **Output mẫu từ Langflow:**
```
[Giải nghĩa chi tiết...]

**Kết luận:**
Ngày hôm nay sẽ tươi sáng...

---

**Hình ảnh các lá bài:**
- The Sun: https://tarot-eu34.onrender.com/tarotdeck/thesun.jpeg
- Eight of Pentacles: https://tarot-eu34.onrender.com/tarotdeck/eightofpentacles.jpeg
- The Star: https://tarot-eu34.onrender.com/tarotdeck/thestar.jpeg
```

✅ **Response từ Backend:**
```json
{
  "success": true,
  "text": "[Clean text without URLs]",
  "cards": [
    {"name": "The Sun", "url": "https://..."},
    {"name": "Eight of Pentacles", "url": "https://..."}
  ]
}
```

---

## 🔧 Troubleshooting

### Lỗi: "Cannot connect to Langflow"
```bash
# Giải pháp:
1. Kiểm tra Langflow đang chạy: langflow run
2. Check port 7860: netstat -an | grep 7860
3. Thử restart: Ctrl+C, sau đó langflow run lại
```

### Lỗi: "Invalid API Key"
```bash
# Giải pháp:
1. Kiểm tra .env có đúng format không
2. Gemini key còn hạn: https://ai.google.dev/
3. Langflow key: Settings → Create new key
```

### Output không có ảnh
```bash
# Giải pháp:
1. Kiểm tra Agent Instructions trong Langflow
2. Đảm bảo có format "--- Hình ảnh các lá bài:"
3. Tool phải return URLs đầy đủ
```

### CORS Error trên Frontend
```bash
# Giải pháp:
1. Backend đã có flask-cors
2. Chạy frontend qua HTTP server:
   python -m http.server 8000
3. Truy cập: http://localhost:8000
```

---

## 📁 Cấu trúc Files

```
testflowtarot/
├── index.html                    # Frontend UI
├── app.js                        # Frontend logic
├── styles.css                    # Styling
├── particles.js                  # Background effects
│
├── tarot_api.py                  # ✨ Backend API (UPDATED)
├── requirements.txt              # Python dependencies
│
├── langflow_tool_draw_cards.py   # ✨ Tool code cho Langflow
├── parse_langflow_output.py      # ✨ Parser helper
├── test_langflow_api.py          # ✨ Testing script
│
├── LANGFLOW_SETUP_GUIDE.md       # ✨ Chi tiết setup Langflow
├── README_SETUP.md               # ✨ File này
├── env_config.txt                # ✨ Template .env
└── .env                          # Config (tự tạo)
```

---

## 🎯 Checklist Hoàn thành

### Backend ✅
- [x] Update tarot_api.py với endpoints mới
- [x] Add parser cho Langflow output
- [x] Add CORS support
- [x] Add error handling

### Langflow Setup ✅
- [x] Hướng dẫn setup flow
- [x] Agent instructions template
- [x] Tool code (draw cards)
- [x] Test script

### Frontend ✅
- [x] app.js đã có sẵn integration
- [x] Parse cards để hiển thị ảnh
- [x] UI components đầy đủ

### Documentation ✅
- [x] Setup guide chi tiết
- [x] Troubleshooting
- [x] Testing guide
- [x] Code examples

---

## 🚢 Deployment (Optional)

### Deploy Backend (Flask):
```bash
# Option 1: Render.com
# - Connect GitHub repo
# - Build command: pip install -r requirements.txt
# - Start command: python tarot_api.py

# Option 2: Heroku
heroku create
git push heroku main
```

### Deploy Langflow:
```bash
# Option 1: Langflow Cloud (recommended)
# - Sign up: https://www.langflow.org/
# - Import flow JSON
# - Get production URL

# Option 2: Docker
docker build -t tarot-langflow .
docker run -p 7860:7860 tarot-langflow
```

### Deploy Frontend:
```bash
# Option 1: Vercel
vercel deploy

# Option 2: Netlify
netlify deploy

# Option 3: GitHub Pages
# Push to gh-pages branch
```

---

## 📞 Support

Nếu gặp vấn đề:
1. Chạy `python test_langflow_api.py` để kiểm tra
2. Check logs của Flask backend
3. Check Langflow logs: `~/.langflow/logs/`
4. Đọc [LANGFLOW_SETUP_GUIDE.md](LANGFLOW_SETUP_GUIDE.md)

---

## 🎉 Next Steps

Sau khi hệ thống chạy được:
1. ✨ Thêm các spread types khác
2. 🎨 Cải thiện UI/UX
3. 💾 Lưu history vào database
4. 🔐 Thêm user authentication
5. 📱 Làm PWA (Progressive Web App)

---

Made with ✨ by K Tarot Mystic

**Version:** 1.0.0  
**Last Updated:** 2025-01-11

