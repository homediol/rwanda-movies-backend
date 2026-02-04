import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { PlayIcon, StarIcon, ClockIcon } from '@heroicons/react/24/solid';
import { useMovies } from '../hooks/useApi';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
  const { movies: featuredMovies, loading: featuredLoading } = useMovies({ featured: true, limit: 8 });
  const { movies: recentMovies, loading: recentLoading } = useMovies({ sort: '-createdAt', limit: 12 });

  const categories = [
    {
      name: 'Films Nyarwanda',
      slug: 'films-nyarwanda',
      description: 'Original Rwandan films showcasing local talent and stories',
      gradient: 'from-purple-600 to-blue-600',
      icon: '🎬'
    },
    {
      name: 'Movies Agasobanuye',
      slug: 'movies-agasobanuye',
      description: 'International movies with Kinyarwanda & English subtitles',
      gradient: 'from-pink-600 to-purple-600',
      icon: '🌍'
    },
    {
      name: 'French Movies',
      slug: 'french-movies',
      description: 'French cinema with subtitles',
      gradient: 'from-blue-600 to-cyan-600',
      icon: '🇫🇷'
    },
    {
      name: 'English Movies',
      slug: 'english-movies',
      description: 'Hollywood and international English films',
      gradient: 'from-green-600 to-teal-600',
      icon: '🎭'
    },
    {
      name: 'Ibiganiro & Films',
      slug: 'ibiganiro-films',
      description: 'Talk shows and films from YouTube',
      gradient: 'from-orange-600 to-red-600',
      icon: '📺'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Rwanda Movies - Stream Rwandan Cinema & International Films</title>
        <meta name="description" content="Watch the best of Rwandan cinema and international films with Kinyarwanda subtitles. Stream legally with high quality video and subtitles." />
        <meta name="keywords" content="Rwanda movies, Kinyarwanda films, African cinema, streaming, subtitles" />
      </Helmet>

      <div className="min-h-screen pt-20">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Seburikoko movie background image */}
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ backgroundImage: 'url(/images/Seburikoko_movie.jpg)' }}
          ></div>
          
          {/* Enhanced background overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-900/80"></div>
          <div className="absolute inset-0 content-overlay"></div>
          
          {/* Floating elements */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink-500/20 rounded-full blur-xl animate-float animation-delay-2000"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center max-w-6xl mx-auto px-6"
          >
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-6xl md:text-8xl font-bold text-contrast mb-8 font-display"
            >
              <span className="gradient-text-purple">Rwanda</span>{' '}
              <span className="text-white">Movies</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl md:text-3xl text-contrast-secondary mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Discover the best of Rwandan cinema and international films with Kinyarwanda subtitles
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <Link
                to="/movies"
                className="btn-primary group"
              >
                <PlayIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                Browse Movies
              </Link>
              <Link
                to="/category/films-nyarwanda"
                className="btn-secondary group"
              >
                <StarIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                Rwandan Films
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Featured Movies */}
        {featuredMovies.length > 0 && (
          <section className="py-20 px-6">
            <div className="max-w-7xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-5xl md:text-7xl font-bold heading-contrast font-display mb-6">
                  <span className="gradient-text-purple">Featured</span>{' '}
                  <span className="text-white">Movies</span>
                </h2>
                <p className="text-xl text-contrast-secondary max-w-3xl mx-auto leading-relaxed">
                  Handpicked selections showcasing the finest in Rwandan and international cinema
                </p>
              </motion.div>
              
              {featuredLoading ? (
                <LoadingSpinner size="lg" className="py-12" />
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  {/* Main featured movie */}
                  {featuredMovies[0] && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="relative mb-12 rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl"
                    >
                      <div className="relative h-96 md:h-[500px]">
                        <div className="absolute inset-0 bg-cover bg-center" 
                             style={{ backgroundImage: `url(${featuredMovies[0].backdrop || featuredMovies[0].poster})` }}></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
                        
                        <div className="relative z-10 h-full flex items-center px-8 md:px-16">
                          <div className="max-w-2xl">
                            <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                              ⭐ Featured
                            </span>
                            <h3 className="text-4xl md:text-6xl font-bold text-white mb-4 font-display">
                              {featuredMovies[0].title}
                            </h3>
                            <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                              {featuredMovies[0].description}
                            </p>
                            <div className="flex items-center space-x-6 mb-8">
                              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium">
                                {featuredMovies[0].releaseYear}
                              </span>
                              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-medium">
                                {featuredMovies[0].category?.name}
                              </span>
                              <div className="flex items-center text-yellow-400">
                                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="font-bold">{(featuredMovies[0].views || 0).toLocaleString()} views</span>
                              </div>
                            </div>
                            <Link
                              to={`/movie/${featuredMovies[0].slug}`}
                              className="btn-primary text-xl px-8 py-4 group"
                            >
                              <PlayIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                              Watch Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Other featured movies grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {featuredMovies.slice(1).map((movie, index) => (
                      <motion.div
                        key={movie._id}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <MovieCard movie={movie} />
                      </motion.div>
                    ))}
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mt-12"
                  >
                    <Link
                      to="/movies?featured=true"
                      className="btn-secondary text-xl px-8 py-4 group"
                    >
                      <StarIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                      View All Featured Movies
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold heading-contrast mb-16 text-center font-display"
            >
              Browse by Category
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((category, index) => (
                <motion.div
                  key={category.slug}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={`/category/${category.slug}`}
                    className="group relative content-card p-8 hover:scale-105 transition-all duration-300 block"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-10 group-hover:opacity-20 transition-opacity rounded-2xl`}></div>
                    
                    <div className="relative z-10">
                      <div className="text-5xl mb-6">{category.icon}</div>
                      <h3 className="text-2xl font-bold text-contrast mb-4 group-hover:gradient-text-purple transition-all duration-300">
                        {category.name}
                      </h3>
                      <p className="text-lg text-contrast-secondary leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                    
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayIcon className="w-8 h-8 text-purple-400" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Movies */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-between mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold heading-contrast font-display flex items-center">
                <ClockIcon className="w-10 h-10 mr-4 text-purple-400" />
                Recently Added
              </h2>
              <Link
                to="/movies"
                className="text-xl text-purple-400 hover:text-purple-300 transition-colors duration-200 flex items-center group"
              >
                View All
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
            
            {recentLoading ? (
              <LoadingSpinner size="lg" className="py-12" />
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-8"
              >
                {recentMovies.map((movie, index) => (
                  <motion.div
                    key={movie._id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <MovieCard movie={movie} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto text-center content-card p-12"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold heading-contrast mb-8 font-display">
                Start Watching Today
              </h2>
              <p className="text-2xl text-contrast-secondary mb-12 leading-relaxed max-w-3xl mx-auto">
                Join thousands of viewers enjoying quality Rwandan and international cinema
              </p>
              <Link
                to="/register"
                className="btn-primary text-xl px-12 py-6"
              >
                <StarIcon className="w-6 h-6 mr-3" />
                Sign Up Free
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
};

export default Home;