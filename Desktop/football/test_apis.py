#!/usr/bin/env python3
import asyncio
import aiohttp
import json
from datetime import datetime

# API Configuration
API_FOOTBALL_KEY = "106673c847d2b4a12bdc61d6d25d0304"
API_FOOTBALL_HOST = "v3.football.api-sports.io"

async def test_api_status():
    """Test API-Football status and quota"""
    print("🔍 Testing API-Football Status...")
    
    headers = {
        "X-RapidAPI-Key": API_FOOTBALL_KEY,
        "X-RapidAPI-Host": API_FOOTBALL_HOST
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://{API_FOOTBALL_HOST}/status",
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    account = data['response']['account']
                    subscription = data['response']['subscription']
                    requests = data['response']['requests']
                    
                    print(f"✅ API Status: WORKING")
                    print(f"📧 Account: {account['firstname']} {account['lastname']}")
                    print(f"📋 Plan: {subscription['plan']}")
                    print(f"📊 Requests: {requests['current']}/{requests['limit_day']}")
                    print(f"⏰ Plan expires: {subscription['end']}")
                    return True
                else:
                    print(f"❌ API Status Error: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ API Connection Error: {e}")
        return False

async def test_live_matches():
    """Test live matches endpoint"""
    print("\n🔴 Testing Live Matches...")
    
    headers = {
        "X-RapidAPI-Key": API_FOOTBALL_KEY,
        "X-RapidAPI-Host": API_FOOTBALL_HOST
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://{API_FOOTBALL_HOST}/fixtures",
                headers=headers,
                params={"live": "all"},
                timeout=aiohttp.ClientTimeout(total=15)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    matches = data.get("response", [])
                    print(f"✅ Live Matches: {len(matches)} found")
                    
                    if matches:
                        # Show first 3 live matches
                        for i, match in enumerate(matches[:3]):
                            home = match['teams']['home']['name']
                            away = match['teams']['away']['name']
                            score_home = match['goals']['home'] or 0
                            score_away = match['goals']['away'] or 0
                            status = match['fixture']['status']['short']
                            elapsed = match['fixture']['status']['elapsed'] or 0
                            league = match['league']['name']
                            
                            print(f"   {i+1}. {league}: {home} {score_home}-{score_away} {away} ({status} {elapsed}')")
                    else:
                        print("   No live matches at the moment")
                    return True
                else:
                    print(f"❌ Live Matches Error: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Live Matches Error: {e}")
        return False

async def test_upcoming_matches():
    """Test upcoming matches for today"""
    print("\n📅 Testing Upcoming Matches...")
    
    headers = {
        "X-RapidAPI-Key": API_FOOTBALL_KEY,
        "X-RapidAPI-Host": API_FOOTBALL_HOST
    }
    
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://{API_FOOTBALL_HOST}/fixtures",
                headers=headers,
                params={"date": today, "status": "NS"},
                timeout=aiohttp.ClientTimeout(total=15)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    matches = data.get("response", [])
                    print(f"✅ Upcoming Matches: {len(matches)} found for {today}")
                    
                    if matches:
                        # Show first 3 upcoming matches
                        for i, match in enumerate(matches[:3]):
                            home = match['teams']['home']['name']
                            away = match['teams']['away']['name']
                            league = match['league']['name']
                            match_time = match['fixture']['date']
                            
                            print(f"   {i+1}. {league}: {home} vs {away} at {match_time}")
                    else:
                        print("   No upcoming matches today")
                    return True
                else:
                    print(f"❌ Upcoming Matches Error: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Upcoming Matches Error: {e}")
        return False

async def test_backend_endpoints():
    """Test our backend endpoints"""
    print("\n🖥️  Testing Backend Endpoints...")
    
    try:
        async with aiohttp.ClientSession() as session:
            # Test health endpoint
            try:
                async with session.get("http://localhost:8001/health") as response:
                    if response.status == 200:
                        print("✅ Backend Health: OK")
                    else:
                        print(f"❌ Backend Health Error: {response.status}")
            except:
                print("❌ Backend not running on port 8001")
                return False
            
            # Test live scores endpoint
            try:
                async with session.get("http://localhost:8001/live-scores") as response:
                    if response.status == 200:
                        data = await response.json()
                        live_count = len(data.get("live_matches", []))
                        upcoming_count = len(data.get("upcoming_matches", []))
                        print(f"✅ Live Scores Endpoint: {live_count} live, {upcoming_count} upcoming")
                    else:
                        print(f"❌ Live Scores Error: {response.status}")
            except Exception as e:
                print(f"❌ Live Scores Error: {e}")
            
            # Test leagues endpoint
            try:
                async with session.get("http://localhost:8001/leagues") as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ Leagues Endpoint: {len(data)} leagues available")
                    else:
                        print(f"❌ Leagues Error: {response.status}")
            except Exception as e:
                print(f"❌ Leagues Error: {e}")
                
            return True
    except Exception as e:
        print(f"❌ Backend Test Error: {e}")
        return False

async def main():
    """Run all API tests"""
    print("🚀 API TESTING SUITE")
    print("=" * 50)
    
    # Test API-Football
    api_status = await test_api_status()
    live_status = await test_live_matches()
    upcoming_status = await test_upcoming_matches()
    
    # Test Backend
    backend_status = await test_backend_endpoints()
    
    print("\n📊 TEST RESULTS")
    print("=" * 50)
    print(f"API-Football Status: {'✅ PASS' if api_status else '❌ FAIL'}")
    print(f"Live Matches: {'✅ PASS' if live_status else '❌ FAIL'}")
    print(f"Upcoming Matches: {'✅ PASS' if upcoming_status else '❌ FAIL'}")
    print(f"Backend Endpoints: {'✅ PASS' if backend_status else '❌ FAIL'}")
    
    if all([api_status, live_status, upcoming_status, backend_status]):
        print("\n🎉 ALL TESTS PASSED! Your app is ready to use.")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")

if __name__ == "__main__":
    asyncio.run(main())