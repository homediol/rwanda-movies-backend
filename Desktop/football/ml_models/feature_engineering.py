import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
from data_bot.mysql_database import MySQLManager

class FeatureEngineer:
    def __init__(self, db: MySQLManager):
        self.db = db
    
    async def get_team_form(self, team_id: int, n_matches: int = 5) -> Dict:
        """Get team's last N matches performance"""
        query = """
        SELECT 
            CASE 
                WHEN home_team_id = $1 THEN 
                    CASE 
                        WHEN home_goals > away_goals THEN 3
                        WHEN home_goals = away_goals THEN 1
                        ELSE 0
                    END
                ELSE 
                    CASE 
                        WHEN away_goals > home_goals THEN 3
                        WHEN away_goals = home_goals THEN 1
                        ELSE 0
                    END
            END as points,
            CASE 
                WHEN home_team_id = $1 THEN home_goals
                ELSE away_goals
            END as goals_for,
            CASE 
                WHEN home_team_id = $1 THEN away_goals
                ELSE home_goals
            END as goals_against,
            match_date
        FROM fixtures 
        WHERE (home_team_id = $1 OR away_team_id = $1) 
            AND status = 'FT'
            AND home_goals IS NOT NULL
        ORDER BY match_date DESC 
        LIMIT $2
        """
        
        matches = await self.db.fetch(query, team_id, n_matches)
        
        if not matches:
            return {"form_points": 0, "avg_goals_for": 0, "avg_goals_against": 0}
        
        total_points = sum(match["points"] for match in matches)
        avg_goals_for = sum(match["goals_for"] for match in matches) / len(matches)
        avg_goals_against = sum(match["goals_against"] for match in matches) / len(matches)
        
        return {
            "form_points": total_points,
            "avg_goals_for": avg_goals_for,
            "avg_goals_against": avg_goals_against,
            "matches_played": len(matches)
        }
    
    async def get_head_to_head(self, home_team_id: int, away_team_id: int, n_matches: int = 5) -> Dict:
        """Get head-to-head statistics"""
        query = """
        SELECT home_goals, away_goals, match_date
        FROM fixtures 
        WHERE ((home_team_id = $1 AND away_team_id = $2) 
               OR (home_team_id = $2 AND away_team_id = $1))
            AND status = 'FT'
            AND home_goals IS NOT NULL
        ORDER BY match_date DESC 
        LIMIT $3
        """
        
        matches = await self.db.fetch(query, home_team_id, away_team_id, n_matches)
        
        if not matches:
            return {"h2h_home_wins": 0, "h2h_draws": 0, "h2h_away_wins": 0}
        
        home_wins = draws = away_wins = 0
        
        for match in matches:
            if match["home_goals"] > match["away_goals"]:
                home_wins += 1
            elif match["home_goals"] == match["away_goals"]:
                draws += 1
            else:
                away_wins += 1
        
        return {
            "h2h_home_wins": home_wins,
            "h2h_draws": draws,
            "h2h_away_wins": away_wins,
            "h2h_matches": len(matches)
        }
    
    async def get_home_away_form(self, team_id: int, is_home: bool, n_matches: int = 5) -> Dict:
        """Get home/away specific form"""
        if is_home:
            query = """
            SELECT 
                CASE 
                    WHEN home_goals > away_goals THEN 3
                    WHEN home_goals = away_goals THEN 1
                    ELSE 0
                END as points,
                home_goals as goals_for,
                away_goals as goals_against
            FROM fixtures 
            WHERE home_team_id = $1 AND status = 'FT' AND home_goals IS NOT NULL
            ORDER BY match_date DESC 
            LIMIT $2
            """
        else:
            query = """
            SELECT 
                CASE 
                    WHEN away_goals > home_goals THEN 3
                    WHEN away_goals = home_goals THEN 1
                    ELSE 0
                END as points,
                away_goals as goals_for,
                home_goals as goals_against
            FROM fixtures 
            WHERE away_team_id = $1 AND status = 'FT' AND home_goals IS NOT NULL
            ORDER BY match_date DESC 
            LIMIT $2
            """
        
        matches = await self.db.fetch(query, team_id, n_matches)
        
        if not matches:
            return {"points": 0, "avg_goals_for": 0, "avg_goals_against": 0}
        
        total_points = sum(match["points"] for match in matches)
        avg_goals_for = sum(match["goals_for"] for match in matches) / len(matches)
        avg_goals_against = sum(match["goals_against"] for match in matches) / len(matches)
        
        return {
            "points": total_points,
            "avg_goals_for": avg_goals_for,
            "avg_goals_against": avg_goals_against
        }
    
    async def create_match_features(self, home_team_id: int, away_team_id: int) -> Dict:
        """Create comprehensive feature set for a match"""
        # Get team forms
        home_form = await self.get_team_form(home_team_id)
        away_form = await self.get_team_form(away_team_id)
        
        # Get home/away specific forms
        home_home_form = await self.get_home_away_form(home_team_id, True)
        away_away_form = await self.get_home_away_form(away_team_id, False)
        
        # Get head-to-head
        h2h = await self.get_head_to_head(home_team_id, away_team_id)
        
        # Get team stats
        home_stats = await self.db.fetchrow(
            "SELECT * FROM team_stats WHERE team_id = $1 ORDER BY updated_at DESC LIMIT 1",
            home_team_id
        )
        away_stats = await self.db.fetchrow(
            "SELECT * FROM team_stats WHERE team_id = $1 ORDER BY updated_at DESC LIMIT 1", 
            away_team_id
        )
        
        features = {
            # Form features
            "home_form_points": home_form["form_points"],
            "away_form_points": away_form["form_points"],
            "home_avg_goals_for": home_form["avg_goals_for"],
            "away_avg_goals_for": away_form["avg_goals_for"],
            "home_avg_goals_against": home_form["avg_goals_against"],
            "away_avg_goals_against": away_form["avg_goals_against"],
            
            # Home/Away form
            "home_home_points": home_home_form["points"],
            "away_away_points": away_away_form["points"],
            "home_home_goals_for": home_home_form["avg_goals_for"],
            "away_away_goals_for": away_away_form["avg_goals_for"],
            
            # Head-to-head
            "h2h_home_wins": h2h["h2h_home_wins"],
            "h2h_draws": h2h["h2h_draws"],
            "h2h_away_wins": h2h["h2h_away_wins"],
            
            # Season stats
            "home_win_rate": home_stats["wins"] / max(home_stats["matches_played"], 1) if home_stats else 0,
            "away_win_rate": away_stats["wins"] / max(away_stats["matches_played"], 1) if away_stats else 0,
            "home_goals_per_game": home_stats["goals_for"] / max(home_stats["matches_played"], 1) if home_stats else 0,
            "away_goals_per_game": away_stats["goals_for"] / max(away_stats["matches_played"], 1) if away_stats else 0,
        }
        
        return features