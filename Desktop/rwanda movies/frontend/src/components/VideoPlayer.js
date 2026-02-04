import React, { useState, useRef, useEffect } from 'react';
import { getYouTubeEmbedUrl } from '../utils/helpers';

const VideoPlayer = ({ movie }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [networkSpeed, setNetworkSpeed] = useState('fast');
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const videoRef = useRef(null);

  const storageKey = `video_progress_${movie.id}`;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    const savedProgress = localStorage.getItem(storageKey);
    if (savedProgress) {
      const { time, rate } = JSON.parse(savedProgress);
      setCurrentTime(time);
      setPlaybackRate(rate);
    }
    
    detectNetworkSpeed();
    
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [storageKey]);

  const detectNetworkSpeed = () => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType;
      
      if (effectiveType === '4g') {
        setNetworkSpeed('fast');
        setQuality('hd720');
      } else if (effectiveType === '3g') {
        setNetworkSpeed('medium');
        setQuality('medium');
      } else {
        setNetworkSpeed('slow');
        setQuality('small');
      }
    }
  };

  const getYouTubeQuality = () => {
    const qualityMap = {
      'hd720': 'hd720',
      'medium': 'medium', 
      'small': 'small',
      'auto': 'default'
    };
    return qualityMap[quality] || 'default';
  };

  const saveProgress = (time, rate = playbackRate) => {
    localStorage.setItem(storageKey, JSON.stringify({ time, rate, timestamp: Date.now() }));
  };

  const handleVideoLoad = (video) => {
    if (currentTime > 0) {
      video.currentTime = currentTime;
    }
    video.playbackRate = playbackRate;
    if (autoplay) {
      video.play();
    }
  };

  const handleTimeUpdate = (video) => {
    if (!isDragging) {
      setCurrentTime(video.currentTime);
      saveProgress(video.currentTime);
    }
  };

  const handleLoadedMetadata = (video) => {
    if (video && video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
  };

  const handleCanPlay = (video) => {
    if (video && video.duration && !isNaN(video.duration) && duration === 0) {
      setDuration(video.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      saveProgress(newTime);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleBuffering = (buffering) => {
    setIsBuffering(buffering);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    saveProgress(currentTime, rate);
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"setPlaybackRate","args":[${rate}]}`,
        '*'
      );
    }
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
    if (iframeRef.current) {
      const command = isPlaying ? 'pauseVideo' : 'playVideo';
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"${command}","args":[]}`,
        '*'
      );
      setIsPlaying(!isPlaying);
    }
  };

  const increaseSpeed = () => {
    const newRate = Math.min(2, playbackRate + 0.25);
    changeSpeed(newRate);
  };

  const decreaseSpeed = () => {
    const newRate = Math.max(0.5, playbackRate - 0.25);
    changeSpeed(newRate);
  };

  if (movie.videoSource.type === 'youtube') {
    return (
      <div className="w-full">
        <div 
          ref={containerRef}
          className={`relative w-full bg-black ${isFullscreen ? 'h-screen' : ''}`}
          style={{ paddingBottom: isFullscreen ? '0' : '56.25%', height: isFullscreen ? '100vh' : 0 }}
        >
          {isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-10 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Exit Fullscreen
            </button>
          )}
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <iframe
              ref={iframeRef}
              src={`${getYouTubeEmbedUrl(movie.videoSource.youtubeId)}&enablejsapi=1&controls=0&modestbranding=1&vq=${getYouTubeQuality()}${autoplay ? '&autoplay=1' : ''}`}
              title={movie.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-t-lg"
              style={{ pointerEvents: 'none' }}
            />
          </div>
        </div>

        <div className="bg-gray-900 p-4 rounded-b-lg">
          <div className="mb-4">
            <div className="flex items-center justify-between text-white text-sm mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div 
              className="relative w-full h-2 bg-gray-600 rounded-full cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              >
                <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"></div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-6 mb-4">
            <button
              onClick={togglePlayPause}
              className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white text-2xl transition-all duration-200 shadow-lg"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={decreaseSpeed}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white font-bold transition-all duration-200 shadow-lg"
                title="Kugabanya (Slow Down)"
              >
                -
              </button>
              <div className="text-white text-center min-w-[60px]">
                <div className="text-lg font-bold">{playbackRate}x</div>
                <div className="text-xs opacity-75">Speed</div>
              </div>
              <button
                onClick={increaseSpeed}
                className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white font-bold transition-all duration-200 shadow-lg"
                title="Kwihutisha (Speed Up)"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAutoplay(!autoplay)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${autoplay ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                Autoplay: {autoplay ? 'ON' : 'OFF'}
              </button>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="px-3 py-2 bg-gray-700 text-white rounded-lg"
              >
                <option value="auto">Auto Quality</option>
                <option value="hd720">HD (720p)</option>
                <option value="medium">Medium (480p)</option>
                <option value="small">Low (240p)</option>
              </select>
              <span className="text-sm text-gray-300">Network: {networkSpeed}</span>
            </div>
            <button
              onClick={toggleFullscreen}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all duration-200 shadow-lg"
            >
              {isFullscreen ? '🗗 Exit Fullscreen' : '🗖 Fullscreen'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative w-full" style={{ paddingBottom: '56.25%', height: 0 }}>
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10" style={{ pointerEvents: 'none' }}>
            <div className="text-white">Buffering...</div>
          </div>
        )}
        <video
          ref={videoRef}
          src={movie.videoSource.url}
          autoPlay={autoplay}
          className="absolute top-0 left-0 w-full h-full rounded-t-lg bg-black"
          onLoadedData={() => handleVideoLoad(videoRef.current)}
          onTimeUpdate={() => handleTimeUpdate(videoRef.current)}
          onLoadedMetadata={() => handleLoadedMetadata(videoRef.current)}
          onCanPlay={() => handleCanPlay(videoRef.current)}
          onDurationChange={() => handleLoadedMetadata(videoRef.current)}
          onPlay={handlePlay}
          onPause={handlePause}
          onWaiting={() => handleBuffering(true)}
          onCanPlay={() => handleBuffering(false)}
          onError={(e) => {
            console.log('Video error, trying to resume from:', currentTime);
            if (videoRef.current && currentTime > 0) {
              videoRef.current.currentTime = currentTime;
            }
          }}
        >
          {movie.subtitles && movie.subtitles.map((subtitle, index) => (
            <track
              key={index}
              kind="subtitles"
              src={subtitle.src}
              srcLang={subtitle.language}
              label={subtitle.label}
              default={subtitle.default || index === 0}
            />
          ))}
        </video>
      </div>
      
      <div className="bg-gray-900 p-4 rounded-b-lg">
        <div className="mb-4">
          <div className="flex items-center justify-between text-white text-sm mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div 
            className="relative w-full h-2 bg-gray-600 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"></div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-6 mb-4">
          <button
            onClick={togglePlayPause}
            className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white text-2xl transition-all duration-200 shadow-lg"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={decreaseSpeed}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white font-bold transition-all duration-200 shadow-lg"
              title="Kugabanya (Slow Down)"
            >
              -
            </button>
            <div className="text-white text-center min-w-[60px]">
              <div className="text-lg font-bold">{playbackRate}x</div>
              <div className="text-xs opacity-75">Speed</div>
            </div>
            <button
              onClick={increaseSpeed}
              className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white font-bold transition-all duration-200 shadow-lg"
              title="Kwihutisha (Speed Up)"
            >
              +
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAutoplay(!autoplay)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${autoplay ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Autoplay: {autoplay ? 'ON' : 'OFF'}
            </button>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="px-3 py-2 bg-gray-700 text-white rounded-lg"
            >
              <option value="auto">Auto Quality</option>
              <option value="hd720">HD (720p)</option>
              <option value="medium">Medium (480p)</option>
              <option value="small">Low (240p)</option>
            </select>
            <span className="text-sm text-gray-300">Network: {networkSpeed}</span>
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  setCurrentTime(0);
                  saveProgress(0);
                }
              }}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
            >
              Restart
            </button>
          </div>
          <button
            onClick={toggleFullscreen}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all duration-200 shadow-lg"
          >
            {isFullscreen ? '🗗 Exit Fullscreen' : '🗖 Fullscreen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;