import asyncio
from datetime import datetime, timedelta
from data_bot.mysql_database import MySQLManager
from data_bot.api_clients import APIFootballClient, FootballDataOrgClient, OddsAPIClient
from data_bot.json_storage import JSONStorage
from config.settings import Config

class DataBot:
    def __init__(self):
        self.db = MySQLManager()
        self.api_client = APIFootballClient()
        self.football_data_client = FootballDataOrgClient()
        self.odds_client = OddsAPIClient()
        self.json_storage = JSONStorage()
    
    async def initialize(self):
        await self.db.connect()
    
    async def close(self):
        await self.db.close()
    
    async def sync_teams_and_leagues(self):
        """Sync teams and leagues data"""
        for league_id in Config.TRACKED_LEAGUES:
            fixtures = await self.api_client.get_fixtures(league_id, 2024)
            
            for fixture in fixtures[:10]:  # Limit for demo
                # Insert league
                league_data = fixture["league"]
                await self.db.execute("""
                    INSERT INTO leagues (api_id, name, country, season)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (api_id) DO NOTHING
                """, league_data["id"], league_data["name"], 
                    league_data["country"], league_data["season"])
                
                # Insert teams
                for team_key in ["home", "away"]:
                    team = fixture["teams"][team_key]
                    await self.db.execute("""
                        INSERT INTO teams (api_id, name, logo_url)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (api_id) DO NOTHING
                    """, team["id"], team["name"], team["logo"])
    
    async def sync_fixtures(self):
        """Sync fixture data"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        for league_id in Config.TRACKED_LEAGUES:
            fixtures = await self.api_client.get_fixtures(league_id, 2024, today)
            
            for fixture in fixtures:
                # Get internal IDs
                league_row = await self.db.fetchrow(
                    "SELECT id FROM leagues WHERE api_id = $1", 
                    fixture["league"]["id"]
                )
                home_team_row = await self.db.fetchrow(
                    "SELECT id FROM teams WHERE api_id = $1", 
                    fixture["teams"]["home"]["id"]
                )
                away_team_row = await self.db.fetchrow(
                    "SELECT id FROM teams WHERE api_id = $1", 
                    fixture["teams"]["away"]["id"]
                )
                
                if all([league_row, home_team_row, away_team_row]):
                    await self.db.execute("""
                        INSERT INTO fixtures (
                            api_id, league_id, home_team_id, away_team_id,
                            match_date, status, home_goals, away_goals
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT (api_id) DO UPDATE SET
                            status = $6, home_goals = $7, away_goals = $8,
                            updated_at = CURRENT_TIMESTAMP
                    """, 
                    fixture["fixture"]["id"],
                    league_row["id"],
                    home_team_row["id"], 
                    away_team_row["id"],
                    datetime.fromisoformat(fixture["fixture"]["date"].replace("Z", "+00:00")),
                    fixture["fixture"]["status"]["short"],
                    fixture["goals"]["home"],
                    fixture["goals"]["away"]
                    )
    
    async def sync_team_stats(self):
        """Update team statistics"""
        teams = await self.db.fetch("SELECT id, api_id FROM teams LIMIT 10")
        
        for team in teams:
            for league_id in Config.TRACKED_LEAGUES:
                try:
                    stats = await self.api_client.get_team_statistics(
                        team["api_id"], league_id, 2024
                    )
                    
                    if stats:
                        league_row = await self.db.fetchrow(
                            "SELECT id FROM leagues WHERE api_id = $1", league_id
                        )
                        
                        if league_row:
                            await self.db.execute("""
                                INSERT INTO team_stats (
                                    team_id, league_id, season, matches_played,
                                    wins, draws, losses, goals_for, goals_against,
                                    home_wins, home_draws, home_losses,
                                    away_wins, away_draws, away_losses
                                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                                ON CONFLICT (team_id, league_id, season) DO UPDATE SET
                                    matches_played = $4, wins = $5, draws = $6, losses = $7,
                                    goals_for = $8, goals_against = $9,
                                    home_wins = $10, home_draws = $11, home_losses = $12,
                                    away_wins = $13, away_draws = $14, away_losses = $15,
                                    updated_at = CURRENT_TIMESTAMP
                            """,
                            team["id"], league_row["id"], 2024,
                            stats["fixtures"]["played"]["total"],
                            stats["fixtures"]["wins"]["total"],
                            stats["fixtures"]["draws"]["total"],
                            stats["fixtures"]["loses"]["total"],
                            stats["goals"]["for"]["total"]["total"],
                            stats["goals"]["against"]["total"]["total"],
                            stats["fixtures"]["wins"]["home"],
                            stats["fixtures"]["draws"]["home"],
                            stats["fixtures"]["loses"]["home"],
                            stats["fixtures"]["wins"]["away"],
                            stats["fixtures"]["draws"]["away"],
                            stats["fixtures"]["loses"]["away"]
                            )
                except Exception as e:
                    print(f"Error updating stats for team {team['api_id']}: {e}")
                    continue
    
    async def run_daily_sync(self):
        """Run daily data synchronization and save to JSON + DB"""
        print("Starting daily sync...")
        
        # Collect all data
        all_data = {
            "teams": [],
            "leagues": [],
            "fixtures": [],
            "odds": [],
            "stats": []
        }
        
        # Sync and collect data
        for league_id in Config.TRACKED_LEAGUES:
            # API-Football data
            fixtures = await self.api_client.get_fixtures(league_id, 2024)
            all_data["fixtures"].extend(fixtures)
            
            # Football-Data.org data
            try:
                fd_matches = await self.football_data_client.get_matches(league_id)
                all_data["fixtures"].extend(fd_matches)
            except:
                pass
            
            # Odds data
            try:
                odds = await self.odds_client.get_odds()
                all_data["odds"].extend(odds)
            except:
                pass
        
        # Save to JSON file
        self.json_storage.save_data(all_data)
        self.json_storage.append_to_master_file(all_data)
        
        # Save to database
        await self.sync_teams_and_leagues()
        await self.sync_fixtures()
        await self.sync_team_stats()
        
        print("Daily sync completed - saved to JSON and database")

async def main():
    bot = DataBot()
    await bot.initialize()
    
    try:
        await bot.run_daily_sync()
    finally:
        await bot.close()

if __name__ == "__main__":
    asyncio.run(main())