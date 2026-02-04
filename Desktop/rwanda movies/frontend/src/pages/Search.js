import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMovies } from '../hooks/useApi';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { debounce } from '../utils/helpers';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  const { movies, loading, hasMore, loadMore, pagination } = useMovies({ 
    search: debouncedSearch 
  });

  // Debounce search input
  useEffect(() => {
    const debouncedUpdate = debounce((term) => {
      setDebouncedSearch(term);
      if (term) {
        setSearchParams({ q: term });
      } else {
        setSearchParams({});
      }
    }, 500);

    debouncedUpdate(searchTerm);
  }, [searchTerm, setSearchParams]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSearchParams({});
  };

  return (
    <>
      <Helmet>
        <title>{searchTerm ? `Search: ${searchTerm} - Rwanda Movies` : 'Search - Rwanda Movies'}</title>
        <meta name="description" content="Search for movies on Rwanda Movies. Find your favorite Rwandan and international films." />
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
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 font-display gradient-text-purple">
              Search Movies
            </h1>
            
            {/* Search Input */}
            <div className="relative max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search for movies, actors, directors..."
                className="w-full glass-card border border-white/20 rounded-2xl pl-12 pr-12 py-5 text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 backdrop-blur-xl"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          {debouncedSearch ? (
            <>
              <div className="mb-6">
                <p className="text-gray-300 text-lg glass-card px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 inline-block">
                  {loading && movies.length === 0 ? (
                    'Searching...'
                  ) : (
                    `Found ${pagination.total} result${pagination.total !== 1 ? 's' : ''} for "${debouncedSearch}"`
                  )}
                </p>
              </div>

              {movies.length === 0 && !loading ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-netflix-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No movies found</h3>
                  <p className="text-netflix-gray-400 mb-4">
                    We couldn't find any movies matching "{debouncedSearch}"
                  </p>
                  <button
                    onClick={clearSearch}
                    className="text-netflix-red hover:text-red-400 transition-colors duration-200"
                  >
                    Clear search and browse all movies
                  </button>
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
                          'Load More Results'
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}

              {loading && movies.length === 0 && (
                <LoadingSpinner size="lg" className="py-12" />
              )}
            </>
          ) : (
            /* Search Suggestions */
            <div className="text-center py-12">
              <div className="mb-8">
                <svg className="mx-auto h-16 w-16 text-netflix-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">Start searching</h3>
                <p className="text-netflix-gray-400">
                  Enter a movie title, actor, or director to find what you're looking for
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <h4 className="text-lg font-semibold text-white mb-4">Popular searches:</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Rwandan films', 'French movies', 'English movies', 'Comedy', 'Drama', 'Action'].map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchTerm(term)}
                      className="bg-netflix-gray-800 hover:bg-netflix-gray-700 text-netflix-gray-300 hover:text-white px-4 py-2 rounded-full text-sm transition-colors duration-200"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Search;