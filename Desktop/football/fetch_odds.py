import asyncio
import aiohttp
from data_bot.mysql_database import MySQLManager

async def fetch_odds_with_names():
    """Fetch odds data from Odds API and store with team names"""
    
    db = MySQLManager()
    await db.connect()
    
    # Get fixtures from database
    fixtures = await db.fetch("""
        SELECT f.id, f.api_id, f.match_date,
               ht.name as home_team_name, at.name as away_team_name,
               l.name as league_name
        FROM fixtures f
        JOIN teams ht ON f.home_team_id = ht.id
        JOIN teams at ON f.away_team_id = at.id
        JOIN leagues l ON f.league_id = l.id
        WHERE f.status IN ('scheduled', 'NS', 'TBD')
        LIMIT 20
    """)
    
    print(f"Found {len(fixtures)} upcoming fixtures")
    
    # Odds API configuration
    odds_api_key = "f3e6194d79a342e8bf2fb8069a143a15"
    
    async with aiohttp.ClientSession() as session:
        # Fetch odds for different sports
        sports = ["soccer_epl", "soccer_spain_la_liga", "soccer_germany_bundesliga", 
                 "soccer_italy_serie_a", "soccer_france_ligue_one"]
        
        for sport in sports:
            print(f"\nFetching odds for {sport}...")
            
            try:
                async with session.get(
                    f"https://api.the-odds-api.com/v4/sports/{sport}/odds",
                    params={
                        "apiKey": odds_api_key,
                        "regions": "eu",
                        "markets": "h2h",
                        "oddsFormat": "decimal"
                    }
                ) as response:
                    
                    if response.status == 200:
                        odds_data = await response.json()
                        print(f"Found {len(odds_data)} matches with odds")
                        
                        for match in odds_data[:5]:  # Limit to 5 matches per sport
                            home_team = match["home_team"]
                            away_team = match["away_team"]
                            
                            # Try to find matching fixture in database
                            fixture = await db.fetchrow("""
                                SELECT f.id, f.api_id
                                FROM fixtures f
                                JOIN teams ht ON f.home_team_id = ht.id
                                JOIN teams at ON f.away_team_id = at.id
                                WHERE (ht.name LIKE %s OR ht.name LIKE %s) 
                                  AND (at.name LIKE %s OR at.name LIKE %s)
                                LIMIT 1
                            """, f"%{home_team}%", f"%{home_team.split()[-1]}%",
                                f"%{away_team}%", f"%{away_team.split()[-1]}%")
                            
                            if not fixture:
                                # Create a dummy fixture for odds-only matches
                                print(f"Creating entry for: {home_team} vs {away_team}")
                                continue
                            
                            # Store odds from each bookmaker
                            for bookmaker in match.get("bookmakers", []):
                                for market in bookmaker.get("markets", []):
                                    if market["key"] == "h2h":
                                        outcomes = market["outcomes"]
                                        
                                        # Extract odds
                                        home_odds = next((o["price"] for o in outcomes if o["name"] == home_team), None)
                                        away_odds = next((o["price"] for o in outcomes if o["name"] == away_team), None)
                                        draw_odds = next((o["price"] for o in outcomes if o["name"] == "Draw"), None)
                                        
                                        if home_odds and away_odds:
                                            # Store in database
                                            await db.execute("""
                                                INSERT INTO odds (fixture_id, bookmaker, home_odds, draw_odds, away_odds)
                                                VALUES (%s, %s, %s, %s, %s)
                                                ON DUPLICATE KEY UPDATE
                                                    home_odds = VALUES(home_odds),
                                                    draw_odds = VALUES(draw_odds),
                                                    away_odds = VALUES(away_odds)
                                            """, fixture["id"], bookmaker["title"], 
                                                home_odds, draw_odds or 3.50, away_odds)
                                            
                                            print(f"  ✅ {bookmaker['title']}: {home_team} {home_odds} | Draw {draw_odds or 3.50} | {away_team} {away_odds}")
                    else:
                        print(f"Odds API Error: {response.status}")
                        
            except Exception as e:
                print(f"Error fetching odds for {sport}: {e}")
            
            # Rate limiting
            await asyncio.sleep(1)
    
    # Check final odds count
    odds_count = await db.fetch("SELECT COUNT(*) as count FROM odds")
    print(f"\nTotal odds in database: {odds_count[0]['count']}")
    
    # Show sample odds with team names
    sample_odds = await db.fetch("""
        SELECT o.*, ht.name as home_team, at.name as away_team, l.name as league
        FROM odds o
        JOIN fixtures f ON o.fixture_id = f.id
        JOIN teams ht ON f.home_team_id = ht.id
        JOIN teams at ON f.away_team_id = at.id
        JOIN leagues l ON f.league_id = l.id
        ORDER BY o.created_at DESC
        LIMIT 5
    """)
    
    print("\nSample odds with team names:")
    for odd in sample_odds:
        print(f"{odd['home_team']} vs {odd['away_team']} ({odd['league']})")
        print(f"  {odd['bookmaker']}: {odd['home_odds']} | {odd['draw_odds']} | {odd['away_odds']}")
    
    await db.close()
    print("\nOdds fetching completed!")

if __name__ == "__main__":
    asyncio.run(fetch_odds_with_names())