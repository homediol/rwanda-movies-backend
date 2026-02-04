import asyncio
import aiohttp
import json
import os
from datetime import datetime
from data_bot.mysql_database import MySQLManager

async def test_fetch_and_store():
    """Test fetching data from API and storing in database + JSON"""
    
    # Create data directory
    os.makedirs("data", exist_ok=True)
    
    # Connect to database
    db = MySQLManager()
    await db.connect()
    
    headers = {
        "X-RapidAPI-Key": "106673c847d2b4a12bdc61d6d25d0304",
        "X-RapidAPI-Host": "v3.football.api-sports.io"
    }
    
    print("Fetching data from API...")
    
    async with aiohttp.ClientSession() as session:
        # Test API connection first
        async with session.get(
            "https://v3.football.api-sports.io/status",
            headers=headers
        ) as response:
            if response.status == 200:
                status_data = await response.json()
                print(f"API Status: {status_data['response']['requests']['current']}/{status_data['response']['requests']['limit_day']} requests used")
            else:
                print(f"API Error: {response.status}")
                return
        
        # Try multiple approaches to get fixtures
        params_list = [
            {"league": 39, "season": 2024, "next": 10},
            {"league": 39, "season": 2024, "from": "2024-01-01", "to": "2024-12-31"},
            {"league": 39, "season": 2023, "from": "2023-08-01", "to": "2024-05-31"},
            {"league": 140, "season": 2024, "next": 5},  # La Liga
            {"league": 78, "season": 2024, "next": 5},   # Bundesliga
        ]
        
        for params in params_list:
            print(f"Trying params: {params}")
            async with session.get(
                "https://v3.football.api-sports.io/fixtures",
                headers=headers,
                params=params
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    fixtures = data.get("response", [])
                    print(f"Found {len(fixtures)} fixtures with params {params}")
                    
                    if fixtures:
                        break  # Use first successful result
                else:
                    print(f"API Error: {response.status}")
        if fixtures:
            print(f"Processing {len(fixtures)} fixtures...")
            
            all_data = {"fixtures": [], "teams": []}
            
            for fixture in fixtures:
                # Store teams
                for team_type in ["home", "away"]:
                    team = fixture["teams"][team_type]
                    try:
                        await db.execute("""
                            INSERT INTO teams (api_id, name, country, logo_url)
                            VALUES (%s, %s, %s, %s)
                            ON DUPLICATE KEY UPDATE name = VALUES(name)
                        """, team["id"], team["name"], fixture["league"]["country"], team["logo"])
                        print(f"Stored team: {team['name']}")
                    except Exception as e:
                        print(f"Error storing team {team['name']}: {e}")
                
                # Store league
                league = fixture["league"]
                try:
                    await db.execute("""
                        INSERT INTO leagues (api_id, name, country, season)
                        VALUES (%s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE name = VALUES(name)
                    """, league["id"], league["name"], league["country"], league["season"])
                    print(f"Stored league: {league['name']}")
                except Exception as e:
                    print(f"Error storing league: {e}")
                
                # Add to JSON data
                all_data["fixtures"].append({
                    "id": fixture["fixture"]["id"],
                    "home_team": fixture["teams"]["home"]["name"],
                    "away_team": fixture["teams"]["away"]["name"],
                    "date": fixture["fixture"]["date"],
                    "status": fixture["fixture"]["status"]["short"]
                })
            
            # Save to JSON
            filename = f"data/test_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w') as f:
                json.dump(all_data, f, indent=2)
            print(f"Saved data to {filename}")
            
            # Check database
            team_count = await db.fetch("SELECT COUNT(*) as count FROM teams")
            league_count = await db.fetch("SELECT COUNT(*) as count FROM leagues")
            print(f"Database: {team_count[0]['count']} teams, {league_count[0]['count']} leagues")
            
        else:
            print("No fixtures found with any parameters")
    
    await db.close()
    print("Test completed!")

if __name__ == "__main__":
    asyncio.run(test_fetch_and_store())