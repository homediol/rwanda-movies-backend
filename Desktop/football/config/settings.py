import os
from typing import Optional

class Config:
    # API Keys
    API_FOOTBALL_KEY: str = os.getenv("API_FOOTBALL_KEY", "106673c847d2b4a12bdc61d6d25d0304")
    FOOTBALL_DATA_ORG_KEY: str = os.getenv("FOOTBALL_DATA_ORG_KEY", "bc4c5177dfaa44dfb24fb613ff09edb5")
    ODDS_API_KEY: str = os.getenv("ODDS_API_KEY", "f3e6194d79a342e8bf2fb8069a143a15")
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "mysql://root:@localhost:3306/football_db"
    )
    
    # API URLs
    API_FOOTBALL_BASE_URL: str = "https://v3.football.api-sports.io"
    FOOTBALL_DATA_ORG_BASE_URL: str = "https://api.football-data.org/v4"
    ODDS_API_BASE_URL: str = "https://api.the-odds-api.com/v4"
    
    # Rate limiting
    API_FOOTBALL_RATE_LIMIT: int = 100  # requests per day for free tier
    ODDS_API_RATE_LIMIT: int = 500      # requests per month for free tier
    
    # Leagues to track (API-Football league IDs)
    TRACKED_LEAGUES: list = [
        39,   # Premier League
        140,  # La Liga
        78,   # Bundesliga
        135,  # Serie A
        61,   # Ligue 1
    ]
    
    # ML Model settings
    MODEL_RETRAIN_DAYS: int = 7
    MIN_MATCHES_FOR_PREDICTION: int = 5