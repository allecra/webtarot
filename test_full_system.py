"""
Test script cho hệ thống Tarot hoàn chỉnh
Test backend, Langflow, và full flow
"""
import requests
import json
import time

BASE_URL = "http://localhost:5000"

def print_section(title):
    """Pretty print section header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70 + "\n")

def test_health():
    """Test health check"""
    print_section("🏥 TEST HEALTH CHECK")
    
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        data = response.json()
        
        print("✅ Health check successful")
        print(f"   Status: {data.get('status')}")
        print(f"   Tarot API: {data.get('tarot_api')}")
        print(f"   Langflow: {'Configured' if data.get('langflow_configured') else 'Not configured'}")
        print(f"   Cached cards: {data.get('cached_cards')}")
        
        return data.get('status') == 'healthy'
        
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_get_cards():
    """Test getting all cards"""
    print_section("🎴 TEST GET ALL CARDS")
    
    try:
        response = requests.get(f"{BASE_URL}/api/cards", timeout=10)
        data = response.json()
        
        if data.get('success'):
            print(f"✅ Retrieved {data.get('total')} cards")
            if data.get('data'):
                sample = data['data'][0]
                print(f"\n   Sample card:")
                print(f"   - Name: {sample.get('name')}")
                print(f"   - Image: {sample.get('image')}")
            return True
        else:
            print(f"❌ Failed: {data.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_get_spreads():
    """Test getting spread types"""
    print_section("📊 TEST GET SPREADS")
    
    try:
        response = requests.get(f"{BASE_URL}/api/spreads", timeout=5)
        data = response.json()
        
        if data.get('success'):
            print(f"✅ Found {data.get('total')} spread types:")
            for spread in data['spreads'][:5]:
                print(f"   - {spread['type']}: {spread['card_count']} cards")
            return True
        else:
            print(f"❌ Failed: {data.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_quick_reading():
    """Test quick reading (no AI)"""
    print_section("⚡ TEST QUICK READING (No AI)")
    
    try:
        payload = {
            "spread": "three"
        }
        
        print(f"   Sending: {json.dumps(payload)}")
        start = time.time()
        
        response = requests.post(
            f"{BASE_URL}/api/tarot/quick",
            json=payload,
            timeout=10
        )
        
        elapsed = time.time() - start
        data = response.json()
        
        if data.get('success'):
            print(f"✅ Quick reading successful ({elapsed:.2f}s)")
            print(f"   Spread: {data.get('spread')}")
            print(f"   Cards drawn: {data.get('card_count')}")
            
            if data.get('cards'):
                print("\n   Cards:")
                for card in data['cards'][:3]:
                    print(f"   - {card['position']}: {card['name']} ({card['orientation_vi']})")
            
            return True
        else:
            print(f"❌ Failed: {data.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_full_reading():
    """Test full reading with AI"""
    print_section("🤖 TEST FULL READING (With AI)")
    
    try:
        payload = {
            "spread": "three",
            "question": "Test từ Python - Công việc của tôi sẽ như thế nào?"
        }
        
        print(f"   Sending: {json.dumps(payload, ensure_ascii=False)}")
        print("   ⏳ Waiting for AI response (may take 5-10s)...")
        
        start = time.time()
        
        response = requests.post(
            f"{BASE_URL}/api/tarot/reading",
            json=payload,
            timeout=60
        )
        
        elapsed = time.time() - start
        data = response.json()
        
        if data.get('success'):
            print(f"\n✅ Full reading successful!")
            print(f"   Total time: {data.get('processing_time')}s")
            print(f"   Spread: {data.get('spread')}")
            print(f"   Cards: {data.get('card_count')}")
            print(f"   Text length: {len(data.get('text', ''))}")
            print(f"   Images found: {len(data.get('cards', []))}")
            
            # Print preview
            text_preview = data.get('text', '')[:300]
            print(f"\n   📝 Text preview:")
            print("   " + "-"*60)
            for line in text_preview.split('\n')[:5]:
                print(f"   {line}")
            print("   ...")
            
            # Print cards
            print(f"\n   🎴 Cards:")
            for card in data.get('cards', [])[:3]:
                print(f"   - {card['name']}: {card['url'][:50]}...")
            
            # Check format
            if "Kết luận:" in data.get('text', ''):
                print("\n   ✅ Format check: Contains 'Kết luận'")
            else:
                print("\n   ⚠️  Format warning: Missing 'Kết luận'")
            
            return True
        else:
            print(f"\n❌ Failed: {data.get('error')}")
            print(f"   Error type: {data.get('error_type')}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ Timeout: Request took longer than 60s")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_different_spreads():
    """Test với các spread types khác nhau"""
    print_section("🎯 TEST DIFFERENT SPREADS")
    
    spreads_to_test = ['one', 'five', 'mind-body-spirit']
    results = {}
    
    for spread in spreads_to_test:
        print(f"\n   Testing spread: {spread}")
        
        try:
            payload = {"spread": spread, "question": "Test"}
            response = requests.post(
                f"{BASE_URL}/api/tarot/quick",
                json=payload,
                timeout=10
            )
            
            data = response.json()
            if data.get('success'):
                print(f"   ✅ {spread}: {data.get('card_count')} cards drawn")
                results[spread] = True
            else:
                print(f"   ❌ {spread}: {data.get('error')}")
                results[spread] = False
                
        except Exception as e:
            print(f"   ❌ {spread}: {e}")
            results[spread] = False
    
    success_count = sum(results.values())
    print(f"\n   Results: {success_count}/{len(spreads_to_test)} spreads working")
    
    return success_count == len(spreads_to_test)

def run_all_tests():
    """Chạy tất cả tests"""
    print("\n" + "🧪 TAROT API TESTING SUITE".center(70))
    print("Backend-First Architecture Test".center(70))
    
    tests = [
        ("Health Check", test_health),
        ("Get All Cards", test_get_cards),
        ("Get Spreads", test_get_spreads),
        ("Quick Reading", test_quick_reading),
        ("Different Spreads", test_different_spreads),
        ("Full Reading (AI)", test_full_reading),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except KeyboardInterrupt:
            print("\n\n⚠️  Tests interrupted by user")
            break
        except Exception as e:
            print(f"\n❌ Unexpected error in {test_name}: {e}")
            results[test_name] = False
        
        time.sleep(0.5)  # Small delay between tests
    
    # Summary
    print_section("📊 TEST SUMMARY")
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name:30} {status}")
    
    passed = sum(results.values())
    total = len(results)
    percentage = (passed / total * 100) if total > 0 else 0
    
    print(f"\n   Total: {passed}/{total} tests passed ({percentage:.0f}%)")
    
    if passed == total:
        print("\n   🎉 All tests passed! System is ready for production.")
    elif passed >= total * 0.8:
        print("\n   ⚠️  Most tests passed. Check failed tests above.")
    else:
        print("\n   ❌ Many tests failed. Please check configuration:")
        print("      1. Is Flask backend running? (python tarot_api_final.py)")
        print("      2. Is Langflow configured in .env?")
        print("      3. Is external Tarot API accessible?")
    
    return passed == total

if __name__ == "__main__":
    print("\n💡 Make sure Flask backend is running:")
    print("   python tarot_api_final.py\n")
    
    input("Press Enter to start tests...")
    
    success = run_all_tests()
    
    exit(0 if success else 1)

