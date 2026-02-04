import React, { useState, useEffect, useRef, useCallback } from 'react';

const YouTubePlayer = ({ movie, onReady }) => {
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [showControls, setShowControls] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPoster, setShowPoster] = useState(true);
  
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const timeUpdateInterval = useRef(null);

  const startTimeUpdate = useCallback(() => {
    timeUpdateInterval.current = setInterval(() => {
      if (player) {
        setCurrentTime(player.getCurrentTime());
      }
    }, 1000);
  }, [player]);

  const stopTimeUpdate = useCallback(() => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }
  }, []);

  const initializePlayer = useCallback(() => {
    if (!movie.videoSource.youtubeId || !playerRef.current) return;

    const ytPlayer = new window.YT.Player(playerRef.current, {
      videoId: movie.videoSource.youtubeId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
        cc_load_policy: 0,
        enablejsapi: 1
      },
      events: {
        onReady: (event) => {
          setPlayer(event.target);
          setDuration(event.target.getDuration());
          setIsLoaded(true);
          onReady && onReady(event.target);
        },
        onStateChange: (event) => {
          setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          if (event.data === window.YT.PlayerState.PLAYING) {
            setShowPoster(false);
            startTimeUpdate();
          } else {
            stopTimeUpdate();
          }
        }
      }
    });
  }, [movie.videoSource.youtubeId, onReady, startTimeUpdate, stopTimeUpdate]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (player) {
        player.destroy();
      }
      stopTimeUpdate();
    };
  }, [initializePlayer, player, stopTimeUpdate]);

  const togglePlay = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
      setShowPoster(false);
    }
  };

  const handleSeek = (e) => {
    if (!player) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = percent * duration;
    player.seekTo(seekTime);
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-lg overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {showPoster && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
          <img 
            src={movie.poster} 
            alt={movie.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          
          <button
            onClick={togglePlay}
            className="absolute z-30 w-20 h-20 bg-netflix-red bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-200"
          >
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          
          <div className="absolute bottom-6 left-6 right-6 z-30">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{movie.title}</h2>
            <p className="text-netflix-gray-300 text-sm md:text-base mb-2">{movie.category?.name}</p>
            <p className="text-netflix-gray-400 text-sm line-clamp-3">{movie.description}</p>
          </div>
        </div>
      )}

      <div 
        ref={playerRef}
        className="w-full h-full"
        style={{ display: isLoaded ? 'block' : 'none' }}
      />

      {!isLoaded && (
        <div className="absolute inset-0 bg-netflix-gray-800 animate-pulse flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {!showPoster && (
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          <div 
            className="w-full h-1 bg-netflix-gray-600 rounded-full mb-4 cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-netflix-red rounded-full transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="text-white hover:text-netflix-red transition-colors duration-200"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-netflix-gray-600 rounded-full appearance-none slider"
                />
              </div>

              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;