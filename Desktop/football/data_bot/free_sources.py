import aiohttp
import asyncio
from bs4 import BeautifulSoup
from typing import Dict, List
import json

class FreeDataSources:
    """Alternative free data sources for football data"""
    
    async def fetch_football_data_org(self, competition_id: int = 2021) -> List[Dict]:
        """Fetch from football-data.org (free tier: 10 calls/minute)"""
        headers = {"X-Auth-Token": "YOUR_FREE_TOKEN"}
        url = f"https://api.football-data.org/v4/competitions/{competition_id}/matches"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("matches", [])
                return []
    
    async def scrape_espn_scores(self, league: str = "eng.1") -> List[Dict]:
        """Scrape ESPN for match data (respect robots.txt)"""
        url = f"https://www.espn.com/soccer/fixtures/_/league/{league}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    matches = []
                    # Parse match data from ESPN structure
                    match_elements = soup.find_all('div', class_='Table__TR')
                    
                    for match in match_elements[:10]:  # Limit results
                        try:
                            teams = match.find_all('span', class_='Table__Team')
                            if len(teams) >= 2:
                                matches.append({
                                    'home_team': teams[0].text.strip(),
                                    'away_team': teams[1].text.strip(),
                                    'date': match.find('span', class_='Table__Time').text if match.find('span', class_='Table__Time') else 'TBD'
                                })
                        except:
                            continue
                    
                    return matches
                return []
    
    async def fetch_thesportsdb(self, league_id: str = "4328") -> List[Dict]:
        """Fetch from TheSportsDB (completely free)"""
        url = f"https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id={league_id}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("events", [])
                return []
    
    async def get_free_odds_approximation(self, home_prob: float, draw_prob: float, away_prob: float) -> Dict:
        """Convert probabilities to approximate odds (since free odds APIs are limited)"""
        # Add bookmaker margin (typically 5-10%)
        margin = 0.07
        
        # Convert probabilities to odds
        home_odds = (1 / home_prob) * (1 + margin) if home_prob > 0 else 10.0
        draw_odds = (1 / draw_prob) * (1 + margin) if draw_prob > 0 else 10.0
        away_odds = (1 / away_prob) * (1 + margin) if away_prob > 0 else 10.0
        
        return {
            "bookmaker": "estimated",
            "home_odds": round(home_odds, 2),
            "draw_odds": round(draw_odds, 2),
            "away_odds": round(away_odds, 2)
        }

# Usage example
async def demo_free_sources():
    sources = FreeDataSources()
    
    # Try different free sources
    try:
        matches = await sources.fetch_thesportsdb()
        print(f"TheSportsDB matches: {len(matches)}")
        
        espn_matches = await sources.scrape_espn_scores()
        print(f"ESPN matches: {len(espn_matches)}")
        
    except Exception as e:
        print(f"Error fetching free data: {e}")

if __name__ == "__main__":
    asyncio.run(demo_free_sources())