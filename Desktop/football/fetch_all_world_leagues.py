import asyncio
import aiohttp
import json
import os
from datetime import datetime
from data_bot.mysql_database import MySQLManager

async def fetch_all_available_leagues():
    """Fetch ALL available leagues from API and their data"""
    
    os.makedirs("data", exist_ok=True)
    db = MySQLManager()
    await db.connect()
    
    headers = {
        "X-RapidAPI-Key": "106673c847d2b4a12bdc61d6d25d0304",
        "X-RapidAPI-Host": "v3.football.api-sports.io"
    }
    
    print("Fetching all available leagues...")
    
    async with aiohttp.ClientSession() as session:
        # First, get all available leagues
        async with session.get(
            "https://v3.football.api-sports.io/leagues",
            headers=headers
        ) as response:
            if response.status != 200:
                print(f"Error fetching leagues: {response.status}")
                return
            
            data = await response.json()
            all_leagues = data.get("response", [])
            print(f"Found {len(all_leagues)} total leagues")
        
        # Filter for current/recent seasons and major countries
        active_leagues = []
        for league_data in all_leagues:
            league = league_data["league"]
            seasons = league_data.get("seasons", [])
            
            # Only include leagues with recent seasons (2023 or 2024)
            has_recent_season = any(
                season["year"] in [2023, 2024] and season["current"] 
                for season in seasons
            )
            
            if has_recent_season:
                active_leagues.append({
                    "id": league["id"],
                    "name": league["name"],
                    "country": league_data["country"]["name"],
                    "type": league["type"]
                })
        
        print(f"Found {len(active_leagues)} active leagues")
        
        # Limit to avoid API quota (select diverse leagues)
        selected_leagues = []
        countries_added = set()
        
        # Prioritize major leagues first
        major_leagues = [39, 140, 78, 135, 61, 2, 3, 88, 94, 71]  # Top European + others
        
        for league in active_leagues:
            if league["id"] in major_leagues:
                selected_leagues.append(league)
                countries_added.add(league["country"])
        
        # Add more leagues from different countries
        for league in active_leagues:
            if len(selected_leagues) >= 50:  # Limit to 50 leagues
                break
            
            if (league["country"] not in countries_added or 
                len([l for l in selected_leagues if l["country"] == league["country"]]) < 3):
                selected_leagues.append(league)
                countries_added.add(league["country"])
        
        print(f"Selected {len(selected_leagues)} leagues from {len(countries_added)} countries")
        
        # Now fetch data for selected leagues
        all_data = {"leagues": [], "teams": [], "fixtures": []}
        
        for i, league in enumerate(selected_leagues):
            print(f"\n[{i+1}/{len(selected_leagues)}] Fetching {league['name']} ({league['country']})...")
            
            # Add league to database
            await db.execute("""
                INSERT INTO leagues (api_id, name, country, season)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE name = VALUES(name)
            """, league["id"], league["name"], league["country"], 2024)
            
            all_data["leagues"].append(league)
            
            # Get fixtures for this league
            fixtures = []
            for params in [
                {"league": league["id"], "season": 2024, "next": 5},
                {"league": league["id"], "season": 2023, "last": 5}
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
                            break
                    await asyncio.sleep(0.1)  # Rate limiting
            
            if not fixtures:
                print(f"  No fixtures found for {league['name']}")
                continue
            
            print(f"  Found {len(fixtures)} fixtures")
            
            # Get league ID from database
            league_row = await db.fetchrow("SELECT id FROM leagues WHERE api_id = %s", league["id"])
            league_db_id = league_row["id"]
            
            # Process fixtures (limit to 5 per league to save API calls)
            for fixture in fixtures[:5]:
                # Store teams
                for team_type in ["home", "away"]:
                    team = fixture["teams"][team_type]
                    await db.execute("""
                        INSERT INTO teams (api_id, name, country, logo_url)
                        VALUES (%s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE name = VALUES(name)
                    """, team["id"], team["name"], league["country"], team["logo"])
                
                # Get team IDs and store fixture
                home_team = await db.fetchrow("SELECT id FROM teams WHERE api_id = %s", fixture["teams"]["home"]["id"])
                away_team = await db.fetchrow("SELECT id FROM teams WHERE api_id = %s", fixture["teams"]["away"]["id"])
                
                if home_team and away_team:
                    match_date = datetime.fromisoformat(fixture["fixture"]["date"].replace("Z", "+00:00"))
                    
                    await db.execute("""
                        INSERT INTO fixtures (api_id, league_id, home_team_id, away_team_id, 
                                            match_date, status, home_goals, away_goals)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE status = VALUES(status)
                    """, 
                    fixture["fixture"]["id"], league_db_id, home_team["id"], away_team["id"],
                    match_date, fixture["fixture"]["status"]["short"],
                    fixture["goals"]["home"], fixture["goals"]["away"]
                    )
                    
                    all_data["fixtures"].append({
                        "id": fixture["fixture"]["id"],
                        "home_team": fixture["teams"]["home"]["name"],
                        "away_team": fixture["teams"]["away"]["name"],
                        "date": fixture["fixture"]["date"],
                        "league": league["name"],
                        "country": league["country"]
                    })
        
        # Save comprehensive data
        filename = f"data/all_world_leagues_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(all_data, f, indent=2)
        print(f"\nSaved data to {filename}")
        
        # Final counts
        team_count = await db.fetch("SELECT COUNT(*) as count FROM teams")
        league_count = await db.fetch("SELECT COUNT(*) as count FROM leagues")
        fixture_count = await db.fetch("SELECT COUNT(*) as count FROM fixtures")
        
        print(f"\nFinal database:")
        print(f"Leagues: {league_count[0]['count']}")
        print(f"Teams: {team_count[0]['count']}")
        print(f"Fixtures: {fixture_count[0]['count']}")
        
        # Show leagues by country
        countries = await db.fetch("""
            SELECT country, COUNT(*) as league_count
            FROM leagues 
            GROUP BY country 
            ORDER BY league_count DESC
            LIMIT 10
        """)
        
        print(f"\nTop countries:")
        for country in countries:
            print(f"  {country['country']}: {country['league_count']} leagues")
    
    await db.close()
    print("\nAll world leagues data fetched!")

if __name__ == "__main__":
    asyncio.run(fetch_all_available_leagues())