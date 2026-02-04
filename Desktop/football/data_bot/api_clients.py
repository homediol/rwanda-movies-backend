import aiohttp
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from config.settings import Config

class FootballDataOrgClient:
    def __init__(self):
        self.base_url = Config.FOOTBALL_DATA_ORG_BASE_URL
        self.headers = {"X-Auth-Token": Config.FOOTBALL_DATA_ORG_KEY}
    
    async def get_matches(self, competition_id: int = 2021) -> List[Dict]:
        """Get matches from Football-Data.org"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/competitions/{competition_id}/matches",
                headers=self.headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("matches", [])
                return []
    
    async def get_standings(self, competition_id: int = 2021) -> List[Dict]:
        """Get league standings"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/competitions/{competition_id}/standings",
                headers=self.headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("standings", [])
                return []

class APIFootballClient:
    def __init__(self):
        self.base_url = Config.API_FOOTBALL_BASE_URL
        self.headers = {
            "X-RapidAPI-Key": Config.API_FOOTBALL_KEY,
            "X-RapidAPI-Host": "v3.football.api-sports.io"
        }
    
    async def get_fixtures(self, league_id: int, season: int, date: str = None) -> List[Dict]:
        params = {"league": league_id, "season": season}
        if date:
            params["date"] = date
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/fixtures",
                headers=self.headers,
                params=params
            ) as response:
                data = await response.json()
                return data.get("response", [])
    
    async def get_team_statistics(self, team_id: int, league_id: int, season: int) -> Dict:
        params = {"team": team_id, "league": league_id, "season": season}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/teams/statistics",
                headers=self.headers,
                params=params
            ) as response:
                data = await response.json()
                return data.get("response", {})
    
    async def get_leagues(self) -> List[Dict]:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/leagues",
                headers=self.headers
            ) as response:
                data = await response.json()
                return data.get("response", [])

class OddsAPIClient:
    def __init__(self):
        self.base_url = Config.ODDS_API_BASE_URL
        self.api_key = Config.ODDS_API_KEY
    
    async def get_odds(self, sport: str = "soccer_epl") -> List[Dict]:
        params = {
            "apiKey": self.api_key,
            "regions": "eu",
            "markets": "h2h,spreads"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/sports/{sport}/odds",
                params=params
            ) as response:
                return await response.json()