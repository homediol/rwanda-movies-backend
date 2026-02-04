from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import aiohttp
import asyncio
from datetime import datetime, timedelta
import os
from typing import List, Dict, Optional
import json

app = FastAPI(title="Live Football Scores API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Configuration
API_FOOTBALL_KEY = "106673c847d2b4a12bdc61d6d25d0304"
API_FOOTBALL_HOST = "v3.football.api-sports.io"

# Cache for live scores (15 seconds)
live_scores_cache = {
    "data": [],
    "timestamp": None,
    "expires_in": 15  # seconds
}

async def fetch_live_scores():
    """Fetch live scores from API-Football"""
    headers = {
        "X-RapidAPI-Key": API_FOOTBALL_KEY,
        "X-RapidAPI-Host": API_FOOTBALL_HOST
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            # Get live matches
            async with session.get(
                f"https://{API_FOOTBALL_HOST}/fixtures",
                headers=headers,
                params={"live": "all"},
                timeout=aiohttp.ClientTimeout(total=15)
            ) as response:
                print(f"API Response Status: {response.status}")
                if response.status == 200:
                    data = await response.json()
                    print(f"API Response: {data}")
                    matches = data.get("response", [])
                    print(f"Found {len(matches)} live matches")
                    return process_live_matches(matches)
                else:
                    print(f"API Error: {response.status}")
                    return []
    except Exception as e:
        print(f"Error fetching live scores: {e}")
        return []

@app.get("/test-api")
async def test_api():
    """Test API connection"""
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
                    return {"status": "success", "data": data}
                else:
                    return {"status": "error", "code": response.status}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def process_live_matches(matches: List[Dict]) -> List[Dict]:
    """Process and clean live match data"""
    processed = []
    
    for match in matches:
        try:
            fixture = match.get("fixture", {})
            teams = match.get("teams", {})
            goals = match.get("goals", {})
            league = match.get("league", {})
            
            processed_match = {
                "id": fixture.get("id"),
                "league": {
                    "name": league.get("name", "Unknown"),
                    "country": league.get("country", ""),
                    "logo": league.get("logo", "")
                },
                "home_team": {
                    "name": teams.get("home", {}).get("name", ""),
                    "logo": teams.get("home", {}).get("logo", "")
                },
                "away_team": {
                    "name": teams.get("away", {}).get("name", ""),
                    "logo": teams.get("away", {}).get("logo", "")
                },
                "score": {
                    "home": goals.get("home"),
                    "away": goals.get("away")
                },
                "status": {
                    "short": fixture.get("status", {}).get("short", ""),
                    "long": fixture.get("status", {}).get("long", ""),
                    "elapsed": fixture.get("status", {}).get("elapsed")
                },
                "timestamp": fixture.get("timestamp"),
                "date": fixture.get("date")
            }
            processed.append(processed_match)
        except Exception as e:
            print(f"Error processing match: {e}")
            continue
    
    return processed

def is_cache_valid() -> bool:
    """Check if cache is still valid"""
    if not live_scores_cache["timestamp"]:
        return False
    
    now = datetime.now()
    cache_time = live_scores_cache["timestamp"]
    return (now - cache_time).seconds < live_scores_cache["expires_in"]

@app.get("/live-scores")
async def get_live_scores():
    """Get live football scores and upcoming matches"""
    
    # Fetch fresh data every time for real data
    live_matches = await fetch_live_scores()
    upcoming_matches = await fetch_upcoming_matches()
    
    return {
        "live_matches": live_matches,
        "upcoming_matches": upcoming_matches,
        "cached": False,
        "timestamp": datetime.now().isoformat()
    }

async def fetch_upcoming_matches():
    """Fetch upcoming matches for today"""
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
                print(f"Upcoming API Response Status: {response.status}")
                if response.status == 200:
                    data = await response.json()
                    matches = data.get("response", [])
                    print(f"Found {len(matches)} upcoming matches")
                    return process_live_matches(matches[:20])  # Limit to 20 upcoming
                else:
                    print(f"Upcoming API Error: {response.status}")
                    return []
    except Exception as e:
        print(f"Error fetching upcoming matches: {e}")
        return []



@app.get("/live-scores/league/{league_id}")
async def get_live_scores_by_league(league_id: int):
    """Get live scores filtered by league"""
    headers = {
        "X-RapidAPI-Key": API_FOOTBALL_KEY,
        "X-RapidAPI-Host": API_FOOTBALL_HOST
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"https://{API_FOOTBALL_HOST}/fixtures",
                headers=headers,
                params={"live": "all", "league": league_id}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    matches = process_live_matches(data.get("response", []))
                    return {"matches": matches}
                else:
                    raise HTTPException(status_code=response.status, detail="API Error")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/leagues")
async def get_popular_leagues():
    """Get popular leagues for filtering"""
    return [
        {"id": 39, "name": "Premier League", "country": "England"},
        {"id": 140, "name": "La Liga", "country": "Spain"},
        {"id": 78, "name": "Bundesliga", "country": "Germany"},
        {"id": 135, "name": "Serie A", "country": "Italy"},
        {"id": 61, "name": "Ligue 1", "country": "France"},
        {"id": 2, "name": "UEFA Champions League", "country": "World"}
    ]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)