import asyncio
import aiohttp
from data_bot.mysql_database import MySQLManager

async def fetch_team_statistics():
    """Fetch team statistics from API and populate team_stats table"""
    
    db = MySQLManager()
    await db.connect()
    
    headers = {
        "X-RapidAPI-Key": "106673c847d2b4a12bdc61d6d25d0304",
        "X-RapidAPI-Host": "v3.football.api-sports.io"
    }
    
    # Get all teams and leagues from database
    teams_leagues = await db.fetch("""
        SELECT DISTINCT t.id as team_id, t.api_id as team_api_id, t.name as team_name,
               l.id as league_id, l.api_id as league_api_id, l.name as league_name
        FROM teams t
        JOIN fixtures f ON (t.id = f.home_team_id OR t.id = f.away_team_id)
        JOIN leagues l ON f.league_id = l.id
        LIMIT 50
    """)
    
    print(f"Found {len(teams_leagues)} team-league combinations")
    
    async with aiohttp.ClientSession() as session:
        stats_added = 0
        
        for item in teams_leagues:
            print(f"Fetching stats for {item['team_name']} in {item['league_name']}...")
            
            # Fetch team statistics from API
            async with session.get(
                "https://v3.football.api-sports.io/teams/statistics",
                headers=headers,
                params={
                    "team": item["team_api_id"],
                    "league": item["league_api_id"],
                    "season": 2024
                }
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    stats = data.get("response", {})
                    
                    if stats:
                        # Extract statistics
                        fixtures = stats.get("fixtures", {})
                        goals = stats.get("goals", {})
                        
                        # Insert into team_stats table
                        await db.execute("""
                            INSERT INTO team_stats (
                                team_id, league_id, season, matches_played,
                                wins, draws, losses, goals_for, goals_against,
                                home_wins, home_draws, home_losses,
                                away_wins, away_draws, away_losses
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON DUPLICATE KEY UPDATE
                                matches_played = VALUES(matches_played),
                                wins = VALUES(wins),
                                draws = VALUES(draws),
                                losses = VALUES(losses),
                                goals_for = VALUES(goals_for),
                                goals_against = VALUES(goals_against),
                                home_wins = VALUES(home_wins),
                                home_draws = VALUES(home_draws),
                                home_losses = VALUES(home_losses),
                                away_wins = VALUES(away_wins),
                                away_draws = VALUES(away_draws),
                                away_losses = VALUES(away_losses),
                                updated_at = CURRENT_TIMESTAMP
                        """,
                        item["team_id"],
                        item["league_id"],
                        2024,
                        fixtures.get("played", {}).get("total", 0),
                        fixtures.get("wins", {}).get("total", 0),
                        fixtures.get("draws", {}).get("total", 0),
                        fixtures.get("loses", {}).get("total", 0),
                        goals.get("for", {}).get("total", {}).get("total", 0),
                        goals.get("against", {}).get("total", {}).get("total", 0),
                        fixtures.get("wins", {}).get("home", 0),
                        fixtures.get("draws", {}).get("home", 0),
                        fixtures.get("loses", {}).get("home", 0),
                        fixtures.get("wins", {}).get("away", 0),
                        fixtures.get("draws", {}).get("away", 0),
                        fixtures.get("loses", {}).get("away", 0)
                        )
                        
                        stats_added += 1
                        print(f"  ✅ Added stats: {fixtures.get('played', {}).get('total', 0)} matches played")
                    else:
                        print(f"  ❌ No stats found")
                else:
                    print(f"  ❌ API Error: {response.status}")
                
                # Rate limiting
                await asyncio.sleep(0.2)
    
    # Check final count
    total_stats = await db.fetch("SELECT COUNT(*) as count FROM team_stats")
    print(f"\nTotal team stats in database: {total_stats[0]['count']}")
    
    # Show sample data
    sample_stats = await db.fetch("""
        SELECT ts.*, t.name as team_name, l.name as league_name
        FROM team_stats ts
        JOIN teams t ON ts.team_id = t.id
        JOIN leagues l ON ts.league_id = l.id
        ORDER BY ts.matches_played DESC
        LIMIT 5
    """)
    
    print("\nSample team statistics:")
    for stat in sample_stats:
        print(f"{stat['team_name']} ({stat['league_name']}): {stat['matches_played']} matches, {stat['wins']} wins, {stat['goals_for']} goals")
    
    await db.close()
    print(f"\nCompleted! Added {stats_added} team statistics.")

if __name__ == "__main__":
    asyncio.run(fetch_team_statistics())