# Football Match Prediction System

## Architecture Overview
```
Data Sources (APIs) → Data Bot → PostgreSQL → FastAPI Backend → React Frontend
```

## Project Structure
```
football/
├── data_bot/           # Python scripts for data fetching
├── database/           # Database schema and migrations
├── backend/           # FastAPI application
├── frontend/          # React application
├── ml_models/         # Prediction models
├── config/           # Configuration files
└── docker-compose.yml # Container orchestration
```

## Tech Stack
- **Data Sources**: API-Football, Odds-API
- **Data Bot**: Python with asyncio/aiohttp
- **Database**: PostgreSQL
- **Backend**: FastAPI
- **Frontend**: React + Vite
- **ML**: scikit-learn, pandas, numpy
- **Deployment**: Docker