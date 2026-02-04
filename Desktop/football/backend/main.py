import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import asyncio
from contextlib import asynccontextmanager

from data_bot.mysql_database import MySQLManager
from ml_models.predictors import HybridPredictor

# Global variables
db_manager = None
predictor = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global db_manager, predictor
    db_manager = MySQLManager()
    await db_manager.connect()
    
    predictor = HybridPredictor()
    await predictor.initialize(db_manager)
    
    yield
    
    # Shutdown
    await db_manager.close()

app = FastAPI(title="Football Prediction API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class TeamResponse(BaseModel):
    id: int
    name: str
    country: Optional[str]
    logo_url: Optional[str]

class FixtureResponse(BaseModel):
    id: int
    home_team: TeamResponse
    away_team: TeamResponse
    match_date: datetime
    status: str
    home_goals: Optional[int]
    away_goals: Optional[int]

class PredictionResponse(BaseModel):
    fixture_id: int
    home_team: str
    away_team: str
    home_win_prob: float
    draw_prob: float
    away_win_prob: float
    expected_home_goals: float
    expected_away_goals: float
    confidence: float
    created_at: datetime

class OddsResponse(BaseModel):
    fixture_id: int
    bookmaker: str
    home_odds: float
    draw_odds: float
    away_odds: float

# Dependency
async def get_db():
    return db_manager

@app.get("/")
async def root():
    return {"message": "Football Prediction API"}

@app.get("/teams", response_model=List[TeamResponse])
async def get_teams(db: MySQLManager = Depends(get_db)):
    """Get all teams"""
    teams = await db.fetch("SELECT * FROM teams ORDER BY name LIMIT 50")
    return [TeamResponse(**team) for team in teams]

@app.get("/fixtures/upcoming", response_model=List[FixtureResponse])
async def get_upcoming_fixtures(db: MySQLManager = Depends(get_db)):
    """Get upcoming fixtures"""
    query = """
    SELECT 
        f.id, f.match_date, f.status, f.home_goals, f.away_goals,
        ht.id as home_id, ht.name as home_name, ht.country as home_country, ht.logo_url as home_logo,
        at.id as away_id, at.name as away_name, at.country as away_country, at.logo_url as away_logo
    FROM fixtures f
    JOIN teams ht ON f.home_team_id = ht.id
    JOIN teams at ON f.away_team_id = at.id
    WHERE f.match_date > NOW() AND f.match_date < NOW() + INTERVAL '7 days'
    ORDER BY f.match_date
    LIMIT 20
    """
    
    fixtures = await db.fetch(query)
    
    result = []
    for fixture in fixtures:
        result.append(FixtureResponse(
            id=fixture["id"],
            home_team=TeamResponse(
                id=fixture["home_id"],
                name=fixture["home_name"],
                country=fixture["home_country"],
                logo_url=fixture["home_logo"]
            ),
            away_team=TeamResponse(
                id=fixture["away_id"],
                name=fixture["away_name"],
                country=fixture["away_country"],
                logo_url=fixture["away_logo"]
            ),
            match_date=fixture["match_date"],
            status=fixture["status"],
            home_goals=fixture["home_goals"],
            away_goals=fixture["away_goals"]
        ))
    
    return result

@app.get("/fixtures/{fixture_id}/predict", response_model=PredictionResponse)
async def predict_fixture(fixture_id: int, db: MySQLManager = Depends(get_db)):
    """Get prediction for a specific fixture"""
    # Get fixture details
    fixture = await db.fetchrow("""
        SELECT f.*, ht.name as home_name, at.name as away_name
        FROM fixtures f
        JOIN teams ht ON f.home_team_id = ht.id
        JOIN teams at ON f.away_team_id = at.id
        WHERE f.id = $1
    """, fixture_id)
    
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    
    # Check if prediction already exists
    existing_prediction = await db.fetchrow(
        "SELECT * FROM predictions WHERE fixture_id = $1 ORDER BY created_at DESC LIMIT 1",
        fixture_id
    )
    
    if existing_prediction:
        return PredictionResponse(
            fixture_id=fixture_id,
            home_team=fixture["home_name"],
            away_team=fixture["away_name"],
            home_win_prob=float(existing_prediction["home_win_prob"]),
            draw_prob=float(existing_prediction["draw_prob"]),
            away_win_prob=float(existing_prediction["away_win_prob"]),
            expected_home_goals=float(existing_prediction["predicted_home_goals"]),
            expected_away_goals=float(existing_prediction["predicted_away_goals"]),
            confidence=float(existing_prediction["confidence_score"]),
            created_at=existing_prediction["created_at"]
        )
    
    # Generate new prediction
    try:
        prediction = await predictor.predict_match(
            fixture["home_team_id"], 
            fixture["away_team_id"]
        )
        
        # Store prediction
        await db.execute("""
            INSERT INTO predictions (
                fixture_id, model_name, home_win_prob, draw_prob, away_win_prob,
                predicted_home_goals, predicted_away_goals, confidence_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """, 
        fixture_id, "hybrid", 
        prediction["home_win_prob"], prediction["draw_prob"], prediction["away_win_prob"],
        prediction["expected_home_goals"], prediction["expected_away_goals"], 
        prediction["confidence"]
        )
        
        return PredictionResponse(
            fixture_id=fixture_id,
            home_team=fixture["home_name"],
            away_team=fixture["away_name"],
            home_win_prob=prediction["home_win_prob"],
            draw_prob=prediction["draw_prob"],
            away_win_prob=prediction["away_win_prob"],
            expected_home_goals=prediction["expected_home_goals"],
            expected_away_goals=prediction["expected_away_goals"],
            confidence=prediction["confidence"],
            created_at=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/fixtures/{fixture_id}/odds", response_model=List[OddsResponse])
async def get_fixture_odds(fixture_id: int, db: MySQLManager = Depends(get_db)):
    """Get odds for a specific fixture"""
    odds = await db.fetch(
        "SELECT * FROM odds WHERE fixture_id = $1 ORDER BY created_at DESC",
        fixture_id
    )
    
    return [OddsResponse(
        fixture_id=odd["fixture_id"],
        bookmaker=odd["bookmaker"],
        home_odds=float(odd["home_odds"]),
        draw_odds=float(odd["draw_odds"]),
        away_odds=float(odd["away_odds"])
    ) for odd in odds]

@app.get("/predictions/recent", response_model=List[PredictionResponse])
async def get_recent_predictions(db: MySQLManager = Depends(get_db)):
    """Get recent predictions"""
    query = """
    SELECT 
        p.*, f.match_date,
        ht.name as home_name, at.name as away_name
    FROM predictions p
    JOIN fixtures f ON p.fixture_id = f.id
    JOIN teams ht ON f.home_team_id = ht.id
    JOIN teams at ON f.away_team_id = at.id
    ORDER BY p.created_at DESC
    LIMIT 10
    """
    
    predictions = await db.fetch(query)
    
    return [PredictionResponse(
        fixture_id=pred["fixture_id"],
        home_team=pred["home_name"],
        away_team=pred["away_name"],
        home_win_prob=float(pred["home_win_prob"]),
        draw_prob=float(pred["draw_prob"]),
        away_win_prob=float(pred["away_win_prob"]),
        expected_home_goals=float(pred["predicted_home_goals"]),
        expected_away_goals=float(pred["predicted_away_goals"]),
        confidence=float(pred["confidence_score"]),
        created_at=pred["created_at"]
    ) for pred in predictions]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)