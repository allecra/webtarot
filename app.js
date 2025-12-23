// Main Application Logic
class TarotApp {
    constructor() {
        this.currentSpread = null;
        this.currentZodiac = null;
        this.currentCategory = 'tarot'; // 'tarot' or 'zodiac'
        // Auto-detect API URL based on environment
        this.apiUrl = this.getApiUrl();
        this.langflowUrl = null; // Will be set from environment or config
        this.langflowKey = null;
        this.currentReading = null;
        this.history = [];
        this.musicEnabled = false;
        this.theme = 'dark';
        this.currentUser = null; // Current logged in user
        
        this.init();
    }

    getApiUrl() {
        // Check if running on localhost
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        // Production: Backend URL (thay bằng URL backend thực tế của bạn)
        // Nếu deploy frontend trên GitHub Pages và backend trên Render:
        return 'https://tarot-eu34.onrender.com/api';
        // Hoặc nếu backend deploy ở nơi khác, sửa URL ở đây:
        // return 'https://YOUR_BACKEND_URL.onrender.com/api';
    }

    init() {
        this.loadConfig();
        this.loadUser();
        this.loadHistory();
        this.loadTheme();
        this.attachEventListeners();
        this.loadCardSuggestions();
        this.updateLoginButton();
    }
    
    loadUser() {
        const savedUser = localStorage.getItem('tarot_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                console.log('User logged in:', this.currentUser.name);
            } catch (e) {
                this.currentUser = null;
            }
        }
    }
    
    updateLoginButton() {
        const btn = document.getElementById('loginBtn');
        const icon = btn.querySelector('.icon');
        
        if (this.currentUser) {
            icon.textContent = '👋';
            btn.title = `Xin chào, ${this.currentUser.name}`;
            btn.style.background = 'var(--accent-primary)';
            btn.style.color = 'white';
        } else {
            icon.textContent = '👤';
            btn.title = 'Đăng nhập';
            btn.style.background = '';
            btn.style.color = '';
        }
    }
    
    loadHistory() {
        const saved = localStorage.getItem('tarot_history');
        if (saved) {
            try {
                this.history = JSON.parse(saved);
            } catch (e) {
                this.history = [];
            }
        }
    }
    
    saveHistory() {
        localStorage.setItem('tarot_history', JSON.stringify(this.history));
    }
    
    loadTheme() {
        const saved = localStorage.getItem('tarot_theme');
        if (saved) {
            this.theme = saved;
            if (this.theme === 'light') {
                document.body.classList.add('light-theme');
                document.querySelector('#themeToggle .icon').textContent = '☀️';
            }
        }
    }
    
    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        document.body.classList.toggle('light-theme');
        
        const icon = document.querySelector('#themeToggle .icon');
        icon.textContent = this.theme === 'light' ? '☀️' : '🌙';
        
        localStorage.setItem('tarot_theme', this.theme);
    }
    
    toggleMusic() {
        const music = document.getElementById('bgMusic');
        const btn = document.getElementById('musicToggle');
        
        this.musicEnabled = !this.musicEnabled;
        
        if (this.musicEnabled) {
            music.play();
            btn.classList.add('active');
        } else {
            music.pause();
            btn.classList.remove('active');
        }
    }

    async loadConfig() {
        // Try to load config from a config endpoint
        try {
            const response = await fetch(`${this.apiUrl}/config`);
            if (response.ok) {
                const config = await response.json();
                this.langflowUrl = config.langflowUrl;
                this.langflowKey = config.langflowKey;
            }
        } catch (e) {
            console.warn('Could not load config, using defaults');
        }
    }

    attachEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const category = e.currentTarget.dataset.category;
                this.switchCategory(category);
                
                // Update active state
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                // Close mobile menu if open
                if (window.innerWidth <= 1024) {
                    const navbarMenu = document.getElementById('navbarMenu');
                    if (navbarMenu) {
                        navbarMenu.classList.remove('mobile-open');
                    }
                }
            });
        });
        
        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const navbarMenu = document.getElementById('navbarMenu');
        
        if (mobileMenuToggle && navbarMenu) {
            mobileMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                navbarMenu.classList.toggle('mobile-open');
            });
        }
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navbarMenu && !navbarMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                navbarMenu.classList.remove('mobile-open');
            }
        });
        
        // Spread groups navigation
        document.querySelectorAll('.group-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const group = e.currentTarget.dataset.group;
                this.switchSpreadGroup(group);
            });
        });
        
        // Spread card selection
        document.querySelectorAll('.spread-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const spread = e.currentTarget.dataset.spread;
                this.selectSpread(spread);
            });
        });
        
        // Zodiac card selection
        document.querySelectorAll('.zodiac-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const zodiac = e.currentTarget.dataset.zodiac;
                this.selectZodiac(zodiac);
            });
        });
        
        // Daily horoscope cards
        document.querySelectorAll('.daily-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const zodiac = e.currentTarget.dataset.dailyZodiac;
                this.showDailyHoroscope(zodiac);
            });
        });

        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showHomePage();
        });

        // Divine button
        document.getElementById('divineBtn').addEventListener('click', () => {
            this.performReading();
        });
        
        // Control buttons
        document.getElementById('musicToggle').addEventListener('click', () => {
            this.toggleMusic();
        });
        
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        document.getElementById('historyToggle').addEventListener('click', () => {
            this.toggleHistory();
        });
        
        document.getElementById('loginBtn').addEventListener('click', () => {
            if (this.currentUser) {
                this.showLogoutConfirm();
            } else {
                this.openAuthModal();
            }
        });
        
        // History sidebar
        document.getElementById('closeHistory').addEventListener('click', () => {
            this.closeHistory();
        });
        
        document.getElementById('clearHistory').addEventListener('click', () => {
            this.clearHistory();
        });
        
        // Share buttons
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.openShareModal();
        });
        
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveCurrentReading();
        });
        
        // Share modal
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.remove('active');
            });
        });
        
        document.querySelectorAll('.share-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const platform = e.currentTarget.dataset.platform;
                this.shareReading(platform);
            });
        });
        
        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            this.copyShareLink();
        });
        
        // Close modal on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Auth forms
        document.getElementById('switchToRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToRegisterForm();
        });
        
        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToLoginForm();
        });
        
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    }
    
    toggleHistory() {
        const sidebar = document.getElementById('historySidebar');
        sidebar.classList.toggle('open');
        this.renderHistory();
    }
    
    closeHistory() {
        document.getElementById('historySidebar').classList.remove('open');
    }
    
    renderHistory() {
        const container = document.getElementById('historyContent');
        
        if (this.history.length === 0) {
            container.innerHTML = `
                <div class="empty-history">
                    <div class="empty-history-icon">📜</div>
                    <p>Chưa có lịch sử bói bài</p>
                    <p style="font-size: 0.9rem;">Các lần bói của bạn sẽ được lưu tại đây</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.history.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-item-header">
                    <div class="history-item-title">${this.escapeHtml(item.spreadTitle)}</div>
                    <div class="history-item-date">${this.formatDate(item.date)}</div>
                </div>
                ${item.question ? `<div class="history-item-question">❓ ${this.escapeHtml(item.question)}</div>` : ''}
                <div class="history-item-preview">${this.escapeHtml(item.preview)}</div>
            </div>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.loadHistoryItem(index);
            });
        });
    }
    
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Vừa xong';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
        
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    clearHistory() {
        if (confirm('Bạn có chắc muốn xóa tất cả lịch sử bói bài?')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
        }
    }
    
    loadHistoryItem(index) {
        const item = this.history[index];
        if (!item) return;
        
        this.currentReading = item.reading;
        this.currentSpread = item.spread;
        
        // Show reading page
        document.getElementById('homePage').classList.remove('active');
        document.getElementById('readingPage').classList.add('active');
        
        // Set title
        document.getElementById('spreadTitle').textContent = item.spreadTitle;
        
        // Set question
        document.getElementById('questionInput').value = item.question || '';
        
        // Display results with stored card data
        this.displayResults(item.reading.text, item.reading.cardData || null);
        
        // Close history sidebar
        this.closeHistory();
    }
    
    saveCurrentReading() {
        // Kiểm tra đăng nhập
        if (!this.currentUser) {
            alert('Bạn cần đăng nhập để lưu lịch sử! 🔒');
            this.openAuthModal();
            return;
        }
        
        if (!this.currentReading) {
            alert('Không có kết quả để lưu');
            return;
        }
        
        const question = document.getElementById('questionInput').value.trim();
        const spreadTitles = {
            'one': '🎴 Một Lá Bài',
            'three': '🔮 Ba Lá Bài',
            'five': '⭐ Năm Lá Bài',
            'celtic-cross': '✝️ Celtic Cross',
            'past-present-future': '⏳ Quá Khứ / Hiện Tại / Tương Lai',
            'mind-body-spirit': '🧘 Tâm / Thân / Thần',
            'existing-relationship': '💑 Mối Quan Hệ Hiện Tại',
            'potential-relationship': '💝 Mối Quan Hệ Tiềm Năng',
            'making-decision': '🤔 Ra Quyết Định',
            'law-of-attraction': '🌟 Luật Hấp Dẫn',
            'release-retain': '🔄 Buông Bỏ & Giữ Lại',
            'asset-hindrance': '⚖️ Lợi Thế & Trở Ngại'
        };
        
        const historyItem = {
            spread: this.currentSpread,
            spreadTitle: spreadTitles[this.currentSpread] || this.currentSpread,
            question: question,
            date: Date.now(),
            reading: this.currentReading,
            preview: this.currentReading.text.substring(0, 100) + '...'
        };
        
        // Add to beginning of history
        this.history.unshift(historyItem);
        
        // Keep only last 50 readings
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this.saveHistory();
        
        // Show feedback
        const btn = document.getElementById('saveBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="icon">✓</span> Đã lưu!';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
    }
    
    openShareModal() {
        if (!this.currentReading) {
            alert('Không có kết quả để chia sẻ');
            return;
        }
        
        document.getElementById('shareModal').classList.add('active');
    }
    
    closeShareModal() {
        document.getElementById('shareModal').classList.remove('active');
    }
    
    shareReading(platform) {
        if (!this.currentReading) return;
        
        const question = document.getElementById('questionInput').value.trim();
        const title = document.getElementById('spreadTitle').textContent;
        const text = `${title}${question ? '\n\nCâu hỏi: ' + question : ''}\n\n${this.currentReading.text.substring(0, 200)}...`;
        const url = window.location.href;
        
        switch (platform) {
            case 'copy':
                this.copyToClipboard(text);
                alert('Đã sao chép nội dung!');
                break;
                
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
                break;
                
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                break;
                
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
                break;
                
            case 'telegram':
                window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
                break;
                
            case 'email':
                window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
                break;
        }
        
        this.closeShareModal();
    }
    
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }
    
    copyShareLink() {
        const link = window.location.href;
        this.copyToClipboard(link);
        
        const btn = document.getElementById('copyLinkBtn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Đã sao chép';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }

    async loadCardSuggestions() {
        try {
            const response = await fetch(`${this.apiUrl}/cards`);
            if (response.ok) {
                const data = await response.json();
                const cards = data.data || data;
                const datalist = document.getElementById('cardSuggestions');
                
                cards.forEach(card => {
                    const option = document.createElement('option');
                    option.value = card.name_short || card.name;
                    option.textContent = card.name;
                    datalist.appendChild(option);
                });
            }
        } catch (e) {
            console.log('Card suggestions not available:', e.message);
        }
    }

    selectSpread(spreadType) {
        this.currentSpread = spreadType;
        
        // Update spread title
        const titles = {
            'one': '🎴 Một Lá Bài',
            'three': '🔮 Ba Lá Bài',
            'five': '⭐ Năm Lá Bài',
            'celtic-cross': '✝️ Celtic Cross',
            'past-present-future': '⏳ Quá Khứ / Hiện Tại / Tương Lai',
            'mind-body-spirit': '🧘 Tâm / Thân / Thần',
            'existing-relationship': '💑 Mối Quan Hệ Hiện Tại',
            'potential-relationship': '💝 Mối Quan Hệ Tiềm Năng',
            'making-decision': '🤔 Ra Quyết Định',
            'law-of-attraction': '🌟 Luật Hấp Dẫn',
            'release-retain': '🔄 Buông Bỏ & Giữ Lại',
            'asset-hindrance': '⚖️ Lợi Thế & Trở Ngại'
        };
        
        document.getElementById('spreadTitle').textContent = titles[spreadType] || spreadType;
        
        // Show/hide significator input for law-of-attraction
        const sigGroup = document.getElementById('sigGroup');
        if (spreadType === 'law-of-attraction') {
            sigGroup.style.display = 'block';
        } else {
            sigGroup.style.display = 'none';
        }
        
        this.showReadingPage();
    }

    showHomePage() {
        document.getElementById('homePage').classList.add('active');
        document.getElementById('readingPage').classList.remove('active');
        
        // Reset form
        document.getElementById('questionInput').value = '';
        document.getElementById('sigInput').value = '';
        document.getElementById('resultsWrapper').style.display = 'none';
    }

    showReadingPage() {
        document.getElementById('homePage').classList.remove('active');
        document.getElementById('readingPage').classList.add('active');
    }

    async performReading() {
        const question = document.getElementById('questionInput').value.trim();
        
        console.log('🔮 Starting reading...');
        console.log('Category:', this.currentCategory);
        console.log('Spread:', this.currentSpread);
        console.log('Zodiac:', this.currentZodiac);
        console.log('Question:', question);
        
        // Show shuffle animation
        document.getElementById('shuffleAnimation').style.display = 'block';
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('resultsWrapper').style.display = 'none';
        
        // Wait for shuffle animation (3 seconds)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Hide shuffle, show loading
        document.getElementById('shuffleAnimation').style.display = 'none';
        document.getElementById('loadingState').style.display = 'block';
        
        try {
            console.log('🚀 Sending request to backend...');
            
            let endpoint, payload;
            
            if (this.currentCategory === 'zodiac' && this.currentZodiac) {
                // Zodiac reading
                endpoint = `${this.apiUrl}/tarot/zodiac`;
                payload = {
                    zodiac: this.currentZodiac,
                    question: question
                };
            } else if (this.currentSpread) {
                // Tarot spread reading
                endpoint = `${this.apiUrl}/tarot/reading`;
                payload = {
                    spread: this.currentSpread,
                    question: question
                };
            } else {
                throw new Error('No spread or zodiac selected');
            }
            
            console.log('Endpoint:', endpoint);
            console.log('Payload:', payload);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📦 Response data:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'Unknown error');
            }
            
            console.log('✅ Data validation passed');
            console.log('Cards:', result.cards);
            console.log('Text length:', result.text?.length);
            
            // Store current reading
            this.currentReading = {
                text: result.text,
                spread: this.currentSpread,
                zodiac: this.currentZodiac,
                category: this.currentCategory,
                question: question,
                timestamp: Date.now(),
                cardData: result.cards  // Cards với URLs từ backend
            };
            
            console.log('💾 Reading stored to currentReading');
            
            // Display results
            console.log('🎨 Calling displayResults...');
            this.displayResults(result.text, result.cards);
            
            console.log(`✅ Reading completed in ${result.processing_time}s`);
            
        } catch (error) {
            console.error('Reading error:', error);
            alert(`Có lỗi xảy ra: ${error.message}\n\nVui lòng thử lại hoặc kiểm tra:\n- Backend đang chạy (port 5000)\n- Langflow đã được cấu hình`);
        } finally {
            document.getElementById('loadingState').style.display = 'none';
        }
    }

    async drawCards(spread) {
        // Call Tarot API to draw cards
        const url = `/api/draw/${spread}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Tarot API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Raw card data:', data);
            
            // Extract card information
            if (data.success && data.data && Array.isArray(data.data)) {
                return data.data.map(item => ({
                    position: item.position,
                    name: item.card.name,
                    imageUrl: item.card.image.replace('./', 'https://tarotbot-astc.onrender.com/'),
                    orientation: item.card.orientation
                }));
            }
            
            return [];
        } catch (error) {
            console.error('Error drawing cards:', error);
            return [];
        }
    }

    async callLangFlow(spread, question, sig) {
        // Build the input for LangFlow
        const input = {
            spread: spread,
            question: question || '',
            sig: sig || null
        };

        // Use proxy endpoint to avoid CORS issues
        const url = `/api/langflow/${encodeURIComponent(spread)}`;

        const payload = {
            output_type: 'text',
            input_type: 'chat',
            input_value: JSON.stringify(input)
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LangFlow API error: ${response.status} - ${errorText}`);
        }

        const responseText = await response.text();
        if (!responseText || responseText.trim() === '') {
            throw new Error('Empty response from LangFlow API');
        }

        const data = JSON.parse(responseText);
        
        // Extract text from LangFlow response
        return this.extractLangFlowOutput(data);
    }

    extractLangFlowOutput(data) {
        // Handle various LangFlow response formats
        if (typeof data === 'string') return data;
        
        // Try nested outputs structure
        if (data.outputs && Array.isArray(data.outputs)) {
            for (const output of data.outputs) {
                if (output.outputs) {
                    for (const nested of output.outputs) {
                        if (nested.results?.message?.data?.text) {
                            return nested.results.message.data.text;
                        }
                        if (nested.results?.message?.text) {
                            return nested.results.message.text;
                        }
                    }
                }
                if (output.results?.message?.data?.text) {
                    return output.results.message.data.text;
                }
                if (output.results?.message?.text) {
                    return output.results.message.text;
                }
            }
        }
        
        if (data.text) return data.text;
        if (data.output) return data.output;
        if (data.result) return data.result;
        if (data.data?.text) return data.data.text;
        
        return JSON.stringify(data);
    }

    displayResults(text, cardData = null) {
        console.log('=== displayResults START ===');
        console.log('Text length:', text ? text.length : 0);
        console.log('Card data:', cardData);
        
        // Display cards với URLs từ backend
        if (cardData && cardData.length > 0) {
            console.log('✅ Using card data from backend, count:', cardData.length);
            this.displayCards(cardData);
        } else {
            console.log('⚠️ No card data provided');
            this.displayCards([]);
        }
        
        // Display text content
        console.log('📝 Displaying reading content...');
        this.displayReadingContent(text);
        
        // Show results wrapper
        console.log('👁️ Showing results wrapper...');
        const resultsWrapper = document.getElementById('resultsWrapper');
        if (resultsWrapper) {
            resultsWrapper.style.display = 'block';
            console.log('✅ Results wrapper displayed');
            
            // Scroll to results
            resultsWrapper.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            console.log('✅ Scrolled to results');
        } else {
            console.error('❌ resultsWrapper element not found!');
        }
        
        console.log('=== displayResults END ===');
    }

    extractImageUrls(text) {
        // Regular expression to match image URLs (http/https)
        const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi;
        const imageUrls = [];
        let cleanText = text;
        
        // Extract all image URLs
        const matches = text.match(urlRegex);
        if (matches) {
            matches.forEach(url => {
                imageUrls.push(url);
            });
            
            // Remove URLs from text
            cleanText = text.replace(urlRegex, '').trim();
        }
        
        // Normalize text: add line breaks before card patterns and conclusion
        cleanText = cleanText
            // Add newline before card patterns (number: card or position: card)
            .replace(/(\d+:\s*[A-Z][^(]+\([^)]+\))/g, '\n$1')
            // Add newline before "Kết luận:"
            .replace(/(Kết luận:)/gi, '\n$1')
            // Add newline before sections with em-dash
            .replace(/([^\n])\s+([A-Z][^—]+—)/g, '$1\n$2')
            // Clean up extra whitespace
            .replace(/\s+/g, ' ')
            .replace(/\s*\n\s*/g, '\n')
            .trim();
        
        console.log('After normalization:', cleanText);
        
        return { cleanText, imageUrls };
    }

    parseReadingText(text) {
        console.log('=== parseReadingText ===');
        console.log('Input text:', text);
        
        const result = {
            title: '',
            cards: [],
            sections: [],
            conclusion: ''
        };

        const lines = text.split('\n');
        console.log('Total lines:', lines.length);
        
        let currentSection = null;
        let inConclusion = false;
        let currentCardIndex = -1;

        // Spread position patterns to recognize structured positions
        const positionPatterns = {
            // Celtic Cross
            'present': 'Hiện Tại',
            'immediate challenge': 'Thách Thức Trước Mắt',
            'crossing': 'Cản Trở',
            'distant past': 'Quá Khứ Xa',
            'recent past': 'Quá Khứ Gần',
            'best outcome': 'Kết Quả Tốt Nhất',
            'conscious': 'Ý Thức',
            'immediate future': 'Tương Lai Gần',
            'subconscious': 'Tiềm Thức',
            'self': 'Bản Thân',
            'attitude': 'Thái Độ',
            'environment': 'Môi Trường',
            'others': 'Người Khác',
            'hopes and fears': 'Hy Vọng & Lo Sợ',
            'outcome': 'Kết Quả',
            
            // Three Card
            'past': 'Quá Khứ',
            'future': 'Tương Lai',
            
            // Five Card
            'situation': 'Tình Huống',
            'challenge': 'Thách Thức',
            
            // Mind Body Spirit
            'mind': 'Tâm Trí',
            'body': 'Cơ Thể',
            'spirit': 'Tinh Thần',
            
            // Relationship Spreads
            'me': 'Bạn',
            'them': 'Họ',
            'the bridge': 'Cầu Nối',
            'highest potential': 'Tiềm Năng Cao Nhất',
            'lowest potential': 'Tiềm Năng Thấp Nhất',
            'what love asks of me': 'Tình Yêu Yêu Cầu Gì',
            'message from the universe': 'Thông Điệp Vũ Trụ',
            'action to take': 'Hành Động',
            'what to release': 'Điều Cần Buông Bỏ',
            
            // Release Retain
            'release': 'Buông Bỏ',
            'retain': 'Giữ Lại',
            
            // Asset Hindrance
            'asset': 'Lợi Thế',
            'hindrance': 'Trở Ngại',
            
            // Advice from Universe
            'what you need to know': 'Điều Bạn Cần Biết',
            'a new perspective': 'Góc Nhìn Mới',
            
            // Law of Attraction
            'significator': 'Thẻ Đại Diện',
            'your current energy': 'Năng Lượng Hiện Tại',
            'the energy you need': 'Năng Lượng Cần Có',
            'how to get into alignment': 'Cách Điều Chỉnh',
            'letting go of the how': 'Buông Bỏ Cách Thức',
            
            // Making Decision
            'option 1': 'Lựa Chọn 1',
            'option 2': 'Lựa Chọn 2',
            'option 1 energy': 'Năng Lượng Lựa Chọn 1',
            'option 2 energy': 'Năng Lượng Lựa Chọn 2',
            'fears': 'Lo Sợ',
            'blessings': 'May Mắn'
        };

        // If only 1 line, try to extract cards using global regex first
        if (lines.length === 1) {
            console.log('Single line detected, using global regex extraction');
            const singleLine = lines[0];
            
            // Extract title first (before any cards)
            const titleMatch = singleLine.match(/^([^—]+?)(?=(?:[A-Z][^:]*:\s*[A-Z][^(]+\()|(?:[A-Z][^(]{3,}?\s*\([^)]+\)\s*—))/);
            if (titleMatch) {
                const titleText = titleMatch[1].trim();
                // Take first 2 sentences or up to 200 chars
                const sentences = titleText.split(/\.\s+/);
                result.title = sentences.slice(0, 2).join('. ').trim();
                if (!result.title.endsWith('.')) result.title += '.';
                console.log('Extracted title:', result.title);
            }
            
            // Pattern 1: With position prefix (Quá khứ: Card Name (Orientation) — Description)
            const cardPattern1 = /([^:.\n]+):\s*([^(]+?)\s*\(([^)]+)\)\s*(?:—|–)\s*([^.]+(?:\.[^.]*?){0,4}\.)/g;
            
            // Pattern 2: Without position (Card Name (Orientation) — Description)
            const cardPattern2 = /\s([A-Z][^(]{3,60}?)\s*\(([^)]+)\)\s*(?:—|–)\s*([^.]+(?:\.[^.]*?){0,4}\.)/g;
            
            let match;
            
            // First try pattern 1 (with position)
            cardPattern1.lastIndex = 0;
            while ((match = cardPattern1.exec(singleLine)) !== null) {
                const position = match[1].trim();
                const name = match[2].trim();
                const orientation = match[3].trim();
                let description = match[4].trim();
                
                console.log('Pattern 1 matched:', { position, name, orientation, description: description.substring(0, 50) });
                
                // Validate it's a card (not a section title)
                const isCard = orientation.toLowerCase().match(/xuôi|ngược|upright|reversed/);
                
                // Exclude invalid positions/names
                const posLower = position.toLowerCase();
                const nameLower = name.toLowerCase();
                const validPosition = !posLower.includes('trải bài') && 
                                     !posLower.includes('kết luận') &&
                                     position.length < 50;
                const validName = !nameLower.includes('kết luận') && 
                                 !nameLower.includes('trải bài') &&
                                 name.length > 2 && name.length < 80;
                
                if (isCard && validPosition && validName) {
                    // Translate position if it's a known pattern
                    let displayPosition = position;
                    if (posLower === 'quá khứ' || posLower === 'past') {
                        displayPosition = '1: Quá Khứ';
                    } else if (posLower === 'hiện tại' || posLower === 'present') {
                        displayPosition = '2: Hiện Tại';
                    } else if (posLower === 'tương lai' || posLower === 'future') {
                        displayPosition = '3: Tương Lai';
                    } else {
                        displayPosition = position;
                    }
                    
                    result.cards.push({
                        position: displayPosition,
                        name: name,
                        orientation: orientation.toLowerCase().includes('ngược') || orientation.toLowerCase().includes('reversed') ? 'reversed' : 'upright',
                        description: description
                    });
                    console.log('Added card (pattern 1):', displayPosition, '-', name);
                }
            }
            
            // If no cards found with pattern 1, try pattern 2 (without position)
            if (result.cards.length === 0) {
                console.log('No cards found with pattern 1, trying pattern 2');
                cardPattern2.lastIndex = 0;
                while ((match = cardPattern2.exec(singleLine)) !== null) {
                    const name = match[1].trim();
                    const orientation = match[2].trim();
                    let description = match[3].trim();
                    
                    console.log('Pattern 2 matched:', { name, orientation, description: description.substring(0, 50) });
                    
                    // Validate it's a card
                    const isCard = orientation.toLowerCase().match(/xuôi|ngược|upright|reversed/);
                    const validName = !name.toLowerCase().includes('kết luận') && 
                                     !name.toLowerCase().includes('trải bài') &&
                                     name.length > 2 && name.length < 80;
                    
                    if (isCard && validName) {
                        result.cards.push({
                            position: this.getCardPosition(result.cards.length),
                            name: name,
                            orientation: orientation.toLowerCase().includes('ngược') || orientation.toLowerCase().includes('reversed') ? 'reversed' : 'upright',
                            description: description
                        });
                        console.log('Added card (pattern 2):', name);
                    }
                }
            }
            
            // Extract conclusion
            const conclusionMatch = singleLine.match(/Kết luận:\s*(.+)/i);
            if (conclusionMatch) {
                result.conclusion = conclusionMatch[1].trim();
                console.log('Extracted conclusion:', result.conclusion.substring(0, 100));
            }
            
            console.log('=== Final parsed result (global regex) ===');
            console.log('Title:', result.title);
            console.log('Cards:', result.cards.length);
            console.log('Sections:', result.sections.length);
            console.log('Conclusion length:', result.conclusion.length);
            
            return result;
        }

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            console.log('Processing line:', trimmed);

            // Skip emoji-only lines or decorative elements
            if (/^[\u{1F300}-\u{1F9FF}]+$/u.test(trimmed)) {
                console.log('  -> Skipped: emoji-only line');
                continue;
            }

            // First non-emoji line is typically the title
            if (!result.title && trimmed.length < 150 && !trimmed.includes('(') && !trimmed.includes('—')) {
                result.title = trimmed;
                console.log('  -> Set as title:', result.title);
                continue;
            }

            // Detect card with position number: "1: Card Name (Orientation) — Description"
            const cardWithNumberMatch = trimmed.match(/^(\d+):\s*(.+?)\s*\(([^)]+)\)(?:\s*[—–]\s*(.+))?/);
            if (cardWithNumberMatch) {
                const posNum = cardWithNumberMatch[1];
                const name = cardWithNumberMatch[2].trim();
                const orientation = cardWithNumberMatch[3].trim();
                const description = cardWithNumberMatch[4] ? cardWithNumberMatch[4].trim() : '';
                
                console.log('  -> Matched numbered card:', { posNum, name, orientation, description });
                
                if (name.length < 50 && !name.toLowerCase().includes('kết luận')) {
                    result.cards.push({
                        position: `Vị Trí ${posNum}`,
                        name: name,
                        orientation: orientation.toLowerCase().includes('ngược') ? 'reversed' : 'upright',
                        description: description
                    });
                    currentCardIndex = result.cards.length - 1;
                    console.log('  -> Added card, currentCardIndex:', currentCardIndex);
                    continue;
                }
            }

            // Detect card with structured position: "Position: Card Name (Orientation) — Description"
            const cardWithPosMatch = trimmed.match(/^([^:]+):\s*(.+?)\s*\(([^)]+)\)(?:\s*[—–]\s*(.+))?/);
            if (cardWithPosMatch) {
                const position = cardWithPosMatch[1].trim();
                const name = cardWithPosMatch[2].trim();
                const orientation = cardWithPosMatch[3].trim();
                const description = cardWithPosMatch[4] ? cardWithPosMatch[4].trim() : '';
                
                console.log('  -> Matched position card:', { position, name, orientation, description });
                
                // Extract position number if present (e.g., "1: RELEASE" -> "1")
                const posNumberMatch = position.match(/^(\d+):\s*(.+)/);
                let displayPosition = position;
                
                if (posNumberMatch) {
                    const num = posNumberMatch[1];
                    const posName = posNumberMatch[2].trim().toLowerCase();
                    const translatedPos = positionPatterns[posName] || posNumberMatch[2].trim();
                    displayPosition = `${num}: ${translatedPos}`;
                    console.log('  -> Translated position:', displayPosition);
                }
                
                // Check if this looks like a card (not conclusion or section)
                // Cards have specific orientation keywords
                const isCard = orientation.toLowerCase().match(/xuôi|ngược|upright|reversed/);
                
                if (isCard && name.length < 80 && !name.toLowerCase().includes('kết luận')) {
                    result.cards.push({
                        position: displayPosition,
                        name: name,
                        orientation: orientation.toLowerCase().includes('ngược') || orientation.toLowerCase().includes('reversed') ? 'reversed' : 'upright',
                        description: description
                    });
                    currentCardIndex = result.cards.length - 1;
                    console.log('  -> Added card, currentCardIndex:', currentCardIndex);
                    continue;
                } else {
                    console.log('  -> Not a card (isCard:', isCard, 'name.length:', name.length, ')');
                }
            }

            // Detect card with description using em dash: "Card Name (Orientation) — Description"
            const cardWithDescMatch = trimmed.match(/^[\u{1F300}-\u{1F9FF}\s]*(.+?)\s*\(([^)]+)\)\s*[—–]\s*(.+)/u);
            if (cardWithDescMatch) {
                const name = cardWithDescMatch[1].trim();
                const orientation = cardWithDescMatch[2].trim();
                const description = cardWithDescMatch[3].trim();
                
                console.log('  -> Matched em-dash card:', { name, orientation, description });
                
                // Check if orientation looks valid
                const isCard = orientation.toLowerCase().match(/xuôi|ngược|upright|reversed/);
                
                // Only add if it looks like a card name (not too long)
                if (isCard && name.length < 80 && !name.toLowerCase().includes('kết luận')) {
                    result.cards.push({
                        position: this.getCardPosition(result.cards.length),
                        name: name,
                        orientation: orientation.toLowerCase().includes('ngược') || orientation.toLowerCase().includes('reversed') ? 'reversed' : 'upright',
                        description: description
                    });
                    currentCardIndex = result.cards.length - 1;
                    console.log('  -> Added card, currentCardIndex:', currentCardIndex);
                    continue;
                } else {
                    console.log('  -> Not a card (isCard:', isCard, 'name.length:', name.length, ')');
                }
            }

            // Detect card lines with emoji prefix: "🔹 Card Name (Orientation)"
            const cardWithEmojiMatch = trimmed.match(/^[\u{1F300}-\u{1F9FF}\s]*(.+?)\s*\(([^)]+)\)/u);
            if (cardWithEmojiMatch) {
                const name = cardWithEmojiMatch[1].trim();
                const orientation = cardWithEmojiMatch[2].trim();
                
                console.log('  -> Matched emoji card:', { name, orientation });
                
                // Check if orientation looks valid
                const isCard = orientation.toLowerCase().match(/xuôi|ngược|upright|reversed/);
                
                // Only add if it looks like a card name (not a section title)
                if (isCard && name.length < 80 && !name.toLowerCase().includes('kết luận')) {
                    result.cards.push({
                        position: this.getCardPosition(result.cards.length),
                        name: name,
                        orientation: orientation.toLowerCase().includes('ngược') || orientation.toLowerCase().includes('reversed') ? 'reversed' : 'upright',
                        description: ''
                    });
                    currentCardIndex = result.cards.length - 1;
                    console.log('  -> Added card, currentCardIndex:', currentCardIndex);
                    continue;
                } else {
                    console.log('  -> Not a card (isCard:', isCard, 'name.length:', name.length, ')');
                }
            }

            // Detect conclusion with emoji or "Kết luận:"
            if (trimmed.toLowerCase().includes('kết luận') || /^[\u{1F300}-\u{1F9FF}]+\s*kết luận/iu.test(trimmed)) {
                inConclusion = true;
                currentSection = null;
                currentCardIndex = -1;
                console.log('  -> Entering conclusion section');
                const match = trimmed.match(/kết luận[:\s]*(.*)/i);
                if (match && match[1]) {
                    result.conclusion += match[1] + '\n';
                }
                continue;
            }

            // If in conclusion, accumulate text
            if (inConclusion) {
                console.log('  -> Adding to conclusion');
                result.conclusion += trimmed + '\n';
                continue;
            }

            // Detect section with em dash (but not card lines)
            if (trimmed.includes('—') && !trimmed.match(/\([^)]+\)/)) {
                const parts = trimmed.split('—');
                if (parts.length >= 2) {
                    currentSection = {
                        title: parts[0].trim(),
                        content: parts.slice(1).join('—').trim()
                    };
                    result.sections.push(currentSection);
                    currentCardIndex = -1;
                }
                continue;
            }

            // Add to current context (section, card description, or skip)
            if (currentSection) {
                console.log('  -> Adding to section:', currentSection.title);
                currentSection.content += ' ' + trimmed;
            } else if (currentCardIndex >= 0 && result.cards[currentCardIndex]) {
                // Add to the current card's description
                console.log('  -> Adding to card description, cardIndex:', currentCardIndex);
                if (result.cards[currentCardIndex].description) {
                    result.cards[currentCardIndex].description += ' ' + trimmed;
                } else {
                    result.cards[currentCardIndex].description = trimmed;
                }
            } else {
                console.log('  -> Line not processed (no context)');
            }
        }

        console.log('=== Final parsed result ===');
        console.log('Title:', result.title);
        console.log('Cards:', result.cards.length);
        console.log('Sections:', result.sections.length);
        console.log('Conclusion length:', result.conclusion.length);

        return result;
    }

    getCardPosition(index) {
        // Map based on current spread type if available
        const spreadPositions = {
            'celtic-cross': [
                '1: Hiện Tại',
                '2: Thách Thức (Cản Trở)',
                '3: Quá Khứ Xa',
                '4: Quá Khứ Gần',
                '5: Kết Quả Tốt Nhất',
                '6: Tương Lai Gần',
                '7: Bản Thân',
                '8: Môi Trường',
                '9: Hy Vọng & Lo Sợ',
                '10: Kết Quả'
            ],
            'three': [
                '1: Quá Khứ',
                '2: Hiện Tại',
                '3: Tương Lai'
            ],
            'past-present-future': [
                '1: Quá Khứ',
                '2: Hiện Tại',
                '3: Tương Lai'
            ],
            'five': [
                '1: Tình Huống',
                '2: Thách Thức',
                '3: Ý Thức',
                '4: Tiềm Thức',
                '5: Kết Quả'
            ],
            'mind-body-spirit': [
                '1: Tâm Trí',
                '2: Cơ Thể',
                '3: Tinh Thần'
            ],
            'existing-relationship': [
                '1: Bạn',
                '2: Họ',
                '3: Cầu Nối',
                '4: Tiềm Năng Cao Nhất',
                '5: Tiềm Năng Thấp Nhất'
            ],
            'potential-relationship': [
                '1: Bạn',
                '2: Tình Yêu Yêu Cầu',
                '3: Thông Điệp Vũ Trụ',
                '4: Hành Động',
                '5: Điều Cần Buông Bỏ'
            ],
            'release-retain': [
                '1: Buông Bỏ',
                '2: Giữ Lại'
            ],
            'asset-hindrance': [
                '1: Lợi Thế',
                '2: Trở Ngại'
            ],
            'advice-universe': [
                '1: Điều Bạn Cần Biết',
                '2: Góc Nhìn Mới',
                '3: Hành Động'
            ],
            'law-of-attraction': [
                '1: Thẻ Đại Diện',
                '2: Năng Lượng Hiện Tại',
                '3: Năng Lượng Cần Có',
                '4: Cách Điều Chỉnh',
                '5: Buông Bỏ Cách Thức'
            ],
            'making-decision': [
                '1: Lựa Chọn 1',
                '2: Lựa Chọn 2',
                '3: Năng Lượng LC1',
                '4: Năng Lượng LC2',
                '5: Lo Sợ',
                '6: May Mắn'
            ]
        };

        // Try to get position from current spread type
        if (this.currentSpread && spreadPositions[this.currentSpread]) {
            const positions = spreadPositions[this.currentSpread];
            if (index < positions.length) {
                return positions[index];
            }
        }

        // Default fallback
        return `Lá Bài ${index + 1}`;
    }

    displayCards(cards) {
        const container = document.getElementById('cardsDisplay');
        container.innerHTML = '';

        if (!cards || cards.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Không có thông tin lá bài</p>';
            return;
        }

        // Display card images
        cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'tarot-card-image-only';
            
            // cardData từ backend format: {name: "...", url: "...", orientation: "upright/reversed"}
            const imageUrl = card.url || card.imageUrl || '';
            const cardName = card.name || `Card ${index + 1}`;
            const orientation = card.orientation || 'upright';
            const isReversed = orientation === 'reversed';
            
            cardEl.innerHTML = `
                <div class="card-image-wrapper ${isReversed ? 'reversed' : ''}">
                    <img 
                        src="${imageUrl}" 
                        alt="${this.escapeHtml(cardName)}" 
                        class="card-image"
                        onerror="this.src='https://via.placeholder.com/250x400/7B68EE/FFFFFF?text=Tarot+Card'"
                    >
                </div>
                <div class="card-name">
                    ${this.escapeHtml(cardName)}
                    ${isReversed ? ' <span class="reversed-indicator">(Ngược)</span>' : ''}
                </div>
            `;
            
            container.appendChild(cardEl);
        });
    }

    getCardImageUrl(cardName) {
        // Try to construct image URL from card name
        // This assumes your API has images at /images/{shortname}.jpg
        // You may need to adjust this based on your actual API structure
        
        // For now, use a placeholder that shows the card name
        // You can replace this with actual image URLs from your API
        return `${this.apiUrl}/images/${encodeURIComponent(cardName.toLowerCase().replace(/\s+/g, '-'))}.jpg`;
    }

    displayReadingContent(text) {
        const container = document.getElementById('resultsContent');
        container.innerHTML = '';
        
        if (!text) {
            container.innerHTML = '<p>Không có nội dung giải nghĩa</p>';
            return;
        }
        
        // Remove "Hình ảnh lá bài" section and everything after it
        let cleanText = text;
        const imagesSectionIndex = cleanText.toLowerCase().indexOf('hình ảnh');
        if (imagesSectionIndex > 0) {
            cleanText = cleanText.substring(0, imagesSectionIndex).trim();
        }
        
        // Create single unified box
        const contentBox = document.createElement('div');
        contentBox.className = 'reading-text-box';
        
        // Format the entire text
        contentBox.innerHTML = this.formatText(cleanText);
        
        container.appendChild(contentBox);
    }
    
    formatText(text) {
        // Convert markdown-like formatting to HTML
        let formatted = this.escapeHtml(text);
        
        // Bold: **text** or __text__ (process first to avoid conflicts)
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');
        
        // Split into paragraphs (double line break)
        const paragraphs = formatted.split('\n\n');
        let result = [];
        
        paragraphs.forEach(para => {
            if (!para.trim()) return;
            
            // Check if paragraph contains list items
            const lines = para.split('\n');
            let inList = false;
            let paraResult = [];
            
            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed.match(/^[\*\-]\s+/)) {
                    if (!inList) {
                        paraResult.push('<ul>');
                        inList = true;
                    }
                    const content = trimmed.replace(/^[\*\-]\s+/, '');
                    paraResult.push(`<li>${content}</li>`);
                } else {
                    if (inList) {
                        paraResult.push('</ul>');
                        inList = false;
                    }
                    if (trimmed) {
                        paraResult.push(line);
                    }
                }
            });
            
            if (inList) {
                paraResult.push('</ul>');
            }
            
            // Join lines in paragraph with <br>
            const paraHtml = paraResult.join('<br>');
            
            // Wrap in paragraph div for better spacing
            result.push(`<div class="text-paragraph">${paraHtml}</div>`);
        });
        
        return result.join('');
    }

    switchCategory(category) {
        this.currentCategory = category;
        
        // Show/hide sections
        const sections = {
            'tarot': 'tarotSection',
            'zodiac': 'zodiacSection',
            'numerology': 'numerologySection',
            'daily': 'dailySection',
            'dream': 'dreamSection',
            'experts': 'expertsSection',
            'chat': 'chatSection'
        };
        
        // Hide all sections
        Object.values(sections).forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) section.style.display = 'none';
        });
        
        // Show selected section
        const targetSection = document.getElementById(sections[category]);
        if (targetSection) {
            targetSection.style.display = 'block';
            
            // Load data for specific sections
            if (category === 'experts') {
                this.loadExperts();
            }
        }
    }
    
    switchSpreadGroup(group) {
        // Update group buttons
        document.querySelectorAll('.group-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.group === group);
        });
        
        // Show/hide spread grids
        document.querySelectorAll('.spread-grid').forEach(grid => {
            grid.style.display = grid.dataset.group === group ? 'grid' : 'none';
        });
    }
    
    selectZodiac(zodiac) {
        this.currentZodiac = zodiac;
        this.currentSpread = null;
        this.currentCategory = 'zodiac';
        
        const zodiacNames = {
            'aries': '♈ Bạch Dương',
            'taurus': '♉ Kim Ngưu',
            'gemini': '♊ Song Tử',
            'cancer': '♋ Cự Giải',
            'leo': '♌ Sư Tử',
            'virgo': '♍ Xử Nữ',
            'libra': '♎ Thiên Bình',
            'scorpio': '♏ Hổ Cáp',
            'sagittarius': '♐ Nhân Mã',
            'capricorn': '♑ Ma Kết',
            'aquarius': '♒ Bảo Bình',
            'pisces': '♓ Song Ngư'
        };
        
        document.getElementById('spreadTitle').textContent = `Vận Mệnh ${zodiacNames[zodiac] || zodiac}`;
        
        // Update question label
        document.querySelector('#questionInput').placeholder = `Bạn muốn hỏi điều gì về cung ${zodiacNames[zodiac]}?`;
        
        this.showReadingPage();
    }
    
    // ==================== AUTH METHODS ====================
    
    openAuthModal() {
        document.getElementById('authModal').classList.add('active');
        this.switchToLoginForm();
    }
    
    switchToRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('authModalTitle').textContent = '📝 Đăng Ký';
    }
    
    switchToLoginForm() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('authModalTitle').textContent = '👤 Đăng Nhập';
    }
    
    handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        // Get registered users from localStorage
        const users = JSON.parse(localStorage.getItem('tarot_users') || '[]');
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = {
                name: user.name,
                email: user.email
            };
            localStorage.setItem('tarot_user', JSON.stringify(this.currentUser));
            this.updateLoginButton();
            document.getElementById('authModal').classList.remove('active');
            alert(`Chào mừng trở lại, ${user.name}! 👋`);
            
            // Clear form
            document.getElementById('loginForm').reset();
        } else {
            alert('Email hoặc mật khẩu không đúng! 😔');
        }
    }
    
    handleRegister() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        if (!name || !email || !password) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Mật khẩu xác nhận không khớp!');
            return;
        }
        
        if (password.length < 6) {
            alert('Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }
        
        // Get existing users
        const users = JSON.parse(localStorage.getItem('tarot_users') || '[]');
        
        // Check if email exists
        if (users.find(u => u.email === email)) {
            alert('Email này đã được đăng ký!');
            return;
        }
        
        // Add new user
        users.push({
            name,
            email,
            password
        });
        
        localStorage.setItem('tarot_users', JSON.stringify(users));
        
        // Auto login
        this.currentUser = { name, email };
        localStorage.setItem('tarot_user', JSON.stringify(this.currentUser));
        this.updateLoginButton();
        document.getElementById('authModal').classList.remove('active');
        alert(`Đăng ký thành công! Chào mừng ${name}! 🎉`);
        
        // Clear form
        document.getElementById('registerForm').reset();
        this.switchToLoginForm();
    }
    
    showLogoutConfirm() {
        if (confirm(`Bạn có muốn đăng xuất không, ${this.currentUser.name}?`)) {
            this.logout();
        }
    }
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('tarot_user');
        this.updateLoginButton();
        alert('Đã đăng xuất thành công! 👋');
    }

    loadExperts() {
        // Placeholder function - will be implemented with MongoDB
        const expertsGrid = document.getElementById('expertsGrid');
        if (!expertsGrid) return;
        
        // Show loading
        expertsGrid.innerHTML = '<p class="loading-text">Đang tải danh sách chuyên gia...</p>';
        
        // TODO: Load from MongoDB
        // For now, show placeholder message
        setTimeout(() => {
            expertsGrid.innerHTML = `
                <div style="text-align: center; padding: 2rem; grid-column: 1/-1;">
                    <p style="font-size: 1.2rem; color: var(--text-secondary);">
                        🚧 Tính năng đang phát triển<br><br>
                        Chuyên gia sẽ có sẵn sau khi kết nối MongoDB
                    </p>
                </div>
            `;
        }, 500);
    }
    
    async showDailyHoroscope(zodiac) {
        const zodiacNames = {
            'aries': 'Bạch Dương ♈',
            'taurus': 'Kim Ngưu ♉',
            'gemini': 'Song Tử ♊',
            'cancer': 'Cự Giải ♋',
            'leo': 'Sư Tử ♌',
            'virgo': 'Xử Nữ ♍',
            'libra': 'Thiên Bình ♎',
            'scorpio': 'Hổ Cáp ♏',
            'sagittarius': 'Nhân Mã ♐',
            'capricorn': 'Ma Kết ♑',
            'aquarius': 'Bảo Bình ♒',
            'pisces': 'Song Ngư ♓'
        };
        
        const modal = document.getElementById('dailyModal');
        const modalTitle = document.getElementById('dailyModalTitle');
        const modalBody = document.getElementById('dailyModalBody');
        
        // Show modal with loading
        modalTitle.textContent = `⭐ Tử Vi Hôm Nay - ${zodiacNames[zodiac]}`;
        modalBody.innerHTML = `
            <div class="loading" style="padding: 3rem;">
                <div class="crystal-ball">
                    <div class="glow"></div>
                    <div class="inner-glow"></div>
                </div>
                <p class="loading-text">Đang xem vận mệnh hôm nay...</p>
            </div>
        `;
        modal.classList.add('active');
        
        try {
            console.log(`🌟 Fetching daily horoscope for ${zodiac}...`);
            
            const response = await fetch(`${this.apiUrl}/daily/${zodiac}`);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📦 Daily horoscope data:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'Unknown error');
            }
            
            // Display result
            this.displayDailyResult(result);
            
        } catch (error) {
            console.error('Daily horoscope error:', error);
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <p style="color: var(--error-color); font-size: 1.2rem;">❌ Có lỗi xảy ra</p>
                    <p style="color: var(--text-secondary); margin-top: 1rem;">${error.message}</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 1rem;">
                        Vui lòng kiểm tra:<br>
                        - Backend đang chạy (port 5000)<br>
                        - Langflow đã được cấu hình
                    </p>
                </div>
            `;
        }
    }
    
    displayDailyResult(data) {
        const modalBody = document.getElementById('dailyModalBody');
        const { card, reading, scores, lucky_color, lucky_number, date, zodiac_name } = data;
        
        const scoreColor = (score) => {
            if (score >= 8) return 'var(--success-color)';
            if (score >= 6) return 'var(--accent-gold)';
            return 'var(--accent-secondary)';
        };
        
        const scoreStars = (score) => {
            const filled = Math.round(score / 2);
            return '⭐'.repeat(filled) + '☆'.repeat(5 - filled);
        };
        
        modalBody.innerHTML = `
            <div class="daily-result">
                <!-- Date & Card -->
                <div class="daily-header">
                    <div class="daily-date">
                        📅 ${new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div class="daily-card-display">
                        <img src="${card.image}" alt="${card.name}" class="daily-card-image ${card.orientation === 'reversed' ? 'reversed' : ''}">
                        <div class="card-info">
                            <h3>${card.name}</h3>
                            <span class="orientation-badge ${card.orientation}">${card.orientation_vi}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Lucky Info -->
                <div class="lucky-info">
                    <div class="lucky-item">
                        <span class="lucky-icon">🎨</span>
                        <div>
                            <div class="lucky-label">Màu may mắn</div>
                            <div class="lucky-value">${lucky_color}</div>
                        </div>
                    </div>
                    <div class="lucky-item">
                        <span class="lucky-icon">🔢</span>
                        <div>
                            <div class="lucky-label">Số may mắn</div>
                            <div class="lucky-value">${lucky_number}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Scores -->
                <div class="daily-scores">
                    <div class="score-item">
                        <div class="score-icon">💝</div>
                        <div class="score-info">
                            <div class="score-label">Tình yêu</div>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${scores.love * 10}%; background: ${scoreColor(scores.love)}"></div>
                            </div>
                            <div class="score-value" style="color: ${scoreColor(scores.love)}">${scores.love}/10 ${scoreStars(scores.love)}</div>
                        </div>
                    </div>
                    
                    <div class="score-item">
                        <div class="score-icon">💼</div>
                        <div class="score-info">
                            <div class="score-label">Công việc</div>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${scores.career * 10}%; background: ${scoreColor(scores.career)}"></div>
                            </div>
                            <div class="score-value" style="color: ${scoreColor(scores.career)}">${scores.career}/10 ${scoreStars(scores.career)}</div>
                        </div>
                    </div>
                    
                    <div class="score-item">
                        <div class="score-icon">💰</div>
                        <div class="score-info">
                            <div class="score-label">Tài chính</div>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${scores.money * 10}%; background: ${scoreColor(scores.money)}"></div>
                            </div>
                            <div class="score-value" style="color: ${scoreColor(scores.money)}">${scores.money}/10 ${scoreStars(scores.money)}</div>
                        </div>
                    </div>
                    
                    <div class="score-item">
                        <div class="score-icon">💪</div>
                        <div class="score-info">
                            <div class="score-label">Sức khỏe</div>
                            <div class="score-bar">
                                <div class="score-fill" style="width: ${scores.health * 10}%; background: ${scoreColor(scores.health)}"></div>
                            </div>
                            <div class="score-value" style="color: ${scoreColor(scores.health)}">${scores.health}/10 ${scoreStars(scores.health)}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Reading Content -->
                <div class="daily-reading">
                    <h3>📖 Chi Tiết Vận Mệnh</h3>
                    <div class="reading-content">${this.formatText(reading)}</div>
                </div>
                
                <!-- Action Buttons -->
                <div class="daily-actions">
                    <button class="action-btn primary" onclick="window.location.reload()">
                        🔄 Xem cung khác
                    </button>
                    <button class="action-btn secondary" onclick="document.getElementById('dailyModal').classList.remove('active')">
                        ✓ Đã hiểu
                    </button>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TarotApp();
});
