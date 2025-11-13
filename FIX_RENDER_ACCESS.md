# 🔧 Fix Render GitHub Access Issue

## ❌ Lỗi: "It looks like we don't have access to your repo"

Render không thể truy cập repo của bạn. Có 2 nguyên nhân:
1. **Repo là Private** và Render chưa được cấp quyền
2. **GitHub App chưa được install/authorize đúng**

---

## ✅ Giải Pháp 1: Cấp quyền cho Render GitHub App (Recommended)

### Bước 1: Kiểm tra Repo Settings

1. Truy cập repo: https://github.com/allecra/webtarot
2. Click **"Settings"** (tab)
3. Sidebar trái → **"Integrations"** → **"Applications"**
4. Kiểm tra xem **"Render"** có trong danh sách không?

### Bước 2: Install/Update Render GitHub App

#### Option A: Từ Render Dashboard

1. Vào Render Dashboard: https://dashboard.render.com
2. Click avatar (góc phải trên) → **"Account Settings"**
3. Sidebar trái → **"GitHub"**
4. Click **"Configure GitHub App"**
5. Trong GitHub page mở ra:
   - Chọn **"Repository access"**
   - Chọn **"All repositories"** HOẶC
   - **"Only select repositories"** → Chọn `webtarot`
6. Click **"Save"**

#### Option B: Từ GitHub

1. Truy cập: https://github.com/settings/installations
2. Tìm **"Render"** trong danh sách
3. Click **"Configure"**
4. Trong **"Repository access"**:
   - Chọn **"All repositories"** (dễ nhất) HOẶC
   - **"Select repositories"** → Add `allecra/webtarot`
5. Click **"Save"**

### Bước 3: Reconnect trên Render

1. Vào Render Dashboard
2. Vào service `tamtam-tarot-api`
3. Tab **"Settings"** → Scroll xuống
4. Click **"Disconnect Source"** (nếu có)
5. Click **"Connect Repository"**
6. Chọn `allecra/webtarot`
7. Click **"Connect"**

### Bước 4: Manual Redeploy

1. Tab **"Manual Deploy"**
2. Click **"Deploy latest commit"**
3. Đợi build...

---

## ✅ Giải Pháp 2: Chuyển Repo sang Public (Dễ nhất)

Nếu bạn OK với việc code public:

### Bước 1: Make Repo Public

1. Truy cập: https://github.com/allecra/webtarot
2. Click **"Settings"**
3. Scroll xuống cuối → **"Danger Zone"**
4. Click **"Change repository visibility"**
5. Chọn **"Make public"**
6. Confirm

### Bước 2: Redeploy trên Render

1. Vào Render service
2. Tab **"Manual Deploy"**
3. Click **"Clear build cache & deploy"**

---

## ✅ Giải Pháp 3: Deploy bằng CLI (Alternative)

Nếu 2 cách trên không được, dùng Render CLI:

### Bước 1: Install Render CLI

```bash
# Windows (PowerShell)
iwr https://render.com/install.ps1 -useb | iex

# Hoặc dùng npm
npm install -g @render/cli
```

### Bước 2: Login

```bash
render login
```

Browser sẽ mở → Login và authorize

### Bước 3: Deploy

```bash
cd C:\Users\allec\Downloads\testflowtarot

# Create service từ CLI
render services create web \
  --name tamtam-tarot-api \
  --region singapore \
  --plan free \
  --buildCommand "./build.sh" \
  --startCommand "python tarot_api_final.py"

# Set environment variables
render env set LANGFLOW_URL="https://a8d0b6f3f22d.ngrok-free.app/api/v1/run/eaa8dfa7-2bfb-4dc1-98fd-b110b2e71994"
render env set LANGFLOW_API_KEY="sk-t-cDOotEqOWn_6fLSg3ufyLK6G8rYxaaDyYtjy4mJgM"
render env set PYTHON_VERSION="3.10.13"

# Deploy
render deploy
```

---

## 🔍 Debug: Kiểm tra quyền truy cập

### Kiểm tra trên GitHub:

```bash
# Test clone repo (để xem có public không)
git clone https://github.com/allecra/webtarot.git test-clone
cd test-clone
```

Nếu lỗi "Repository not found" → Repo là **Private**

### Kiểm tra Render Apps đã install:

1. https://github.com/settings/installations
2. Tìm "Render"
3. Check xem có repo `webtarot` không

---

## 📝 Checklist Fix

- [ ] Kiểm tra repo là Public hay Private
- [ ] Install/Configure Render GitHub App
- [ ] Grant access cho repo `webtarot`
- [ ] Reconnect repository trên Render
- [ ] Push code mới (với render.yaml đã fix):
  ```bash
  git add render.yaml
  git commit -m "Fix Python version for Render"
  git push origin main
  ```
- [ ] Manual Deploy trên Render
- [ ] Check logs để verify

---

## 🎯 Recommended Flow

**CÁCH NHANH NHẤT:**

1. **Make repo Public** (nếu OK)
2. **Push code đã fix:**
   ```bash
   git add render.yaml
   git commit -m "Fix Python version to 3.10.13"
   git push origin main
   ```
3. **Clear cache & Redeploy** trên Render

**HOẶC nếu muốn giữ Private:**

1. **Configure Render GitHub App** (follow Giải pháp 1)
2. **Push code:**
   ```bash
   git add render.yaml
   git commit -m "Fix Python version to 3.10.13"
   git push origin main
   ```
3. **Reconnect & Deploy**

---

## ⚠️ Lưu Ý

### Về Private Repo:

- **Free tier Render:** Hỗ trợ cả public và private repos
- **Yêu cầu:** Phải grant permission cho Render GitHub App

### Về Public Repo:

- **Ưu điểm:** Dễ deploy, không cần config permission
- **Nhược điểm:** Code public (ai cũng xem được)
- **Bảo mật:** Đừng lo! API keys không bị leak vì:
  - File `.env` không commit (có trong `.gitignore`)
  - Secrets được set trong Render Environment Variables
  - Code chỉ có placeholder values

---

## ✅ Xác nhận đã Fix

Sau khi fix, bạn sẽ thấy:

```
==> Checking out commit xxxxx in branch main
==> Cloning from https://github.com/allecra/webtarot
==> Successfully cloned repository
==> Running build command: ./build.sh
...
```

Không còn dòng "we don't have access" nữa!

---

**Bạn chọn giải pháp nào?**

1. ⭐ **Làm repo Public** (nhanh nhất)
2. 🔐 **Giữ Private + Configure GitHub App** (secure)
3. 💻 **Dùng Render CLI** (alternative)

