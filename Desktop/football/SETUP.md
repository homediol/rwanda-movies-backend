# Football Prediction System - Setup Guide

## Quick Start

### 1. Get API Keys
- **API-Football**: Sign up at https://rapidapi.com/api-sports/api/api-football
- **Odds-API**: Sign up at https://the-odds-api.com

### 2. Environment Setup
```bash
# Clone and setup
cp .env.example .env
# Edit .env with your API keys

# Install Python dependencies
pip install -r requirements.txt

# Setup database
docker run -d --name postgres \
  -e POSTGRES_DB=football_db \
  -e POSTGRES_USER=football_user \
  -e POSTGRES_PASSWORD=football_pass \
  -p 5432:5432 postgres:15

# Initialize database
psql -h localhost -U football_user -d football_db -f database/schema.sql
```

### 3. Run Components

**Data Bot (Initial sync):**
```bash
cd data_bot && python main.py
```

**Backend API:**
```bash
cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend && npm install && npm run dev
```

### 4. Docker (Recommended)
```bash
docker-compose up -d
```

## API Endpoints

- `GET /fixtures/upcoming` - Get upcoming matches
- `GET /fixtures/{id}/predict` - Get match prediction
- `GET /fixtures/{id}/odds` - Get betting odds
- `GET /predictions/recent` - Recent predictions

## Free Data Sources

### Alternative APIs (if budget is limited):
- **Football-Data.org**: Free tier with basic data
- **OpenLigaDB**: Free German league data
- **TheSportsDB**: Free sports data API

### Web Scraping Options:
- ESPN scores
- BBC Sport
- Sky Sports (check robots.txt)

## Scaling & Best Practices

### Performance Optimization:
- Use Redis for caching predictions
- Implement database connection pooling
- Add API rate limiting
- Use CDN for static assets

### Reliability:
- Add health checks to all services
- Implement circuit breakers for API calls
- Use database migrations
- Add comprehensive logging

### Risk Management:
- Never bet more than you can afford to lose
- Use predictions as guidance, not guarantees
- Implement bankroll management
- Track prediction accuracy over time

## Production Deployment

### AWS Setup:
```bash
# RDS for PostgreSQL
# ECS/Fargate for containers
# CloudFront for frontend
# Lambda for scheduled tasks
```

### Monitoring:
- Use Prometheus + Grafana
- Set up alerts for API failures
- Monitor prediction accuracy
- Track API usage limits