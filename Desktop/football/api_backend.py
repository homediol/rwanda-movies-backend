from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import aiohttp
import asyncio
from datetime import datetime

app = FastAPI(title='Football Prediction API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Configuration
API_FOOTBALL_KEY = "106673c847d2b4a12bdc61d6d25d0304"
API_FOOTBALL_BASE = "https://v3.football.api-sports.io"

async def fetch_api_football(endpoint: str, params: dict = None):
    """Fetch data from API-Football"""
    headers = {
        "X-RapidAPI-Key": API_FOOTBALL_KEY,
        "X-RapidAPI-Host": "v3.football.api-sports.io"
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_FOOTBALL_BASE}/{endpoint}", headers=headers, params=params) as response:
            if response.status == 200:
                data = await response.json()
                return data.get("response", [])
            return []

@app.get('/')
def root():
    return {'message': 'Football Prediction API - Live Data'}

@app.get('/fixtures/upcoming')
async def get_upcoming_fixtures():
    """Get real upcoming fixtures from API-Football"""
    try:
        # Get fixtures for Premier League (39), La Liga (140), Bundesliga (78)
        all_fixtures = []
        leagues = [39, 140, 78]
        
        print(f"Fetching fixtures for leagues: {leagues}")
        
        for league_id in leagues:
            # Try current season and previous season
            for season in [2024, 2023]:
                fixtures = await fetch_api_football("fixtures", {
                    "league": league_id,
                    "season": season,
                    "last": 5  # Last 5 matches instead of next
                })
                
                print(f"League {league_id}, Season {season}: Found {len(fixtures)} fixtures")
                if fixtures:  # If we found fixtures, use them
                    for fixture in fixtures:
                        all_fixtures.append({
                            "id": fixture["fixture"]["id"],
                            "home_team": {
                                "id": fixture["teams"]["home"]["id"],
                                "name": fixture["teams"]["home"]["name"],
                                "country": fixture["league"]["country"],
                                "logo_url": fixture["teams"]["home"]["logo"]
                            },
                            "away_team": {
                                "id": fixture["teams"]["away"]["id"], 
                                "name": fixture["teams"]["away"]["name"],
                                "country": fixture["league"]["country"],
                                "logo_url": fixture["teams"]["away"]["logo"]
                            },
                            "match_date": fixture["fixture"]["date"],
                            "status": fixture["fixture"]["status"]["short"],
                            "home_goals": fixture["goals"]["home"],
                            "away_goals": fixture["goals"]["away"]
                        })
                    break  # Found data, no need to try other seasons
        
        return all_fixtures[:10]  # Return first 10 matches
        
    except Exception as e:
        print(f"Error fetching fixtures: {e}")
        return []

@app.get('/fixtures/{fixture_id}/predict')
async def predict_fixture(fixture_id: int):
    """Generate prediction for a fixture"""
    try:
        # Get fixture details
        fixtures = await fetch_api_football("fixtures", {"id": fixture_id})
        
        if not fixtures:
            return {"error": "Fixture not found"}
        
        fixture = fixtures[0]
        
        # Simple prediction logic (replace with your ML model)
        import random
        home_prob = random.uniform(0.2, 0.6)
        away_prob = random.uniform(0.2, 0.6)
        draw_prob = 1.0 - home_prob - away_prob
        
        return {
            "fixture_id": fixture_id,
            "home_team": fixture["teams"]["home"]["name"],
            "away_team": fixture["teams"]["away"]["name"],
            "home_win_prob": home_prob,
            "draw_prob": draw_prob,
            "away_win_prob": away_prob,
            "expected_home_goals": random.uniform(0.5, 3.0),
            "expected_away_goals": random.uniform(0.5, 3.0),
            "confidence": random.uniform(0.6, 0.9),
            "created_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error generating prediction: {e}")
        return {"error": "Prediction failed"}

@app.get('/teams')
async def get_teams():
    """Get teams from API-Football"""
    try:
        teams = await fetch_api_football("teams", {"league": 39, "season": 2024})
        
        result = []
        for team in teams[:20]:  # First 20 teams
            result.append({
                "id": team["team"]["id"],
                "name": team["team"]["name"],
                "country": team["team"]["country"],
                "logo_url": team["team"]["logo"]
            })
        
        return result
        
    except Exception as e:
        print(f"Error fetching teams: {e}")
        return []

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)