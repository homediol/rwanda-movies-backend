import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://localhost:8001';

const App = () => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'upcoming'
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeagues();
    fetchLiveScores();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLiveScores, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leagues`);
      setLeagues(response.data);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  const fetchLiveScores = async (leagueId = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = leagueId 
        ? `${API_BASE_URL}/live-scores/league/${leagueId}`
        : `${API_BASE_URL}/live-scores`;
      
      const response = await axios.get(url);
      setLiveMatches(response.data.live_matches || []);
      setUpcomingMatches(response.data.upcoming_matches || []);
      setLastUpdate(new Date());
    } catch (error) {
      setError('Failed to fetch live scores');
      console.error('Error fetching live scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeagueFilter = (leagueId) => {
    setSelectedLeague(leagueId);
    if (leagueId) {
      fetchLiveScores(leagueId);
    } else {
      fetchLiveScores();
    }
  };

  const formatUpcomingTime = (dateString) => {
    const matchDate = new Date(dateString);
    const now = new Date();
    const diffMs = matchDate - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `in ${diffHours}h ${diffMins}m`;
    } else if (diffMins > 0) {
      return `in ${diffMins}m`;
    } else {
      return 'Starting soon';
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      '1H': 'First Half',
      '2H': 'Second Half',
      'HT': 'Half Time',
      'FT': 'Full Time',
      'ET': 'Extra Time',
      'P': 'Penalties',
      'LIVE': 'Live'
    };
    return statusMap[status.short] || status.long || status.short;
  };

  const isLive = (status) => {
    return ['1H', '2H', 'ET', 'LIVE'].includes(status.short);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Stadium Background */}
      <div className="stadium-bg"></div>
      
      {/* Animated Background */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>
      <div className="wave"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="text-center py-12 px-4">
          <h1 className="text-6xl font-extrabold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              ⚽ LIVE SCORES
            </span>
          </h1>
          <p className="text-xl text-blue-200 font-light">Real-time Football Updates</p>
          {lastUpdate && (
            <p className="text-sm text-blue-300 mt-2">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </header>

        <main className="max-w-6xl mx-auto px-6 pb-20">
          {/* Tabs */}
          <div className="mb-8">
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => setActiveTab('live')}
                className={`px-6 py-3 rounded-full font-semibold transition-all ${
                  activeTab === 'live' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                🔴 Live Matches ({liveMatches.length})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-3 rounded-full font-semibold transition-all ${
                  activeTab === 'upcoming' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                📅 Upcoming ({upcomingMatches.length})
              </button>
            </div>
            
            {/* League Filter */}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => handleLeagueFilter(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedLeague 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                All Leagues
              </button>
              {leagues.map(league => (
                <button
                  key={league.id}
                  onClick={() => handleLeagueFilter(league.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedLeague === league.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {league.name}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white">Loading live scores...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 text-center">
              <p className="text-red-200">{error}</p>
              <button 
                onClick={() => fetchLiveScores(selectedLeague)}
                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Live Matches */}
          {!loading && activeTab === 'live' && liveMatches.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-white text-xl">No live matches at the moment</p>
              <p className="text-blue-200 mt-2">Check back later for live updates</p>
            </div>
          )}

          {/* Upcoming Matches */}
          {!loading && activeTab === 'upcoming' && upcomingMatches.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-white text-xl">No upcoming matches today</p>
              <p className="text-blue-200 mt-2">Check back tomorrow for more fixtures</p>
            </div>
          )}

          {/* Matches Grid */}
          <div className="space-y-4">
            {(activeTab === 'live' ? liveMatches : upcomingMatches).map(match => (
              <div key={match.id} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
                {/* League Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300 text-sm font-medium">{match.league.name}</span>
                    <span className="text-blue-200 text-xs">{match.league.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeTab === 'live' ? (
                      <>
                        {isLive(match.status) && (
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          isLive(match.status) 
                            ? 'bg-red-500/20 text-red-300' 
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {getStatusDisplay(match.status)}
                        </span>
                        {match.status.elapsed && (
                          <span className="text-white font-bold">
                            {match.status.elapsed}'
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-green-300 text-sm font-medium">
                        {formatUpcomingTime(match.date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Score */}
                <div className="flex items-center justify-between">
                  {/* Home Team */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {match.home_team.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-white font-semibold">{match.home_team.name}</span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-4 mx-6">
                    <div className="text-center">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-white">
                          {match.score.home ?? '-'}
                        </span>
                        <span className="text-2xl text-white/60">:</span>
                        <span className="text-3xl font-bold text-white">
                          {match.score.away ?? '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <span className="text-white font-semibold">{match.away_team.name}</span>
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {match.away_team.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;