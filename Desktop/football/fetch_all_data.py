import asyncio
import json
from datetime import datetime, timedelta
from data_bot.api_clients import APIFootballClient, FootballDataOrgClient, OddsAPIClient
from data_bot.json_storage import JSONStorage
from config.settings import Config

class ComprehensiveDataFetcher:
    def __init__(self):
        self.api_football = APIFootballClient()
        self.football_data = FootballDataOrgClient()
        self.odds_api = OddsAPIClient()
        self.storage = JSONStorage()
    
    async def fetch_all_data(self):
        """Fetch data from all 3 APIs and combine"""
        print("🚀 Starting comprehensive data fetch...")
        
        all_data = {
            "timestamp": datetime.now().isoformat(),
            "sources": ["API-Football", "Football-Data.org", "Odds-API"],
            "fixtures": [],
            "odds": [],
            "leagues": [],
            "teams": []
        }
        
        # 1. Fetch fixtures from API-Football
        print("📊 Fetching fixtures from API-Football...")
        try:
            for league_id in Config.TRACKED_LEAGUES:
                fixtures = await self.api_football.get_fixtures(league_id, 2024)
                for fixture in fixtures[:5]:  # Limit to avoid rate limits
                    all_data["fixtures"].append({
                        "source": "API-Football",
                        "league_id": league_id,
                        "fixture_id": fixture["fixture"]["id"],
                        "home_team": fixture["teams"]["home"]["name"],
                        "away_team": fixture["teams"]["away"]["name"],
                        "date": fixture["fixture"]["date"],
                        "status": fixture["fixture"]["status"]["short"],
                        "home_goals": fixture["goals"]["home"],
                        "away_goals": fixture["goals"]["away"]
                    })
            print(f"✅ API-Football: {len([f for f in all_data['fixtures'] if f['source'] == 'API-Football'])} fixtures")
        except Exception as e:
            print(f"❌ API-Football error: {e}")
        
        # 2. Fetch fixtures from Football-Data.org
        print("📊 Fetching fixtures from Football-Data.org...")
        try:
            fd_matches = await self.football_data.get_matches(2021)  # Premier League
            for match in fd_matches[:5]:
                all_data["fixtures"].append({
                    "source": "Football-Data.org",
                    "fixture_id": match["id"],
                    "home_team": match["homeTeam"]["name"],
                    "away_team": match["awayTeam"]["name"],
                    "date": match["utcDate"],
                    "status": match["status"],
                    "home_goals": match["score"]["fullTime"]["home"],
                    "away_goals": match["score"]["fullTime"]["away"]
                })
            print(f"✅ Football-Data.org: {len([f for f in all_data['fixtures'] if f['source'] == 'Football-Data.org'])} fixtures")
        except Exception as e:
            print(f"❌ Football-Data.org error: {e}")
        
        # 3. Fetch odds from Odds-API
        print("📊 Fetching odds from Odds-API...")
        try:
            sports = ["soccer_epl", "soccer_spain_la_liga", "soccer_germany_bundesliga"]
            for sport in sports:
                odds = await self.odds_api.get_odds(sport)
                for odd in odds[:3]:  # Limit to avoid rate limits
                    bookmaker_odds = []
                    for bookmaker in odd.get("bookmakers", []):
                        for market in bookmaker.get("markets", []):
                            if market["key"] == "h2h":
                                outcomes = {outcome["name"]: outcome["price"] for outcome in market["outcomes"]}
                                bookmaker_odds.append({
                                    "bookmaker": bookmaker["title"],
                                    "home_odds": outcomes.get(odd["home_team"], 0),
                                    "draw_odds": outcomes.get("Draw", 0),
                                    "away_odds": outcomes.get(odd["away_team"], 0)
                                })
                    
                    all_data["odds"].append({
                        "source": "Odds-API",
                        "sport": sport,
                        "fixture_id": odd["id"],
                        "home_team": odd["home_team"],
                        "away_team": odd["away_team"],
                        "commence_time": odd["commence_time"],
                        "bookmakers": bookmaker_odds
                    })
            print(f"✅ Odds-API: {len(all_data['odds'])} matches with odds")
        except Exception as e:
            print(f"❌ Odds-API error: {e}")
        
        # 4. Save to JSON
        filename = f"comprehensive_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = self.storage.save_data(all_data, filename)
        self.storage.append_to_master_file(all_data)
        
        # 5. Print summary
        print("\n" + "="*50)
        print("📈 DATA FETCH SUMMARY")
        print("="*50)
        print(f"🏟️  Total fixtures: {len(all_data['fixtures'])}")
        print(f"💰 Matches with odds: {len(all_data['odds'])}")
        print(f"📁 Saved to: {filepath}")
        print(f"📁 Master file: data/master_football_data.json")
        
        # Show sample data
        if all_data["fixtures"]:
            print(f"\n🔍 Sample fixture:")
            sample = all_data["fixtures"][0]
            print(f"   {sample['home_team']} vs {sample['away_team']}")
            print(f"   Date: {sample['date']}")
            print(f"   Source: {sample['source']}")
        
        if all_data["odds"]:
            print(f"\n💰 Sample odds:")
            sample = all_data["odds"][0]
            print(f"   {sample['home_team']} vs {sample['away_team']}")
            if sample["bookmakers"]:
                bm = sample["bookmakers"][0]
                print(f"   {bm['bookmaker']}: {bm['home_odds']} | {bm['draw_odds']} | {bm['away_odds']}")
        
        print("\n🎯 Ready for ML predictions and betting bot!")
        return all_data

async def main():
    """Run comprehensive data fetch"""
    fetcher = ComprehensiveDataFetcher()
    await fetcher.fetch_all_data()

if __name__ == "__main__":
    asyncio.run(main())