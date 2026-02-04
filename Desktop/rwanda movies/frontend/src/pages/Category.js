import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMovies } from '../hooks/useApi';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getCategoryDisplayName } from '../utils/helpers';

const Category = () => {
  const { slug } = useParams();
  const categoryName = getCategoryDisplayName(slug);
  
  const { movies, loading, hasMore, loadMore, pagination } = useMovies({ 
    category: slug 
  });

  return (
    <>
      <Helmet>
        <title>{`${categoryName} - Rwanda Movies`}</title>
        <meta name="description" content={`Browse ${categoryName} movies on Rwanda Movies. High quality streaming with subtitles.`} />
      </Helmet>

      <div className="min-h-screen pt-16 relative">
        {/* Background image */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20" 
             style={{
               backgroundImage: `url('/images/Seburikoko_movie.jpg')`
             }}></div>
        
        {/* Background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/80 to-slate-900/90"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-display gradient-text-purple">
              {categoryName}
            </h1>
            <p className="text-gray-300 text-lg glass-card px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 inline-block">
              {pagination.total} movies available
            </p>
          </div>

          {/* Movies Grid */}
          {movies.length === 0 && !loading ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-white mb-2">No movies found</h3>
              <p className="text-netflix-gray-400">Check back later for new content</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
                {movies.map((movie) => (
                  <MovieCard key={movie._id} movie={movie} />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="bg-netflix-red text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <LoadingSpinner size="sm" className="mr-2" />
                        Loading...
                      </div>
                    ) : (
                      'Load More Movies'
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {loading && movies.length === 0 && (
            <LoadingSpinner size="lg" className="py-12" />
          )}
        </div>
      </div>
    </>
  );
};

export default Category;