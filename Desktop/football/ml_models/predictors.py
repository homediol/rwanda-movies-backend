import numpy as np
import pandas as pd
from scipy.stats import poisson
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
from typing import Dict, Tuple, List
from data_bot.database import DatabaseManager
from ml_models.feature_engineering import FeatureEngineer

class PoissonModel:
    def predict_match(self, home_avg: float, away_avg: float, home_def: float, away_def: float) -> Dict:
        """Predict match using Poisson distribution"""
        # Adjust for home advantage (typically 1.3x)
        home_expected = home_avg * away_def * 1.3
        away_expected = away_avg * home_def
        
        # Calculate probabilities for different scorelines
        max_goals = 5
        prob_matrix = np.zeros((max_goals + 1, max_goals + 1))
        
        for i in range(max_goals + 1):
            for j in range(max_goals + 1):
                prob_matrix[i][j] = poisson.pmf(i, home_expected) * poisson.pmf(j, away_expected)
        
        # Calculate match outcome probabilities
        home_win = np.sum(np.tril(prob_matrix, -1))
        draw = np.sum(np.diag(prob_matrix))
        away_win = np.sum(np.triu(prob_matrix, 1))
        
        return {
            "home_win_prob": home_win,
            "draw_prob": draw,
            "away_win_prob": away_win,
            "expected_home_goals": home_expected,
            "expected_away_goals": away_expected
        }

class MLPredictor:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.feature_names = []
        self.is_trained = False
    
    async def prepare_training_data(self, db: DatabaseManager) -> Tuple[pd.DataFrame, pd.Series]:
        """Prepare training data from historical matches"""
        query = """
        SELECT 
            f.home_team_id, f.away_team_id, f.home_goals, f.away_goals,
            CASE 
                WHEN f.home_goals > f.away_goals THEN 0  -- Home win
                WHEN f.home_goals = f.away_goals THEN 1  -- Draw
                ELSE 2  -- Away win
            END as result
        FROM fixtures f
        WHERE f.status = 'FT' AND f.home_goals IS NOT NULL
        ORDER BY f.match_date DESC
        LIMIT 1000
        """
        
        matches = await db.fetch(query)
        feature_engineer = FeatureEngineer(db)
        
        features_list = []
        results = []
        
        for match in matches:
            try:
                features = await feature_engineer.create_match_features(
                    match["home_team_id"], match["away_team_id"]
                )
                features_list.append(features)
                results.append(match["result"])
            except Exception as e:
                continue
        
        df_features = pd.DataFrame(features_list)
        df_features = df_features.fillna(0)
        
        return df_features, pd.Series(results)
    
    async def train(self, db: DatabaseManager):
        """Train the ML model"""
        X, y = await self.prepare_training_data(db)
        
        if len(X) < 50:
            raise ValueError("Insufficient training data")
        
        self.feature_names = X.columns.tolist()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        
        # Calculate accuracy
        accuracy = self.model.score(X_test_scaled, y_test)
        print(f"Model accuracy: {accuracy:.3f}")
        
        self.is_trained = True
    
    async def predict(self, features: Dict) -> Dict:
        """Make prediction for a match"""
        if not self.is_trained:
            raise ValueError("Model not trained")
        
        # Convert features to DataFrame
        feature_df = pd.DataFrame([features])
        feature_df = feature_df.reindex(columns=self.feature_names, fill_value=0)
        
        # Scale features
        features_scaled = self.scaler.transform(feature_df)
        
        # Get probabilities
        probabilities = self.model.predict_proba(features_scaled)[0]
        
        return {
            "home_win_prob": probabilities[0],
            "draw_prob": probabilities[1],
            "away_win_prob": probabilities[2]
        }
    
    def save_model(self, filepath: str):
        """Save trained model"""
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'is_trained': self.is_trained
        }, filepath)
    
    def load_model(self, filepath: str):
        """Load trained model"""
        data = joblib.load(filepath)
        self.model = data['model']
        self.scaler = data['scaler']
        self.feature_names = data['feature_names']
        self.is_trained = data['is_trained']

class HybridPredictor:
    def __init__(self):
        self.poisson_model = PoissonModel()
        self.ml_model = MLPredictor()
        self.feature_engineer = None
    
    async def initialize(self, db: DatabaseManager):
        """Initialize the hybrid predictor"""
        self.feature_engineer = FeatureEngineer(db)
        await self.ml_model.train(db)
    
    async def predict_match(self, home_team_id: int, away_team_id: int) -> Dict:
        """Make hybrid prediction combining Poisson and ML models"""
        # Get features
        features = await self.feature_engineer.create_match_features(home_team_id, away_team_id)
        
        # Poisson prediction
        poisson_pred = self.poisson_model.predict_match(
            features["home_avg_goals_for"],
            features["away_avg_goals_for"],
            features["home_avg_goals_against"],
            features["away_avg_goals_against"]
        )
        
        # ML prediction
        ml_pred = await self.ml_model.predict(features)
        
        # Combine predictions (weighted average)
        poisson_weight = 0.4
        ml_weight = 0.6
        
        combined_pred = {
            "home_win_prob": (poisson_pred["home_win_prob"] * poisson_weight + 
                            ml_pred["home_win_prob"] * ml_weight),
            "draw_prob": (poisson_pred["draw_prob"] * poisson_weight + 
                        ml_pred["draw_prob"] * ml_weight),
            "away_win_prob": (poisson_pred["away_win_prob"] * poisson_weight + 
                            ml_pred["away_win_prob"] * ml_weight),
            "expected_home_goals": poisson_pred["expected_home_goals"],
            "expected_away_goals": poisson_pred["expected_away_goals"],
            "confidence": min(max(features["home_form_points"], features["away_form_points"]) / 15, 1.0)
        }
        
        return combined_pred