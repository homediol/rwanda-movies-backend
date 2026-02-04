import React from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { formatDuration, getLanguageDisplayName } from '../utils/helpers';

const MovieCard = ({ movie, className = '' }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div
      ref={ref}
      className={`movie-card group relative glass-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/2 hover:shadow-netflix-red/20 transition-all duration-500 hover:border-netflix-red/30 hover:scale-105 transform h-64 ${className} ${
        inView ? 'animate-fade-in' : 'opacity-0'
      }`}
    >
      <Link to={`/movie/${movie.slug}`} className="flex h-full">
        <div className="relative w-32 h-full overflow-hidden rounded-l-2xl flex-shrink-0">
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/50">
            <div className="w-12 h-12 bg-gradient-to-r from-netflix-red to-red-600 rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          {/* Featured badge */}
          {movie.featured && (
            <div className="absolute top-2 left-2">
              <span className="bg-gradient-to-r from-netflix-red to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                Featured
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-white font-bold text-lg mb-2 line-clamp-1 group-hover:text-netflix-red transition-colors duration-300">
              {movie.title}
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-netflix-red/20 px-2 py-1 rounded-full font-bold text-white text-xs">{movie.releaseYear}</span>
              <span className="bg-blue-500/20 px-2 py-1 rounded-full font-bold text-white text-xs">{formatDuration(movie.duration)}</span>
              <span className="bg-green-500/20 px-2 py-1 rounded-full font-bold text-white text-xs">{getLanguageDisplayName(movie.language)}</span>
            </div>

            <p className="text-gray-300 text-sm line-clamp-2 mb-2">
              {movie.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-netflix-red text-xs font-bold">{movie.category?.name}</span>
            <div className="flex items-center text-gray-400 text-xs">
              <svg className="w-3 h-3 mr-1 text-netflix-red" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <span>{(movie.views || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default MovieCard;