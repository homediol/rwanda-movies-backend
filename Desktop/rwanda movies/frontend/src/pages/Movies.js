import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMovies, useApi } from '../hooks/useApi';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Movies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    language: searchParams.get('language') || '',
    featured: searchParams.get('featured') || '',
    sort: searchParams.get('sort') || '-createdAt'
  });

  const { data: categories } = useApi('/api/categories');
  const { movies, loading, hasMore, loadMore, pagination } = useMovies(filters);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const languages = [
    { value: 'kinyarwanda', label: 'Kinyarwanda' },
    { value: 'english', label: 'English' },
    { value: 'french', label: 'Français' },
    { value: 'mixed', label: 'Mixed Languages' }
  ];

  const sortOptions = [
    { value: '-createdAt', label: 'Recently Added' },
    { value: 'title', label: 'Title A-Z' },
    { value: '-title', label: 'Title Z-A' },
    { value: '-views', label: 'Most Viewed' },
    { value: 'releaseYear', label: 'Oldest First' },
    { value: '-releaseYear', label: 'Newest First' }
  ];

  return (
    <>
      <Helmet>
        <title>All Movies - Rwanda Movies</title>
        <meta name="description" content="Browse our complete collection of Rwandan and international movies with subtitles. Filter by category, language, and more." />
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
              All Movies
            </h1>
            <p className="text-gray-300 text-lg glass-card px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 inline-block">
              Discover our complete collection of {pagination.total} movies
            </p>
          </div>

          {/* Filters */}
          <div className="bg-netflix-gray-900 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-netflix-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full bg-netflix-gray-800 border border-netflix-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
                >
                  <option value="">All Categories</option>
                  {categories?.map((category) => (
                    <option key={category._id || category.id} value={category._id || category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language Filter */}
              <div>
                <label className="block text-sm font-medium text-netflix-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={filters.language}
                  onChange={(e) => handleFilterChange('language', e.target.value)}
                  className="w-full bg-netflix-gray-800 border border-netflix-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
                >
                  <option value="">All Languages</option>
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Featured Filter */}
              <div>
                <label className="block text-sm font-medium text-netflix-gray-300 mb-2">
                  Featured
                </label>
                <select
                  value={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.value)}
                  className="w-full bg-netflix-gray-800 border border-netflix-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
                >
                  <option value="">All Movies</option>
                  <option value="true">Featured Only</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="block text-sm font-medium text-netflix-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full bg-netflix-gray-800 border border-netflix-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({
                  category: '',
                  language: '',
                  featured: '',
                  sort: '-createdAt'
                })}
                className="text-netflix-red hover:text-red-400 transition-colors duration-200 text-sm"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Movies Grid */}
          {movies.length === 0 && !loading ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-white mb-2">No movies found</h3>
              <p className="text-netflix-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

              {/* Pagination Info */}
              <div className="text-center mt-8 text-netflix-gray-400 text-sm">
                Showing {movies.length} of {pagination.total} movies
              </div>
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

export default Movies;