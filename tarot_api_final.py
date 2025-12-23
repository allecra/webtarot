"""
🔮 Tarot Card API Server - Final Version
Architecture: Backend-First Approach
- Backend xử lý tất cả business logic
- Langflow chỉ handle AI reasoning
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import random
import requests
import re
import os
from typing import List, Dict, Optional, Tuple
from dotenv import load_dotenv
from functools import lru_cache
import time

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# ==================== CONFIGURATION ====================

TAROT_API_BASE_URL = "https://tarot-eu34.onrender.com"
TAROT_API_ENDPOINT = f"{TAROT_API_BASE_URL}/cards/"
LANGFLOW_URL = os.getenv('LANGFLOW_URL', 'http://localhost:7860/api/v1/run/eaa8dfa7-2bfb-4dc1-98fd-b110b2e71994')
LANGFLOW_API_KEY = os.getenv('LANGFLOW_API_KEY', 'sk-t-cDOotEqOWn_6fLSg3ufyLK6G8rYxaaDyYtjy4mJgM')
PORT = int(os.getenv('PORT', 5000))

# Spread configurations
SPREAD_COUNTS = {
    'one': 1,
    'three': 3,
    'five': 5,
    'celtic-cross': 10,
    'past-present-future': 3,
    'mind-body-spirit': 3,
    'existing-relationship': 5,
    'potential-relationship': 5,
    'making-decision': 6,
    'law-of-attraction': 5,
    'release-retain': 2,
    'asset-hindrance': 2
}

SPREAD_POSITIONS = {
    'three': ['Quá Khứ', 'Hiện Tại', 'Tương Lai'],
    'past-present-future': ['Quá Khứ', 'Hiện Tại', 'Tương Lai'],
    'five': ['Tình Huống', 'Thách Thức', 'Ý Thức', 'Tiềm Thức', 'Kết Quả'],
    'celtic-cross': [
        'Hiện Tại', 'Thách Thức', 'Quá Khứ Xa', 'Quá Khứ Gần',
        'Kết Quả Tốt Nhất', 'Tương Lai Gần', 'Bản Thân',
        'Môi Trường', 'Hy Vọng & Lo Sợ', 'Kết Quả'
    ],
    'mind-body-spirit': ['Tâm Trí', 'Cơ Thể', 'Tinh Thần'],
    'existing-relationship': [
        'Bạn', 'Họ', 'Cầu Nối', 'Tiềm Năng Cao Nhất', 'Tiềm Năng Thấp Nhất'
    ],
    'potential-relationship': [
        'Bạn', 'Tình Yêu Yêu Cầu', 'Thông Điệp Vũ Trụ', 'Hành Động', 'Điều Cần Buông Bỏ'
    ],
    'release-retain': ['Buông Bỏ', 'Giữ Lại'],
    'asset-hindrance': ['Lợi Thế', 'Trở Ngại'],
    'making-decision': [
        'Lựa Chọn 1', 'Lựa Chọn 2', 'Năng Lượng LC1',
        'Năng Lượng LC2', 'Lo Sợ', 'May Mắn'
    ],
    'law-of-attraction': [
        'Thẻ Đại Diện', 'Năng Lượng Hiện Tại', 'Năng Lượng Cần Có',
        'Cách Điều Chỉnh', 'Buông Bỏ Cách Thức'
    ]
}

# ==================== CACHE ====================

@lru_cache(maxsize=1)
def get_all_cards_cached() -> List[Dict]:
    """
    Fetch tất cả cards từ API và cache lại
    Cache sẽ expire khi restart server
    """
    try:
        print(f"📡 Fetching cards from {TAROT_API_ENDPOINT}...")
        response = requests.get(TAROT_API_ENDPOINT, timeout=10)
        response.raise_for_status()
        
        cards = response.json()
        
        # Fix image URLs
        for card in cards:
            if card.get("image") and not card["image"].startswith("http"):
                card["image"] = TAROT_API_BASE_URL + card["image"]
        
        print(f"✅ Cached {len(cards)} cards")
        return cards
        
    except Exception as e:
        print(f"❌ Error fetching cards: {e}")
        return []

# ==================== HELPER FUNCTIONS ====================

def draw_cards_from_api(spread: str) -> List[Dict]:
    """
    Rút bài ngẫu nhiên từ external API
    Returns: List of card objects với position, orientation, image
    """
    count = SPREAD_COUNTS.get(spread, 3)
    positions = SPREAD_POSITIONS.get(spread, [f'Vị Trí {i+1}' for i in range(count)])
    
    # Get cards từ cache
    all_cards = get_all_cards_cached()
    
    if not all_cards:
        raise Exception("Cannot fetch cards from external API")
    
    # Random select
    selected_cards = random.sample(all_cards, min(count, len(all_cards)))
    
    # Format với position và orientation
    result = []
    for i, card in enumerate(selected_cards):
        orientation = random.choice(['upright', 'reversed'])
        
        result.append({
            'position': positions[i] if i < len(positions) else f'Vị Trí {i+1}',
            'name': card['name'],
            'orientation': orientation,
            'orientation_vi': 'Xuôi' if orientation == 'upright' else 'Ngược',
            'description': card['description'],
            'image': card['image']
        })
    
    return result


def format_for_langflow(cards_data: List[Dict], spread: str, question: str = "") -> str:
    """
    Format dữ liệu cards thành prompt cho Langflow Agent
    """
    spread_names = {
        'one': 'Một Lá Bài',
        'three': 'Ba Lá Bài',
        'five': 'Năm Lá Bài',
        'celtic-cross': 'Celtic Cross',
        'past-present-future': 'Quá Khứ / Hiện Tại / Tương Lai',
        'mind-body-spirit': 'Tâm / Thân / Thần',
        'existing-relationship': 'Mối Quan Hệ Hiện Tại',
        'potential-relationship': 'Mối Quan Hệ Tiềm Năng',
        'making-decision': 'Ra Quyết Định',
        'law-of-attraction': 'Luật Hấp Dẫn',
        'release-retain': 'Buông Bỏ & Giữ Lại',
        'asset-hindrance': 'Lợi Thế & Trở Ngại'
    }
    
    prompt = "=== THÔNG TIN BÓI BÀI ===\n\n"
    prompt += f"Kiểu trải bài: {spread_names.get(spread, spread)}\n"
    
    if question:
        prompt += f"Câu hỏi: {question}\n"
    
    prompt += f"\n=== CÁC LÁ BÀI ĐÃ RÚT ({len(cards_data)} lá) ===\n\n"
    
    for i, card in enumerate(cards_data, 1):
        prompt += f"{i}. {card['position']}: {card['name']} ({card['orientation_vi']})\n"
        prompt += f"   Mô tả: {card['description'][:250]}...\n"
        prompt += f"   Ảnh: {card['image']}\n\n"
    
    # Thêm danh sách ảnh ở cuối để Agent dễ copy vào output
    prompt += "\n--- DANH SÁCH ẢNH (copy vào phần cuối output) ---\n"
    for card in cards_data:
        prompt += f"- {card['name']}: {card['image']}\n"
    
    prompt += "\n--- KẾT THÚC INPUT ---"
    
    return prompt


def call_langflow_agent(formatted_input: str) -> str:
    """
    Gọi Langflow Agent để generate AI reading
    """
    if not LANGFLOW_URL or 'YOUR_FLOW_ID' in LANGFLOW_URL:
        raise Exception("LANGFLOW_URL not configured. Please update .env file")
    
    payload = {
        "input_value": formatted_input,
        "output_type": "chat",
        "input_type": "chat"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    if LANGFLOW_API_KEY:
        headers["x-api-key"] = LANGFLOW_API_KEY
    
    print(f"🤖 Calling Langflow API...")
    start_time = time.time()
    
    response = requests.post(LANGFLOW_URL, json=payload, headers=headers, timeout=60)
    response.raise_for_status()
    
    elapsed = time.time() - start_time
    print(f"✅ Langflow responded in {elapsed:.2f}s")
    
    # Extract text từ Langflow response
    data = response.json()
    return extract_text_from_langflow_response(data)


def extract_text_from_langflow_response(data: dict) -> str:
    """Extract text từ Langflow response structure"""
    
    # Try nested outputs structure
    if data.get('outputs'):
        for output in data['outputs']:
            if output.get('outputs'):
                for nested in output['outputs']:
                    if nested.get('results', {}).get('message', {}).get('text'):
                        return nested['results']['message']['text']
                    if nested.get('results', {}).get('message', {}).get('data', {}).get('text'):
                        return nested['results']['message']['data']['text']
            
            if output.get('results', {}).get('message', {}).get('text'):
                return output['results']['message']['text']
    
    # Fallback
    if isinstance(data, dict):
        if data.get('text'):
            return data['text']
        if data.get('output'):
            return data['output']
    
    return str(data)


def parse_tarot_reading(text: str) -> Tuple[str, List[Dict]]:
    """
    Parse AI reading để tách text và extract card images
    Returns: (clean_text, card_images)
    """
    # Tách phần "Hình ảnh các lá bài"
    parts = re.split(
        r'(?:---|___)\s*(?:\*\*)?(?:Hình ảnh các lá bài|Card Images)(?:\*\*)?:',
        text,
        flags=re.IGNORECASE
    )
    
    if len(parts) >= 2:
        clean_text = parts[0].strip()
        images_section = parts[1].strip()
    else:
        clean_text = text
        images_section = text
    
    # Extract card images
    card_images = []
    
    # Pattern: "- Card Name: URL" hoặc "* Card Name: URL"
    pattern = r'[*-]\s*([^:]+):\s*(https?://[^\s\n]+\.(?:jpg|jpeg|png|gif|webp))'
    matches = re.finditer(pattern, images_section, re.IGNORECASE)
    
    for match in matches:
        card_name = match.group(1).strip()
        image_url = match.group(2).strip()
        card_images.append({
            'name': card_name,
            'url': image_url
        })
    
    # Fallback: tìm tất cả URLs
    if not card_images:
        pattern_url = r'(https?://tarot-eu34\.onrender\.com[^\s\n]+\.(?:jpg|jpeg|png|gif|webp))'
        url_matches = re.finditer(pattern_url, text, re.IGNORECASE)
        
        seen_urls = set()
        for match in url_matches:
            image_url = match.group(1).strip()
            if image_url not in seen_urls:
                card_images.append({
                    'name': f'Card {len(card_images) + 1}',
                    'url': image_url
                })
                seen_urls.add(image_url)
    
    # Remove URLs from clean text
    clean_text = re.sub(r'https?://[^\s\n]+\.(?:jpg|jpeg|png|gif|webp)', '', clean_text)
    clean_text = re.sub(
        r'(?:---|___)\s*(?:\*\*)?(?:Hình ảnh các lá bài|Card Images)(?:\*\*)?:.*',
        '',
        clean_text,
        flags=re.IGNORECASE | re.DOTALL
    )
    clean_text = re.sub(r'\n{3,}', '\n\n', clean_text.strip())
    
    return clean_text, card_images


def parse_and_format_result(ai_reading: str, cards_data: List[Dict]) -> Dict:
    """
    Parse AI reading và kết hợp với card data
    Returns: Formatted result for frontend
    """
    # Parse để tách text (bỏ section "Hình ảnh")
    clean_text, _ = parse_tarot_reading(ai_reading)
    
    # LUÔN dùng cards_data (có orientation) thay vì extracted từ AI text
    cards_with_orientation = [
        {
            "name": card['name'], 
            "url": card['image'],
            "orientation": card.get('orientation', 'upright')
        }
        for card in cards_data
    ]
    
    print(f"📋 Formatting {len(cards_with_orientation)} cards with orientation:")
    for i, card in enumerate(cards_with_orientation):
        print(f"   Card {i+1}: {card['name']} - {card['orientation']}")
    
    return {
        "text": clean_text,
        "cards": cards_with_orientation,
        "card_count": len(cards_data),
        "positions": [c['position'] for c in cards_data],
        "raw_reading": ai_reading  # For debugging
    }

# ==================== API ENDPOINTS ====================

@app.route('/api', methods=['GET'])
@app.route('/api/', methods=['GET'])
def api_info():
    """API Info - Moved to /api instead of /"""
    return jsonify({
        "name": "Tarot Reading API",
        "version": "2.0.0",
        "architecture": "Backend-First",
        "endpoints": {
            "POST /api/tarot/reading": "Main endpoint - Full tarot reading with AI",
            "POST /api/tarot/quick": "Quick reading without AI",
            "GET /api/cards": "Get all 78 tarot cards",
            "GET /api/spreads": "Get available spread types",
            "GET /api/health": "Health check"
        },
        "status": "online"
    })


@app.route('/api/tarot/reading', methods=['POST'])
def tarot_reading():
    """
    Main endpoint - Full Tarot Reading với AI
    
    Input:
    {
        "spread": "three",
        "question": "Tình yêu của tôi sẽ như thế nào?"
    }
    
    Output:
    {
        "success": true,
        "text": "AI generated reading...",
        "cards": [{"name": "...", "url": "..."}],
        "card_count": 3,
        "positions": ["Quá Khứ", "Hiện Tại", "Tương Lai"],
        "spread": "three",
        "processing_time": 3.45
    }
    """
    start_time = time.time()
    
    try:
        data = request.get_json() or {}
        spread = data.get('spread', 'three')
        question = data.get('question', '')
        
        print(f"\n{'='*60}")
        print(f"🔮 New Reading Request")
        print(f"   Spread: {spread}")
        print(f"   Question: {question[:50]}..." if question else "   Question: (none)")
        print(f"{'='*60}\n")
        
        # Step 1: Draw cards từ external API
        print("Step 1: Drawing cards...")
        cards_data = draw_cards_from_api(spread)
        print(f"✅ Drew {len(cards_data)} cards")
        
        # Step 2: Format data cho Langflow
        print("Step 2: Formatting for Langflow...")
        langflow_input = format_for_langflow(cards_data, spread, question)
        
        # Step 3: Call Langflow Agent
        print("Step 3: Calling Langflow Agent...")
        ai_reading = call_langflow_agent(langflow_input)
        print(f"✅ Received AI reading ({len(ai_reading)} chars)")
        
        # Step 4: Parse và format result
        print("Step 4: Parsing and formatting result...")
        result = parse_and_format_result(ai_reading, cards_data)
        
        processing_time = time.time() - start_time
        print(f"\n✅ Request completed in {processing_time:.2f}s\n")
        
        return jsonify({
            "success": True,
            "spread": spread,
            "question": question,
            "processing_time": round(processing_time, 2),
            **result
        })
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")
        return jsonify({
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }), 500


@app.route('/api/tarot/quick', methods=['POST'])
def quick_reading():
    """
    Quick reading - Chỉ draw cards, không dùng AI
    Dùng cho testing hoặc khi Langflow down
    """
    try:
        data = request.get_json() or {}
        spread = data.get('spread', 'three')
        
        cards_data = draw_cards_from_api(spread)
        
        return jsonify({
            "success": True,
            "spread": spread,
            "cards": cards_data,
            "card_count": len(cards_data)
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/tarot/zodiac', methods=['POST'])
def zodiac_reading():
    """
    Zodiac Tarot Reading - Bói theo cung hoàng đạo
    
    Input:
    {
        "zodiac": "aries",
        "question": "Tình yêu của tôi sẽ như thế nào?"
    }
    
    Output:
    {
        "success": true,
        "text": "AI generated reading...",
        "cards": [{"name": "...", "url": "..."}],
        "card_count": 3,
        "zodiac": "aries",
        "processing_time": 3.45
    }
    """
    start_time = time.time()
    
    try:
        data = request.get_json() or {}
        zodiac = data.get('zodiac', 'aries')
        question = data.get('question', '')
        
        zodiac_names = {
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
        }
        
        zodiac_name = zodiac_names.get(zodiac, zodiac)
        
        print(f"\n{'='*60}")
        print(f"🌟 New Zodiac Reading Request")
        print(f"   Zodiac: {zodiac_name}")
        print(f"   Question: {question[:50]}..." if question else "   Question: (none)")
        print(f"{'='*60}\n")
        
        # Step 1: Draw 3 cards cho zodiac reading
        print("Step 1: Drawing cards for zodiac reading...")
        cards_data = draw_cards_from_api('three')  # Use 3-card spread for zodiac
        print(f"✅ Drew {len(cards_data)} cards")
        
        # Step 2: Format data cho Langflow với zodiac context
        print("Step 2: Formatting for Langflow...")
        langflow_input = format_zodiac_for_langflow(cards_data, zodiac, zodiac_name, question)
        
        # Step 3: Call Langflow Agent
        print("Step 3: Calling Langflow Agent...")
        ai_reading = call_langflow_agent(langflow_input)
        print(f"✅ Received AI reading ({len(ai_reading)} chars)")
        
        # Step 4: Parse và format result
        print("Step 4: Parsing and formatting result...")
        result = parse_and_format_result(ai_reading, cards_data)
        
        processing_time = time.time() - start_time
        print(f"\n✅ Zodiac reading completed in {processing_time:.2f}s\n")
        
        return jsonify({
            "success": True,
            "zodiac": zodiac,
            "zodiac_name": zodiac_name,
            "question": question,
            "processing_time": round(processing_time, 2),
            **result
        })
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")
        return jsonify({
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }), 500


def format_zodiac_for_langflow(cards_data: List[Dict], zodiac: str, zodiac_name: str, question: str = "") -> str:
    """
    Format dữ liệu cho zodiac reading
    """
    prompt = "=== THÔNG TIN BÓI BÀI THEO CUNG HOÀNG ĐẠO ===\n\n"
    prompt += f"Cung hoàng đạo: {zodiac_name}\n"
    prompt += f"Kiểu trải bài: Ba Lá Bài (Quá Khứ - Hiện Tại - Tương Lai)\n"
    
    if question:
        prompt += f"Câu hỏi: {question}\n"
    
    prompt += f"\n=== CÁC LÁ BÀI ĐÃ RÚT ({len(cards_data)} lá) ===\n\n"
    
    for i, card in enumerate(cards_data, 1):
        prompt += f"{i}. {card['position']}: {card['name']} ({card['orientation_vi']})\n"
        prompt += f"   Mô tả: {card['description'][:250]}...\n"
        prompt += f"   Ảnh: {card['image']}\n\n"
    
    prompt += f"\n--- YÊU CẦU GIẢI BÀI ---\n"
    prompt += f"Hãy giải bài Tarot theo ngữ cảnh cung {zodiac_name}.\n"
    prompt += f"Tập trung vào đặc điểm và năng lượng đặc trưng của cung {zodiac_name}.\n"
    prompt += f"Liên kết ý nghĩa của các lá bài với vận mệnh và xu hướng của cung hoàng đạo này.\n"
    
    # Thêm danh sách ảnh ở cuối
    prompt += "\n--- DANH SÁCH ẢNH (copy vào phần cuối output) ---\n"
    for card in cards_data:
        prompt += f"- {card['name']}: {card['image']}\n"
    
    prompt += "\n--- KẾT THÚC INPUT ---"
    
    return prompt


@app.route('/api/daily/<zodiac>', methods=['GET'])
def daily_horoscope(zodiac):
    """
    Tử Vi Hằng Ngày - Bốc 1 lá tự động
    
    GET /api/daily/aries
    
    Output:
    {
        "success": true,
        "zodiac": "aries",
        "date": "2025-01-15",
        "card": {...},
        "reading": "...",
        "scores": {
            "love": 8,
            "career": 7,
            "money": 6,
            "health": 9
        },
        "lucky_color": "Xanh dương",
        "lucky_number": 7
    }
    """
    start_time = time.time()
    
    try:
        from datetime import date
        today = date.today().strftime("%Y-%m-%d")
        
        zodiac_names = {
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
        }
        
        zodiac_name = zodiac_names.get(zodiac, zodiac)
        
        print(f"\n{'='*60}")
        print(f"⭐ Daily Horoscope Request")
        print(f"   Zodiac: {zodiac_name}")
        print(f"   Date: {today}")
        print(f"{'='*60}\n")
        
        # Step 1: Draw 1 card only
        print("Step 1: Drawing card for daily horoscope...")
        all_cards = get_all_cards_cached()
        
        if not all_cards:
            raise Exception("Cannot fetch cards from external API")
        
        # Random select 1 card
        import random
        card = random.choice(all_cards)
        orientation = random.choice(['upright', 'reversed'])
        
        card_data = {
            'name': card['name'],
            'orientation': orientation,
            'orientation_vi': 'Xuôi' if orientation == 'upright' else 'Ngược',
            'description': card['description'],
            'image': card['image']
        }
        
        print(f"✅ Drew card: {card_data['name']} ({card_data['orientation_vi']})")
        
        # Step 2: Generate lucky numbers and colors (based on card)
        colors = ['Đỏ', 'Xanh dương', 'Vàng', 'Tím', 'Xanh lá', 'Hồng', 'Cam', 'Trắng']
        lucky_color = random.choice(colors)
        lucky_number = random.randint(1, 9)
        
        # Step 3: Format for Langflow
        print("Step 2: Formatting for Langflow...")
        question = f"Tử vi hôm nay ({today}) cho cung {zodiac_name} thế nào?"
        
        langflow_input = f"""=== TỬ VI HẰNG NGÀY ===

