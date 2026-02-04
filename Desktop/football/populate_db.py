import asyncio
import json
from datetime import datetime
from data_bot.mysql_database import MySQLManager

async def populate_database_from_json():
    """Populate database from existing JSON file"""
    
    # Connect to database
    db = MySQLManager()
    await db.connect()
    
    # Read JSON file
    with open('data/test_data_20260201_152721.json', 'r') as f:
        data = json.load(f)
    
    print(f"Found {len(data['fixtures'])} fixtures in JSON")
    
    # First, ensure we have the Premier League
    await db.execute("""
        INSERT INTO leagues (api_id, name, country, season)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE name = VALUES(name)
    """, 39, "Premier League", "England", 2024)
    
    # Get league ID
    league = await db.fetchrow("SELECT id FROM leagues WHERE api_id = %s", 39)
    league_id = league["id"]
    
    teams_added = set()
    fixtures_added = 0
    
    for fixture_data in data['fixtures']:
        # Add teams if not already added
        for team_name in [fixture_data['home_team'], fixture_data['away_team']]:
            if team_name not in teams_added:
                # Create a fake API ID based on team name hash
                team_api_id = hash(team_name) % 100000
                
                await db.execute("""
                    INSERT INTO teams (api_id, name, country, logo_url)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE name = VALUES(name)
                """, team_api_id, team_name, "England", "")
                
                teams_added.add(team_name)
                print(f"Added team: {team_name}")
        
        # Get team IDs
        home_team = await db.fetchrow("SELECT id FROM teams WHERE name = %s", fixture_data['home_team'])
        away_team = await db.fetchrow("SELECT id FROM teams WHERE name = %s", fixture_data['away_team'])
        
        if home_team and away_team:
            # Add fixture
            match_date = datetime.fromisoformat(fixture_data['date'].replace('Z', '+00:00'))
            
            await db.execute("""
                INSERT INTO fixtures (api_id, league_id, home_team_id, away_team_id, 
                                    match_date, status, home_goals, away_goals)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE status = VALUES(status)
            """, 
            fixture_data['id'],
            league_id,
            home_team['id'],
            away_team['id'],
            match_date,
            fixture_data['status'],
            None,  # We don't have goals in this data
            None
            )
            
            fixtures_added += 1
    
    # Check final counts
    team_count = await db.fetch("SELECT COUNT(*) as count FROM teams")
    league_count = await db.fetch("SELECT COUNT(*) as count FROM leagues") 
    fixture_count = await db.fetch("SELECT COUNT(*) as count FROM fixtures")
    
    print(f"\nDatabase populated:")
    print(f"Teams: {team_count[0]['count']}")
    print(f"Leagues: {league_count[0]['count']}")
    print(f"Fixtures: {fixture_count[0]['count']}")
    
    await db.close()

if __name__ == "__main__":
    asyncio.run(populate_database_from_json())