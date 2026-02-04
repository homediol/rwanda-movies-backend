from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
from datetime import datetime

app = FastAPI(title='Football Prediction API - Simple')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample data
SAMPLE_FIXTURES = [
    {
        "id": 1208210,
        "home_team": {"id": 1, "name": "Manchester United", "country": "England", "logo_url": ""},
        "away_team": {"id": 2, "name": "Newcastle", "country": "England", "logo_url": ""},
        "match_date": "2024-02-15T15:00:00",
        "status": "NS",
        "home_goals": None,
        "away_goals": None,
        "league": "Premier League"
    },
    {
        "id": 1208211,
        "home_team": {"id": 3, "name": "Arsenal", "country": "England", "logo_url": ""},
        "away_team": {"id": 4, "name": "Chelsea", "country": "England", "logo_url": ""},
        "match_date": "2024-02-16T17:30:00",
        "status": "NS",
        "home_goals": None,
        "away_goals": None,
        "league": "Premier League"
    },
    {
        "id": 1208212,
        "home_team": {"id": 5, "name": "Liverpool", "country": "England", "logo_url": ""},
        "away_team": {"id": 6, "name": "Tottenham", "country": "England", "logo_url": ""},
        "match_date": "2024-02-17T14:00:00",
        "status": "NS",
        "home_goals": None,
        "away_goals": None,
        "league": "Premier League"
    }
]

@app.get('/leagues')
async def get_leagues():
    return [
        {"id": 39, "name": "Premier League", "country": "England"},
        {"id": 140, "name": "La Liga", "country": "Spain"},
        {"id": 78, "name": "Bundesliga", "country": "Germany"},
        {"id": 135, "name": "Serie A", "country": "Italy"},
        {"id": 61, "name": "Ligue 1", "country": "France"}
    ]

@app.get('/fixtures/league/{league_id}')
async def get_fixtures_by_league(league_id: int):
    return SAMPLE_FIXTURES

@app.get('/fixtures/{fixture_id}/predict')
async def predict_fixture(fixture_id: int):
    fixture = next((f for f in SAMPLE_FIXTURES if f["id"] == fixture_id), None)
    if not fixture:
        return {"error": "Fixture not found"}
    
    home_prob = random.uniform(0.25, 0.55)
    away_prob = random.uniform(0.25, 0.55) 
    draw_prob = max(0.1, 1.0 - home_prob - away_prob)
    
    total = home_prob + draw_prob + away_prob
    home_prob /= total
    draw_prob /= total
    away_prob /= total
    
    return {
        "fixture_id": fixture_id,
        "home_team": fixture["home_team"]["name"],
        "away_team": fixture["away_team"]["name"],
        "home_win_prob": round(home_prob, 3),
        "draw_prob": round(draw_prob, 3),
        "away_win_prob": round(away_prob, 3),
        "expected_home_goals": round(random.uniform(0.5, 3.0), 1),
        "expected_away_goals": round(random.uniform(0.5, 3.0), 1),
        "confidence": round(random.uniform(0.6, 0.9), 2),
        "created_at": datetime.now().isoformat()
    }

@app.get('/fixtures/{fixture_id}/odds')
async def get_fixture_odds(fixture_id: int):
    fixture = next((f for f in SAMPLE_FIXTURES if f["id"] == fixture_id), None)
    if not fixture:
        return []
    
    return [
        {
            "bookmaker": "Bet365",
            "home_odds": round(random.uniform(1.5, 4.0), 2),
            "draw_odds": round(random.uniform(2.8, 4.5), 2),
            "away_odds": round(random.uniform(1.8, 5.0), 2)
        },
        {
            "bookmaker": "William Hill", 
            "home_odds": round(random.uniform(1.5, 4.0), 2),
            "draw_odds": round(random.uniform(2.8, 4.5), 2),
            "away_odds": round(random.uniform(1.8, 5.0), 2)
        },
        {
            "bookmaker": "Paddy Power",
            "home_odds": round(random.uniform(1.5, 4.0), 2),
            "draw_odds": round(random.uniform(2.8, 4.5), 2),
            "away_odds": round(random.uniform(1.8, 5.0), 2)
        }
    ]

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8001)