Cung hoàng đạo: {zodiac_name}
Ngày: {today}
Câu hỏi: {question}

Lá bài đại diện hôm nay:
- Tên: {card_data['name']}
- Hướng: {card_data['orientation_vi']}
- Mô tả: {card_data['description'][:200]}...

YÊU CẦU:
Dựa vào lá bài này, hãy viết vận mệnh hôm nay cho cung {zodiac_name}.

Format output:
1. ⭐ Tổng quan (2-3 câu ngắn gọn)
2. 💝 Tình yêu - Điểm: [X]/10
3. 💼 Công việc - Điểm: [X]/10  
4. 💰 Tài chính - Điểm: [X]/10
5. 💪 Sức khỏe - Điểm: [X]/10
6. 💡 Lời khuyên (1-2 câu)

Viết ngắn gọn, tích cực, dễ hiểu (150-200 từ). Bắt buộc cho điểm cụ thể.
"""
        
        # Step 4: Call Langflow
        print("Step 3: Calling Langflow Agent...")
        ai_reading = call_langflow_agent(langflow_input)
        print(f"✅ Received AI reading ({len(ai_reading)} chars)")
        
        # Step 5: Parse scores from AI response
        scores = extract_scores_from_text(ai_reading)
        
        processing_time = time.time() - start_time
        print(f"\n✅ Daily horoscope completed in {processing_time:.2f}s\n")
        
        return jsonify({
            "success": True,
            "zodiac": zodiac,
            "zodiac_name": zodiac_name,
            "date": today,
            "card": card_data,
            "reading": ai_reading,
            "scores": scores,
            "lucky_color": lucky_color,
            "lucky_number": lucky_number,
            "processing_time": round(processing_time, 2)
        })
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")
        return jsonify({
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }), 500


def extract_scores_from_text(text: str) -> dict:
    """
    Extract scores from AI response
    Example: "Tình yêu - Điểm: 8/10" -> love: 8
    """
    import re
    
    scores = {
        "love": 7,
        "career": 7, 
        "money": 7,
        "health": 7
    }
    
    # Patterns to match scores
    patterns = {
        "love": r'(?:Tình yêu|💝).*?(\d+)/10',
        "career": r'(?:Công việc|💼).*?(\d+)/10',
        "money": r'(?:Tài chính|💰).*?(\d+)/10',
        "health": r'(?:Sức khỏe|💪).*?(\d+)/10'
    }
    
    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            scores[key] = int(match.group(1))
    
    return scores


@app.route('/api/cards', methods=['GET'])
def get_all_cards():
    """Lấy tất cả 78 lá bài"""
    try:
        cards = get_all_cards_cached()
        return jsonify({
            "success": True,
            "total": len(cards),
            "data": cards
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/spreads', methods=['GET'])
def get_spreads():
    """Lấy danh sách các spread types available"""
    spreads = []
    for spread_type, count in SPREAD_COUNTS.items():
        spreads.append({
            "type": spread_type,
            "card_count": count,
            "positions": SPREAD_POSITIONS.get(spread_type, [])
        })
    
    return jsonify({
        "success": True,
        "total": len(spreads),
        "spreads": spreads
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    # Check external API
    try:
        cards = get_all_cards_cached()
        tarot_api_status = "online" if cards else "offline"
    except:
        tarot_api_status = "offline"
    
    # Check Langflow
    langflow_configured = LANGFLOW_URL and 'YOUR_FLOW_ID' not in LANGFLOW_URL
    
    return jsonify({
        "status": "healthy",
        "tarot_api": tarot_api_status,
        "langflow_configured": langflow_configured,
        "cached_cards": len(get_all_cards_cached())
    })


@app.route('/api/config', methods=['GET'])
def get_config():
    """Get public config for frontend"""
    return jsonify({
        "langflow_configured": LANGFLOW_URL and 'YOUR_FLOW_ID' not in LANGFLOW_URL,
        "available_spreads": list(SPREAD_COUNTS.keys())
    })


# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500


# ==================== STATIC FILES (FRONTEND) ====================

@app.route('/')
def serve_index():
    """Serve trang chủ"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS, images, etc.)"""
    try:
        # Kiểm tra xem file có tồn tại không
        if os.path.exists(path):
            return send_from_directory('.', path)
        # Nếu không tìm thấy file, return index.html (cho SPA routing)
        return send_from_directory('.', 'index.html')
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"File not found: {path}"
        }), 404


# ==================== MAIN ====================

if __name__ == '__main__':
    print("🔮 Tarot Reading API Server - Final Version")
    print(f"📡 External API: {TAROT_API_ENDPOINT}")
    print(f"🤖 Langflow: {LANGFLOW_URL}")
    print(f"\n⏳ Pre-loading cards...")
    
    # Pre-load cards
    cards = get_all_cards_cached()
    print(f"📊 Loaded {len(cards)} cards into cache")
    
    print(f"\n🚀 Starting server on http://0.0.0.0:{PORT}")
    print(f"\n📋 Main endpoint:")
    print(f"   POST http://localhost:{PORT}/api/tarot/reading")
    print(f"\n💡 Test với:")
    print(f'   curl -X POST http://localhost:{PORT}/api/tarot/reading \\')
    print('        -H "Content-Type: application/json" \\')
    print('        -d \'{"spread":"three","question":"Test"}\'')
    print("\n")
    
    # Production: Không dùng debug mode
    is_production = os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT')
    app.run(host='0.0.0.0', port=PORT, debug=not is_production)

