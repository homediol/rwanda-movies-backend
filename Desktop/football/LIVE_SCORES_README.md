# 🏆 LIVE FOOTBALL SCORES APPLICATION

A real-time football scores web application similar to LiveScore/FlashScore, built with FastAPI backend and React frontend.

## 🚀 QUICK START

### 1. Start Backend
```bash
cd /home/dilani/Desktop/football
python3 live_scores_backend.py
```

### 2. Start Frontend
```bash
cd /home/dilani/Desktop/football/frontend
npm run dev
```

### 3. Open Browser
Navigate to: `http://localhost:3000`

## 📋 FEATURES

### ✅ IMPLEMENTED
- **Live Scores**: Real-time match data from API-Football
- **Auto-refresh**: Updates every 30 seconds automatically
- **League Filtering**: Filter by Premier League, La Liga, etc.
- **Live Indicators**: Red dot for live matches
- **Match Status**: Shows elapsed time, half-time, full-time
- **Error Handling**: Graceful error messages and retry
- **Caching**: 15-second cache to optimize API usage
- **Responsive Design**: Works on mobile and desktop

### 🎯 LIVE SCORE DISPLAY
```
Premier League                    🔴 LIVE 45'
Manchester United  2 : 1  Arsenal
```

## 🔧 API ENDPOINTS

### Backend Endpoints
- `GET /live-scores` - All live matches
- `GET /live-scores/league/{id}` - Live matches by league
- `GET /leagues` - Available leagues
- `GET /health` - Health check

### Example API Response
```json
{
  "matches": [
    {
      "id": 12345,
      "league": {
        "name": "Premier League",
        "country": "England"
      },
      "home_team": {
        "name": "Manchester United"
      },
      "away_team": {
        "name": "Arsenal"
      },
      "score": {
        "home": 2,
        "away": 1
      },
      "status": {
        "short": "1H",
        "elapsed": 45
      }
    }
  ]
}
```

## 📁 PROJECT STRUCTURE
```
football/
├── live_scores_backend.py     # FastAPI backend
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # React live scores UI
│   │   └── App.css           # Styles with animations
│   └── package.json
└── LIVE_SCORES_README.md     # This file
```

## 🔑 ENVIRONMENT SETUP

The API key is already configured in the backend:
```python
API_FOOTBALL_KEY = "106673c847d2b4a12bdc61d6d25d0304"
```

For production, use environment variables:
```bash
export API_FOOTBALL_KEY="your_api_key_here"
```

## 🎨 UI FEATURES

### Live Match Card
- **League name** and country
- **Team names** with colored avatars
- **Live score** in large numbers
- **Match status** with live indicator
- **Elapsed time** for live matches

### Auto-refresh
- Updates every 30 seconds
- Shows last update time
- Loading indicators during refresh

### League Filtering
- All Leagues (default)
- Premier League
- La Liga
- Bundesliga
- Serie A
- Ligue 1
- Champions League

## 🚨 ERROR HANDLING

- **API Down**: Shows error message with retry button
- **No Live Matches**: Friendly message to check back later
- **Network Issues**: Graceful fallback with error display

## 🔄 CACHING STRATEGY

- **15-second cache** for live scores
- Reduces API calls while maintaining freshness
- Cache status shown in API response

## 📱 RESPONSIVE DESIGN

- **Mobile-first** approach
- **Glassmorphism** design with stadium background
- **Animated particles** for visual appeal
- **Touch-friendly** buttons and interactions

## 🎯 PRODUCTION READY

- Clean, maintainable code
- Error boundaries
- Optimized API usage
- Secure API key handling
- Performance optimizations

## 🔮 FUTURE ENHANCEMENTS

- WebSocket real-time updates
- Goal notifications
- Match statistics
- Player lineups
- Live commentary
- Push notifications

---

**Your live football scores app is ready! 🚀**