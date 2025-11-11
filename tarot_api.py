"""
🔮 Tarot Card API Server
REST API để lấy thông tin lá bài Tarot từ API thực tế
Source: https://tarot-eu34.onrender.com/cards/
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import random
import requests
import re
import os
from typing import List, Dict, Optional, Tuple
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Cho phép CORS để gọi từ frontend

# API Configuration
TAROT_API_BASE_URL = "https://tarot-eu34.onrender.com"
TAROT_API_ENDPOINT = f"{TAROT_API_BASE_URL}/cards/"

# Cache để lưu dữ liệu cards (fetch một lần khi start)
CARDS_CACHE = None

# ==================== FETCH CARDS FROM API ====================

def fetch_cards_from_api() -> List[Dict]:
    """
    Fetch tất cả cards từ API thực tế
    Returns: List of cards với đầy đủ thông tin (name, description, image)
    """
    global CARDS_CACHE
    
    if CARDS_CACHE is not None:
        return CARDS_CACHE
    
    try:
        print(f"📡 Fetching cards from {TAROT_API_ENDPOINT}...")
        response = requests.get(TAROT_API_ENDPOINT, timeout=10)
        response.raise_for_status()
        
        cards = response.json()
        
        # Xử lý image URL (convert relative path thành full URL nếu cần)
        for card in cards:
            if card.get("image") and card["image"].startswith("/"):
                card["image"] = TAROT_API_BASE_URL + card["image"]
        
        CARDS_CACHE = cards
        print(f"✅ Loaded {len(cards)} cards from API")
        return cards
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching cards from API: {e}")
        print("⚠️  Using empty cache - API endpoints may not work properly")
        CARDS_CACHE = []
        return []

def get_all_cards() -> List[Dict]:
    """Lấy tất cả cards (từ cache hoặc fetch mới)"""
    if CARDS_CACHE is None:
        fetch_cards_from_api()
    return CARDS_CACHE or []

# ==================== HELPER FUNCTIONS ====================

def get_card_by_name(name: str) -> Optional[Dict]:
    """Tìm lá bài theo tên (case-insensitive, partial match)"""
    name_lower = name.lower().strip()
    cards = get_all_cards()
    
    for card in cards:
        card_name_lower = card["name"].lower()
        # Exact match hoặc partial match
        if name_lower == card_name_lower or name_lower in card_name_lower or card_name_lower in name_lower:
            return card.copy()
    
    return None

def get_random_cards(count: int) -> List[Dict]:
    """Lấy N lá bài ngẫu nhiên (không trùng)"""
    cards = get_all_cards()
    
    if not cards:
        return []
    
    if count > len(cards):
        count = len(cards)
    
    selected = random.sample(cards, count)
    return [card.copy() for card in selected]

def format_card_response(card: Dict) -> Dict:
    """Format card data cho response - trả về đầy đủ thông tin từ API"""
    return {
        "name": card.get("name", ""),
        "description": card.get("description", ""),
        "image": card.get("image", "")
    }

# ==================== API ENDPOINTS ====================

@app.route('/', methods=['GET'])
def index():
    """API Info"""
    cards = get_all_cards()
    return jsonify({
        "name": "Tarot Card API",
        "version": "1.0.0",
        "source_api": TAROT_API_ENDPOINT,
        "endpoints": {
            "GET /api/cards/random/3": "Lấy 3 lá bài ngẫu nhiên",
            "GET /api/cards/random/10": "Lấy 10 lá bài ngẫu nhiên",
            "GET /api/cards/random/<count>": "Lấy N lá bài ngẫu nhiên",
            "GET /api/cards/search?name=<card_name>": "Tìm kiếm lá bài theo tên",
            "GET /api/cards/all": "Lấy tất cả lá bài"
        },
        "total_cards": len(cards),
        "cached": CARDS_CACHE is not None
    })

@app.route('/api/cards/all', methods=['GET'])
def get_all_cards_endpoint():
    """Lấy tất cả lá bài từ API"""
    cards = get_all_cards()
    formatted_cards = [format_card_response(card) for card in cards]
    
    return jsonify({
        "success": True,
        "total": len(formatted_cards),
        "cards": formatted_cards
    })

@app.route('/api/cards/random/<int:count>', methods=['GET'])
def get_random_cards_api(count: int):
    """
    Lấy N lá bài ngẫu nhiên
    Example: GET /api/cards/random/3
    """
    cards = get_all_cards()
    
    if not cards:
        return jsonify({
            "success": False,
            "error": "Cards data not available. Please check API connection."
        }), 503
    
    if count < 1:
        return jsonify({
            "success": False,
            "error": "Count must be at least 1"
        }), 400
    
    if count > len(cards):
        return jsonify({
            "success": False,
            "error": f"Count cannot exceed {len(cards)} (total cards)"
        }), 400
    
    selected_cards = get_random_cards(count)
    formatted_cards = [format_card_response(card) for card in selected_cards]
    
    return jsonify({
        "success": True,
        "count": len(formatted_cards),
        "cards": formatted_cards
    })

@app.route('/api/cards/random/3', methods=['GET'])
def get_three_cards():
    """Lấy 3 lá bài ngẫu nhiên (shortcut endpoint)"""
    selected_cards = get_random_cards(3)
    
    if not selected_cards:
        return jsonify({
            "success": False,
            "error": "Cards data not available. Please check API connection."
        }), 503
    
    formatted_cards = [format_card_response(card) for card in selected_cards]
    
    return jsonify({
        "success": True,
        "count": 3,
        "cards": formatted_cards
    })

@app.route('/api/cards/random/10', methods=['GET'])
def get_ten_cards():
    """Lấy 10 lá bài ngẫu nhiên (shortcut endpoint)"""
    selected_cards = get_random_cards(10)
    
    if not selected_cards:
        return jsonify({
            "success": False,
            "error": "Cards data not available. Please check API connection."
        }), 503
    
    formatted_cards = [format_card_response(card) for card in selected_cards]
    
    return jsonify({
        "success": True,
        "count": 10,
        "cards": formatted_cards
    })

@app.route('/api/cards/search', methods=['GET'])
def search_card():
    """
    Tìm kiếm lá bài theo tên
    Example: GET /api/cards/search?name=The Fool
    Example: GET /api/cards/search?name=fool
    Example: GET /api/cards/search?name=ace of wands
    """
    name = request.args.get('name', '').strip()
    
    if not name:
        return jsonify({
            "success": False,
            "error": "Parameter 'name' is required"
        }), 400
    
    cards = get_all_cards()
    if not cards:
        return jsonify({
            "success": False,
            "error": "Cards data not available. Please check API connection."
        }), 503
    
    card = get_card_by_name(name)
    
    if card:
        return jsonify({
            "success": True,
            "card": format_card_response(card)
        })
    else:
        # Gợi ý một số card names
        sample_names = [c["name"] for c in cards[:5]]
        return jsonify({
            "success": False,
            "error": f"Card '{name}' not found",
            "suggestions": sample_names
        }), 404

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

# ==================== LANGFLOW INTEGRATION ====================

def parse_tarot_reading(text: str) -> Tuple[str, List[Dict]]:
    """Parse output từ Langflow để tách text và card images"""
    parts = re.split(r'(?:---|___)\s*(?:Hình ảnh các lá bài|Card Images):', text, flags=re.IGNORECASE)
    
    if len(parts) >= 2:
        clean_text = parts[0].strip()
        images_section = parts[1].strip()
    else:
        clean_text = text
        images_section = text
    
    card_images = []
    
    # Pattern: "* Card Name: URL" hoặc "- Card Name: URL"
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
        
        for i, match in enumerate(url_matches, 1):
            image_url = match.group(1).strip()
            card_images.append({
                'name': f'Card {i}',
                'url': image_url
            })
    
    # Remove URLs khỏi clean_text
    clean_text = re.sub(r'https?://[^\s\n]+\.(?:jpg|jpeg|png|gif|webp)', '', clean_text)
    clean_text = re.sub(
        r'(?:---|___)\s*(?:Hình ảnh các lá bài|Card Images):.*', 
        '', 
        clean_text, 
        flags=re.IGNORECASE | re.DOTALL
    )
    clean_text = re.sub(r'\n{3,}', '\n\n', clean_text.strip())
    
    return clean_text, card_images

@app.route('/api/draw/<spread_type>', methods=['GET'])
def draw_cards(spread_type: str):
    """
    Rút bài Tarot ngẫu nhiên theo spread type
    Example: GET /api/draw/three
    """
    spread_counts = {
        'one': 1, 'three': 3, 'five': 5, 'celtic-cross': 10,
        'past-present-future': 3, 'mind-body-spirit': 3,
        'existing-relationship': 5, 'potential-relationship': 5,
        'making-decision': 6, 'law-of-attraction': 5,
        'release-retain': 2, 'asset-hindrance': 2
    }
    
    spread_positions = {
        'three': ['Quá Khứ', 'Hiện Tại', 'Tương Lai'],
        'five': ['Tình Huống', 'Thách Thức', 'Ý Thức', 'Tiềm Thức', 'Kết Quả'],
        'celtic-cross': [
            'Hiện Tại', 'Thách Thức', 'Quá Khứ Xa', 'Quá Khứ Gần',
            'Kết Quả Tốt Nhất', 'Tương Lai Gần', 'Bản Thân',
            'Môi Trường', 'Hy Vọng & Lo Sợ', 'Kết Quả'
        ],
        'mind-body-spirit': ['Tâm Trí', 'Cơ Thể', 'Tinh Thần'],
        'existing-relationship': ['Bạn', 'Họ', 'Cầu Nối', 'Tiềm Năng Cao Nhất', 'Tiềm Năng Thấp Nhất'],
        'potential-relationship': ['Bạn', 'Tình Yêu Yêu Cầu', 'Thông Điệp Vũ Trụ', 'Hành Động', 'Điều Cần Buông Bỏ'],
        'release-retain': ['Buông Bỏ', 'Giữ Lại'],
        'asset-hindrance': ['Lợi Thế', 'Trở Ngại'],
        'making-decision': ['Lựa Chọn 1', 'Lựa Chọn 2', 'Năng Lượng LC1', 'Năng Lượng LC2', 'Lo Sợ', 'May Mắn'],
        'law-of-attraction': ['Thẻ Đại Diện', 'Năng Lượng Hiện Tại', 'Năng Lượng Cần Có', 'Cách Điều Chỉnh', 'Buông Bỏ Cách Thức']
    }
    
    count = spread_counts.get(spread_type, 3)
    positions = spread_positions.get(spread_type, [f'Vị Trí {i+1}' for i in range(count)])
    
    cards = get_all_cards()
    if not cards:
        return jsonify({"success": False, "error": "Cards not available"}), 503
    
    selected_cards = random.sample(cards, min(count, len(cards)))
    
    result = []
    for i, card in enumerate(selected_cards):
        orientation = random.choice(['upright', 'reversed'])
        position = positions[i] if i < len(positions) else f'Vị Trí {i+1}'
        
        result.append({
            'position': position,
            'card': {
                'name': card['name'],
                'name_short': card['name'].lower().replace(' ', '_'),
                'description': card['description'],
                'orientation': orientation,
                'image': card['image']
            }
        })
    
    return jsonify({
        "success": True,
        "spread": spread_type,
        "data": result
    })

@app.route('/api/langflow/<spread_type>', methods=['POST'])
def langflow_reading(spread_type: str):
    """
    Endpoint proxy để gọi Langflow API
    POST /api/langflow/three
    Body: {"question": "...", "sig": "..."}
    """
    data = request.get_json() or {}
    question = data.get('question', data.get('input_value', ''))
    
    # Lấy Langflow config từ env
    langflow_url = os.getenv('LANGFLOW_URL', 'http://localhost:7860/api/v1/run/YOUR_FLOW_ID')
    langflow_key = os.getenv('LANGFLOW_API_KEY', '')
    
    # Prepare payload
    payload = {
        "input_value": question,
        "output_type": "chat",
        "input_type": "chat",
        "tweaks": {
            "TextInput-xxxxx": {  # Thay bằng ID thực tế
                "input_value": f'{{"spread": "{spread_type}", "question": "{question}"}}'
            }
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": langflow_key
    }
    
    try:
        response = requests.post(langflow_url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        langflow_data = response.json()
        
        # Extract text từ Langflow response
        raw_text = ""
        if langflow_data.get('outputs'):
            for output in langflow_data['outputs']:
                if output.get('outputs'):
                    for nested in output['outputs']:
                        if nested.get('results', {}).get('message', {}).get('text'):
                            raw_text = nested['results']['message']['text']
                            break
        
        if not raw_text:
            raw_text = str(langflow_data)
        
        # Parse để extract cards và text
        clean_text, card_images = parse_tarot_reading(raw_text)
        
        return jsonify({
            "success": True,
            "text": clean_text,
            "cards": card_images,
            "raw": raw_text  # Debug
        })
        
    except requests.exceptions.RequestException as e:
        return jsonify({
            "success": False,
            "error": f"Langflow API error: {str(e)}"
        }), 500

@app.route('/api/config', methods=['GET'])
def get_config():
    """Trả về config cho frontend"""
    return jsonify({
        "langflowUrl": os.getenv('LANGFLOW_URL', ''),
        "tarotApiUrl": "/api"
    })

# ==================== MAIN ====================

if __name__ == '__main__':
    print("🔮 Tarot Card API Server")
    print(f"📡 Source API: {TAROT_API_ENDPOINT}")
    print("\n⏳ Loading cards from API...")
    
    # Pre-load cards khi start server
    cards = fetch_cards_from_api()
    
    print(f"📊 Total cards loaded: {len(cards)}")
    print("\n🚀 Starting server on http://127.0.0.1:5000")
    print("\n📋 Available endpoints:")
    print("   GET /api/cards/random/3")
    print("   GET /api/cards/random/10")
    print("   GET /api/cards/random/<count>")
    print("   GET /api/cards/search?name=<card_name>")
    print("   GET /api/cards/all")
    print("\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)

