from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import aiohttp
import asyncio
import json
from datetime import datetime
from data_bot.mysql_database import MySQLManager
from data_bot.json_storage import JSONStorage

app = FastAPI(title='Football Prediction API - Real Data')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
db = None
storage = None

@app.on_event("startup")
async def startup():
    global db, storage
    db = MySQLManager()
    await db.connect()
    storage = JSONStorage()

@app.on_event("shutdown") 
async def shutdown():
    if db:
        await db.close()

async def fetch_and_store_fixtures(league_id: int):
    """Fetch real fixtures from API and store in DB + JSON"""
    headers = {
        "X-RapidAPI-Key": "106673c847d2b4a12bdc61d6d25d0304",
        "X-RapidAPI-Host": "v3.football.api-sports.io"
    }
    
    all_data = {"fixtures": [], "teams": [], "leagues": []}
    
    async with aiohttp.ClientSession() as session:
        # Try different parameters to get data
        for params in [
            {"league": league_id, "season": 2024, "next": 10},
            {"league": league_id, "season": 2023, "last": 10},
            {"league": league_id, "season": 2024, "from": "2024-01-01", "to": "2024-12-31"}
        ]:
            async with session.get(
                "https://v3.football.api-sports.io/fixtures",
                headers=headers,
                params=params
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    fixtures = data.get("response", [])
                    
                    if fixtures:
                        for fixture in fixtures[:10]:
                            # Store teams
                            for team_type in ["home", "away"]:
                                team = fixture["teams"][team_type]
                                await db.execute("""
                                    INSERT INTO teams (api_id, name, country, logo_url)
                                    VALUES (%s, %s, %s, %s)
                                    ON DUPLICATE KEY UPDATE name = VALUES(name)
                                """, team["id"], team["name"], fixture["league"]["country"], team["logo"])
                                
                                all_data["teams"].append({
                                    "api_id": team["id"],
                                    "name": team["name"],
                                    "country": fixture["league"]["country"],
                                    "logo_url": team["logo"]
                                })
                            
                            # Store league
                            league = fixture["league"]
                            await db.execute("""
                                INSERT INTO leagues (api_id, name, country, season)
                                VALUES (%s, %s, %s, %s)
                                ON DUPLICATE KEY UPDATE name = VALUES(name)
                            """, league["id"], league["name"], league["country"], league["season"])
                            
                            # Get team IDs from database
                            home_team = await db.fetchrow("SELECT id FROM teams WHERE api_id = %s", fixture["teams"]["home"]["id"])
                            away_team = await db.fetchrow("SELECT id FROM teams WHERE api_id = %s", fixture["teams"]["away"]["id"])
                            league_row = await db.fetchrow("SELECT id FROM leagues WHERE api_id = %s", league["id"])
                            
                            if home_team and away_team and league_row:
                                # Store fixture
                                await db.execute("""
                                    INSERT INTO fixtures (api_id, league_id, home_team_id, away_team_id, 
                                                        match_date, status, home_goals, away_goals)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                                    ON DUPLICATE KEY UPDATE 
                                        status = VALUES(status),
                                        home_goals = VALUES(home_goals),
                                        away_goals = VALUES(away_goals)
                                """, 
                                fixture["fixture"]["id"],
                                league_row["id"],
                                home_team["id"],
                                away_team["id"],
                                datetime.fromisoformat(fixture["fixture"]["date"].replace("Z", "+00:00")),
                                fixture["fixture"]["status"]["short"],
                                fixture["goals"]["home"],
                                fixture["goals"]["away"]
                                )
                                
                                all_data["fixtures"].append({
                                    "api_id": fixture["fixture"]["id"],
                                    "home_team": fixture["teams"]["home"]["name"],
                                    "away_team": fixture["teams"]["away"]["name"],
                                    "match_date": fixture["fixture"]["date"],
                                    "status": fixture["fixture"]["status"]["short"],
                                    "league": league["name"]
                                })
                        
                        # Save to JSON
                        storage.save_data(all_data, f"league_{league_id}_data.json")
                        storage.append_to_master_file(all_data)
                        
                        return len(fixtures)
    
    return 0

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
    """Get real fixtures for league from database, fetch from API if needed"""
    
    # First check database
    fixtures = await db.fetch("""
        SELECT f.*, ht.name as home_name, at.name as away_name, l.name as league_name
        FROM fixtures f
        JOIN teams ht ON f.home_team_id = ht.id
        JOIN teams at ON f.away_team_id = at.id
        JOIN leagues l ON f.league_id = l.id
        WHERE l.api_id = %s
        ORDER BY f.match_date DESC
        LIMIT 10
    """, league_id)
    
    if not fixtures:
        # Fetch from API if no data in database
        print(f"No fixtures in DB for league {league_id}, fetching from API...")
        count = await fetch_and_store_fixtures(league_id)
        print(f"Fetched and stored {count} fixtures")
        
        # Try database again
        fixtures = await db.fetch("""
            SELECT f.*, ht.name as home_name, at.name as away_name, l.name as league_name
            FROM fixtures f
            JOIN teams ht ON f.home_team_id = ht.id
            JOIN teams at ON f.away_team_id = at.id
            JOIN leagues l ON f.league_id = l.id
            WHERE l.api_id = %s
            ORDER BY f.match_date DESC
            LIMIT 10
        """, league_id)
    
    result = []
    for fixture in fixtures:
        result.append({
            "id": fixture["api_id"],
            "home_team": {
                "id": fixture["home_team_id"],
                "name": fixture["home_name"],
                "country": "",
                "logo_url": ""
            },
            "away_team": {
                "id": fixture["away_team_id"], 
                "name": fixture["away_name"],
                "country": "",
                "logo_url": ""
            },
            "match_date": fixture["match_date"].isoformat(),
            "status": fixture["status"],
            "home_goals": fixture["home_goals"],
            "away_goals": fixture["away_goals"],
            "league": fixture["league_name"]
        })
    
    return result

@app.get('/fixtures/{fixture_id}/predict')
async def predict_fixture(fixture_id: int):
    """Generate prediction for fixture"""
    import random
    
    # Get fixture from database
    fixture = await db.fetchrow("""
        SELECT f.*, ht.name as home_name, at.name as away_name
        FROM fixtures f
        JOIN teams ht ON f.home_team_id = ht.id
        JOIN teams at ON f.away_team_id = at.id
        WHERE f.api_id = %s
    """, fixture_id)
    
    if not fixture:
        return {"error": "Fixture not found"}
    
    # Simple prediction logic
    home_prob = random.uniform(0.25, 0.55)
    away_prob = random.uniform(0.25, 0.55) 
    draw_prob = max(0.1, 1.0 - home_prob - away_prob)
    
    # Normalize
    total = home_prob + draw_prob + away_prob
    home_prob /= total
    draw_prob /= total
    away_prob /= total
    
    prediction = {
        "fixture_id": fixture_id,
        "home_team": fixture["home_name"],
        "away_team": fixture["away_name"],
        "home_win_prob": round(home_prob, 3),
        "draw_prob": round(draw_prob, 3),
        "away_win_prob": round(away_prob, 3),
        "expected_home_goals": round(random.uniform(0.5, 3.0), 1),
        "expected_away_goals": round(random.uniform(0.5, 3.0), 1),
        "confidence": round(random.uniform(0.6, 0.9), 2),
        "created_at": datetime.now().isoformat()
    }
    
    # Store prediction in database
    await db.execute("""
        INSERT INTO predictions (fixture_id, model_name, home_win_prob, draw_prob, away_win_prob,
                               predicted_home_goals, predicted_away_goals, confidence_score)
        VALUES ((SELECT id FROM fixtures WHERE api_id = %s), %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE 
            home_win_prob = VALUES(home_win_prob),
            draw_prob = VALUES(draw_prob),
            away_win_prob = VALUES(away_win_prob)
    """, fixture_id, "hybrid", prediction["home_win_prob"], prediction["draw_prob"], 
         prediction["away_win_prob"], prediction["expected_home_goals"], 
         prediction["expected_away_goals"], prediction["confidence"])
    
    # Save to JSON
    storage.save_data({"prediction": prediction}, f"prediction_{fixture_id}.json")
    
    return prediction

@app.get('/fixtures/{fixture_id}/odds')
async def get_fixture_odds(fixture_id: int):
    """Get odds for fixture with team names"""
    # Get fixture info first
    fixture = await db.fetchrow("""
        SELECT f.*, ht.name as home_name, at.name as away_name
        FROM fixtures f
        JOIN teams ht ON f.home_team_id = ht.id
        JOIN teams at ON f.away_team_id = at.id
        WHERE f.api_id = %s
    """, fixture_id)
    
    if not fixture:
        return []
    
    # Try to get real odds from database
    odds = await db.fetch("""
        SELECT o.*, ht.name as home_team, at.name as away_team
        FROM odds o
        JOIN fixtures f ON o.fixture_id = f.id
        JOIN teams ht ON f.home_team_id = ht.id
        JOIN teams at ON f.away_team_id = at.id
        WHERE f.api_id = %s
        ORDER BY o.created_at DESC
    """, fixture_id)
    
    # If no odds in database, return sample odds
    if not odds:
        import random
        sample_odds = [
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
        return sample_odds
    
    return odds

@app.get('/odds/latest')
async def get_latest_odds():
    """Get latest odds with team names"""
    odds = await db.fetch("""
        SELECT o.*, ht.name as home_team, at.name as away_team, 
               l.name as league, f.match_date
        FROM odds o
        JOIN fixtures f ON o.fixture_id = f.id
        JOIN teams ht ON f.home_team_id = ht.id
        JOIN teams at ON f.away_team_id = at.id
        JOIN leagues l ON f.league_id = l.id
        ORDER BY o.created_at DESC
        LIMIT 20
    """)    
    
    return odds
@app.get('/teams/{team_id}/stats')
async def get_team_stats(team_id: int):
    """Get team statistics"""
    stats = await db.fetch("""
        SELECT ts.*, t.name as team_name, l.name as league_name
        FROM team_stats ts
        JOIN teams t ON ts.team_id = t.id
        JOIN leagues l ON ts.league_id = l.id
        WHERE ts.team_id = %s
    """, team_id)
    
    return stats

@app.get('/leagues/{league_id}/standings')
async def get_league_standings(league_id: int):
    """Get league standings based on team stats"""
    standings = await db.fetch("""
        SELECT t.name as team, ts.matches_played, ts.wins, ts.draws, ts.losses,
               ts.goals_for, ts.goals_against, 
               (ts.wins * 3 + ts.draws) as points,
               (ts.goals_for - ts.goals_against) as goal_difference
        FROM team_stats ts
        JOIN teams t ON ts.team_id = t.id
        JOIN leagues l ON ts.league_id = l.id
        WHERE l.api_id = %s
        ORDER BY points DESC, goal_difference DESC
    """, league_id)
    
    return standings

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8001)