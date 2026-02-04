-- Football Prediction System MySQL Schema

-- Teams table
CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    api_id INT UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50),
    logo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leagues table
CREATE TABLE leagues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    api_id INT UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50),
    season INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fixtures table
CREATE TABLE fixtures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    api_id INT UNIQUE NOT NULL,
    league_id INT,
    home_team_id INT,
    away_team_id INT,
    match_date DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    home_goals INT,
    away_goals INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (league_id) REFERENCES leagues(id),
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

-- Team statistics table
CREATE TABLE team_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT,
    league_id INT,
    season INT,
    matches_played INT DEFAULT 0,
    wins INT DEFAULT 0,
    draws INT DEFAULT 0,
    losses INT DEFAULT 0,
    goals_for INT DEFAULT 0,
    goals_against INT DEFAULT 0,
    home_wins INT DEFAULT 0,
    home_draws INT DEFAULT 0,
    home_losses INT DEFAULT 0,
    away_wins INT DEFAULT 0,
    away_draws INT DEFAULT 0,
    away_losses INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (league_id) REFERENCES leagues(id),
    UNIQUE KEY unique_team_league_season (team_id, league_id, season)
);

-- Odds table
CREATE TABLE odds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fixture_id INT,
    bookmaker VARCHAR(50),
    home_odds DECIMAL(5,2),
    draw_odds DECIMAL(5,2),
    away_odds DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fixture_id) REFERENCES fixtures(id)
);

-- Predictions table
CREATE TABLE predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fixture_id INT,
    model_name VARCHAR(50),
    home_win_prob DECIMAL(5,4),
    draw_prob DECIMAL(5,4),
    away_win_prob DECIMAL(5,4),
    predicted_home_goals DECIMAL(3,2),
    predicted_away_goals DECIMAL(3,2),
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fixture_id) REFERENCES fixtures(id)
);

-- Indexes for performance
CREATE INDEX idx_fixtures_date ON fixtures(match_date);
CREATE INDEX idx_fixtures_teams ON fixtures(home_team_id, away_team_id);
CREATE INDEX idx_team_stats_team ON team_stats(team_id);
CREATE INDEX idx_odds_fixture ON odds(fixture_id);
CREATE INDEX idx_predictions_fixture ON predictions(fixture_id);