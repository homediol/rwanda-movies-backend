import asyncio
import aiohttp
import json
import os
from datetime import datetime
from data_bot.mysql_database import MySQLManager

async def fetch_all_leagues():
    """Fetch data for all major leagues"""
    
    # Create data directory
    os.makedirs("data", exist_ok=True)
    
    # Connect to database
    db = MySQLManager()
    await db.connect()
    
    headers = {
        "X-RapidAPI-Key": "106673c847d2b4a12bdc61d6d25d0304",
        "X-RapidAPI-Host": "v3.football.api-sports.io"
    }
    
    # All major leagues
    leagues = [
        {"id": 39, "name": "Premier League", "country": "England"},
        {"id": 140, "name": "La Liga", "country": "Spain"},
        {"id": 78, "name": "Bundesliga", "country": "Germany"},
        {"id": 135, "name": "Serie A", "country": "Italy"},
        {"id": 61, "name": "Ligue 1", "country": "France"}
    ]
    
    all_data = {"leagues": [], "teams": [], "fixtures": []}
    
    async with aiohttp.ClientSession() as session:
        for league in leagues:
            print(f"\nFetching data for {league['name']}...")
            
            # Add league to database
            await db.execute("""
                INSERT INTO leagues (api_id, name, country, season)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE name = VALUES(name)
            """, league["id"], league["name"], league["country"], 2024)
            
            all_data["leagues"].append(league)
            
            # Get league ID from database
            league_row = await db.fetchrow("SELECT id FROM leagues WHERE api_id = %s", league["id"])
            league_db_id = league_row["id"]
            
            # Try different parameters to get fixtures
            fixtures = []
            for params in [
                {"league": league["id"], "season": 2024, "next": 10},
                {"league": league["id"], "season": 2024, "from": "2024-01-01", "to": "2024-12-31"},
                {"league": league["id"], "season": 2023, "from": "2023-08-01", "to": "2024-05-31"}
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
                            print(f"Found {len(fixtures)} fixtures for {league['name']}")
                            break
                    else:
                        print(f"API Error for {league['name']}: {response.status}")
            
            if not fixtures:
                print(f"No fixtures found for {league['name']}")
                continue
            
            # Process fixtures
            teams_in_league = set()
            
            for fixture in fixtures[:15]:  # Limit to 15 fixtures per league
                # Store teams
                for team_type in ["home", "away"]:
                    team = fixture["teams"][team_type]
                    team_name = team["name"]
                    
                    if team_name not in teams_in_league:
                        await db.execute("""
                            INSERT INTO teams (api_id, name, country, logo_url)
                            VALUES (%s, %s, %s, %s)
                            ON DUPLICATE KEY UPDATE name = VALUES(name)
                        """, team["id"], team_name, league["country"], team["logo"])
                        
                        teams_in_league.add(team_name)
                        all_data["teams"].append({
                            "api_id": team["id"],
                            "name": team_name,
                            "country": league["country"],
                            "league": league["name"]
                        })
                
                # Get team IDs from database
                home_team = await db.fetchrow("SELECT id FROM teams WHERE api_id = %s", fixture["teams"]["home"]["id"])
                away_team = await db.fetchrow("SELECT id FROM teams WHERE api_id = %s", fixture["teams"]["away"]["id"])
                
                if home_team and away_team:
                    # Store fixture
                    match_date = datetime.fromisoformat(fixture["fixture"]["date"].replace("Z", "+00:00"))
                    
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
                    league_db_id,
                    home_team["id"],
                    away_team["id"],
                    match_date,
                    fixture["fixture"]["status"]["short"],
                    fixture["goals"]["home"],
                    fixture["goals"]["away"]
                    )
                    
                    all_data["fixtures"].append({
                        "id": fixture["fixture"]["id"],
                        "home_team": fixture["teams"]["home"]["name"],
                        "away_team": fixture["teams"]["away"]["name"],
                        "date": fixture["fixture"]["date"],
                        "status": fixture["fixture"]["status"]["short"],
                        "league": league["name"]
                    })
            
            print(f"Added {len(teams_in_league)} teams for {league['name']}")
    
    # Save all data to JSON
    filename = f"data/all_leagues_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w') as f:
        json.dump(all_data, f, indent=2)
    print(f"\nSaved all data to {filename}")
    
    # Check final database counts
    team_count = await db.fetch("SELECT COUNT(*) as count FROM teams")
    league_count = await db.fetch("SELECT COUNT(*) as count FROM leagues")
    fixture_count = await db.fetch("SELECT COUNT(*) as count FROM fixtures")
    
    print(f"\nFinal database counts:")
    print(f"Leagues: {league_count[0]['count']}")
    print(f"Teams: {team_count[0]['count']}")
    print(f"Fixtures: {fixture_count[0]['count']}")
    
    # Show teams by league
    for league in leagues:
        teams = await db.fetch("""
            SELECT t.name 
            FROM teams t
            JOIN fixtures f ON (t.id = f.home_team_id OR t.id = f.away_team_id)
            JOIN leagues l ON f.league_id = l.id
            WHERE l.api_id = %s
            GROUP BY t.name
            LIMIT 5
        """, league["id"])
        
        team_names = [team["name"] for team in teams]
        print(f"{league['name']}: {', '.join(team_names)}")
    
    await db.close()
    print("\nAll leagues data fetched and stored!")

if __name__ == "__main__":
    asyncio.run(fetch_all_leagues())