from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import aiohttp
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/test-api')
async def test_api():
    """Test API-Football connection"""
    headers = {
        "X-RapidAPI-Key": "106673c847d2b4a12bdc61d6d25d0304",
        "X-RapidAPI-Host": "v3.football.api-sports.io"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            # Test API status first
            async with session.get(
                "https://v3.football.api-sports.io/status",
                headers=headers
            ) as response:
                status_data = await response.json()
                print("API Status:", status_data)
                
            # Test fixtures
            async with session.get(
                "https://v3.football.api-sports.io/fixtures",
                headers=headers,
                params={"league": 39, "season": 2023, "last": 5}
            ) as response:
                fixtures_data = await response.json()
                print("Fixtures Response:", fixtures_data)
                return fixtures_data
                
    except Exception as e:
        print("Error:", e)
        return {"error": str(e)}

@app.get('/leagues')
async def get_leagues():
    """Get available leagues"""
    return [
        {"id": 39, "name": "Premier League", "country": "England"},
        {"id": 140, "name": "La Liga", "country": "Spain"},
        {"id": 78, "name": "Bundesliga", "country": "Germany"},
        {"id": 135, "name": "Serie A", "country": "Italy"},
        {"id": 61, "name": "Ligue 1", "country": "France"}
    ]

@app.get('/fixtures/league/{league_id}')
async def get_fixtures_by_league(league_id: int):
    """Get fixtures for specific league"""
    print(f"Fetching fixtures for league {league_id}")
    
    headers = {
        "X-RapidAPI-Key": "106673c847d2b4a12bdc61d6d25d0304",
        "X-RapidAPI-Host": "v3.football.api-sports.io"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            # Try different parameters to get data
            for params in [
                {"league": league_id, "season": 2024, "next": 10},
                {"league": league_id, "season": 2023, "last": 10},
                {"league": league_id, "season": 2024, "from": "2024-01-01", "to": "2024-12-31"}
            ]:
                print(f"Trying params: {params}")
                async with session.get(
                    "https://v3.football.api-sports.io/fixtures",
                    headers=headers,
                    params=params
                ) as response:
                    print(f"Response status: {response.status}")
                    if response.status == 200:
                        data = await response.json()
                        fixtures = data.get("response", [])
                        print(f"Found {len(fixtures)} fixtures")
                        
                        if fixtures:
                            result = []
                            for fixture in fixtures[:10]:
                                result.append({
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
                                    "away_goals": fixture["goals"]["away"],
                                    "league": fixture["league"]["name"],
                                    "venue": fixture["fixture"]["venue"]["name"]
                                })
                            print(f"Returning {len(result)} fixtures")
                            return result
        
        print("No fixtures found, returning sample data")
        # Return sample data based on league
        league_names = {39: "Premier League", 140: "La Liga", 78: "Bundesliga", 135: "Serie A", 61: "Ligue 1"}
        league_name = league_names.get(league_id, "Unknown League")
        
        return [
            {
                "id": league_id * 100 + 1,
                "home_team": {"id": 1, "name": "Team A", "country": "Country", "logo_url": ""},
                "away_team": {"id": 2, "name": "Team B", "country": "Country", "logo_url": ""},
                "match_date": "2024-01-20T15:00:00Z",
                "status": "scheduled",
                "home_goals": None,
                "away_goals": None,
                "league": league_name,
                "venue": "Sample Stadium"
            },
            {
                "id": league_id * 100 + 2,
                "home_team": {"id": 3, "name": "Team C", "country": "Country", "logo_url": ""},
                "away_team": {"id": 4, "name": "Team D", "country": "Country", "logo_url": ""},
                "match_date": "2024-01-21T18:00:00Z",
                "status": "scheduled",
                "home_goals": None,
                "away_goals": None,
                "league": league_name,
                "venue": "Another Stadium"
            }
        ]
        
    except Exception as e:
        print(f"League fixtures error: {e}")
        return []
@app.get('/fixtures/upcoming')
async def get_fixtures():
    """Get fixtures from all leagues (fallback)"""
    return []

@app.get('/fixtures/{fixture_id}/predict')
async def predict_fixture(fixture_id: int):
    """Get real fixture data and generate prediction"""
    headers = {
        "X-RapidAPI-Key": "106673c847d2b4a12bdc61d6d25d0304",
        "X-RapidAPI-Host": "v3.football.api-sports.io"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            # Get specific fixture details
            async with session.get(
                "https://v3.football.api-sports.io/fixtures",
                headers=headers,
                params={"id": fixture_id}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    fixtures = data.get("response", [])
                    
                    if fixtures:
                        fixture = fixtures[0]
                        
                        # Simple prediction logic (replace with ML model)
                        import random
                        home_prob = random.uniform(0.25, 0.55)
                        away_prob = random.uniform(0.25, 0.55)
                        draw_prob = max(0.1, 1.0 - home_prob - away_prob)
                        
                        # Normalize probabilities
                        total = home_prob + draw_prob + away_prob
                        home_prob /= total
                        draw_prob /= total
                        away_prob /= total
                        
                        return {
                            "fixture_id": fixture_id,
                            "home_team": fixture["teams"]["home"]["name"],
                            "away_team": fixture["teams"]["away"]["name"],
                            "home_win_prob": round(home_prob, 3),
                            "draw_prob": round(draw_prob, 3),
                            "away_win_prob": round(away_prob, 3),
                            "expected_home_goals": round(random.uniform(0.5, 3.0), 1),
                            "expected_away_goals": round(random.uniform(0.5, 3.0), 1),
                            "confidence": round(random.uniform(0.6, 0.9), 2),
                            "created_at": "2024-01-20T10:00:00Z"
                        }
        
        # Fallback prediction
        return {
            "fixture_id": fixture_id,
            "home_team": "Team A",
            "away_team": "Team B",
            "home_win_prob": 0.45,
            "draw_prob": 0.25,
            "away_win_prob": 0.30,
            "expected_home_goals": 1.8,
            "expected_away_goals": 1.2,
            "confidence": 0.75,
            "created_at": "2024-01-20T10:00:00Z"
        }
        
    except Exception as e:
        print(f"Prediction Error: {e}")
        return {"error": "Prediction failed"}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8001)