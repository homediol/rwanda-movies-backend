import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import VideoPlayer from '../components/VideoPlayer';
import LoadingSpinner, { PageLoader } from '../components/LoadingSpinner';
import { formatDuration, getLanguageDisplayName } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MovieDetail = () => {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likeData, setLikeData] = useState({ count: 0, userLiked: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/movies/${slug}`);
        const movieData = response.data;
        
        // Parse JSON strings if they exist and ensure arrays
        if (typeof movieData.videoSource === 'string') {
          movieData.videoSource = JSON.parse(movieData.videoSource);
        }
        if (typeof movieData.subtitles === 'string') {
          movieData.subtitles = JSON.parse(movieData.subtitles);
        }
        if (typeof movieData.tags === 'string') {
          movieData.tags = JSON.parse(movieData.tags);
        }
        if (typeof movieData.seoKeywords === 'string') {
          movieData.seoKeywords = JSON.parse(movieData.seoKeywords);
        }
        
        // Ensure arrays are properly initialized
        movieData.tags = Array.isArray(movieData.tags) ? movieData.tags : [];
        movieData.subtitles = Array.isArray(movieData.subtitles) ? movieData.subtitles : [];
        movieData.seoKeywords = Array.isArray(movieData.seoKeywords) ? movieData.seoKeywords : [];
        
        setMovie(movieData);
        
        // Set default subtitle
        if (movieData.subtitles && movieData.subtitles.length > 0) {
          const defaultSub = movieData.subtitles.find(sub => sub.default) || movieData.subtitles[0];
          setSelectedSubtitle(defaultSub);
        }

        // Fetch comments and likes
        await Promise.all([
          fetchComments(movieData.id),
          fetchLikes(movieData.id)
        ]);
      } catch (err) {
        setError(err.response?.data?.message || 'Movie not found');
        toast.error('Failed to load movie');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMovie();
    }
  }, [slug]);

  const fetchComments = async (movieId) => {
    try {
      const response = await axios.get(`/api/interactions/movies/${movieId}/comments`);
      setComments(response.data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const fetchLikes = async (movieId) => {
    try {
      const response = await axios.get(`/api/interactions/movies/${movieId}/likes`);
      setLikeData(response.data);
    } catch (err) {
      console.error('Failed to fetch likes:', err);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like movies');
      return;
    }

    try {
      const response = await axios.post(`/api/interactions/movies/${movie.id}/like`);
      setLikeData(prev => ({
        count: response.data.liked ? prev.count + 1 : prev.count - 1,
        userLiked: response.data.liked
      }));
      toast.success(response.data.message);
    } catch (err) {
      toast.error('Failed to like movie');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to comment');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await axios.post(`/api/interactions/movies/${movie.id}/comments`, {
        content: newComment
      });
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
      toast.success('Comment posted successfully');
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;
  
  if (error) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Movie Not Found</h1>
          <p className="text-netflix-gray-400 mb-6">{error}</p>
          <Link
            to="/movies"
            className="bg-netflix-red text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Browse Movies
          </Link>
        </div>
      </div>
    );
  }

  if (!movie) return null;

  return (
    <>
      <Helmet>
        <title>{movie.seoTitle || `${movie.title} - Rwanda Movies`}</title>
        <meta name="description" content={movie.seoDescription || movie.description} />
        <meta name="keywords" content={movie.seoKeywords?.join(', ') || `${movie.title}, Rwanda movies, ${movie.language}`} />
        <meta property="og:title" content={movie.title} />
        <meta property="og:description" content={movie.description} />
        <meta property="og:image" content={movie.poster} />
        <meta property="og:type" content="video.movie" />
      </Helmet>

      <div className="min-h-screen pt-16">
        {/* Hero Section with Backdrop */}
        <div className="relative h-96 md:h-[500px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/images/Seburikoko_movie.jpg)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-black/50 to-transparent" />
          
          <div className="relative z-10 h-full flex items-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
              <div className="flex flex-col md:flex-row items-start gap-8">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-48 md:w-64 rounded-lg shadow-2xl"
                />
                <div className="flex-1">
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {movie.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="bg-gradient-to-r from-netflix-red to-red-600 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">{movie.releaseYear}</span>
                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">{formatDuration(movie.duration)}</span>
                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">{getLanguageDisplayName(movie.language)}</span>
                    <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                      {movie.category?.name}
                    </span>
                  </div>
                  <p className="text-lg text-netflix-gray-300 mb-6 max-w-3xl">
                    {movie.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-netflix-gray-400">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {movie.views} views
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Player Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <VideoPlayer movie={movie} />

              {/* Subtitle Selector */}
              {movie.subtitles && movie.subtitles.length > 0 && movie.videoSource.type === 'hosted' && (
                <div className="mt-4">
                  <h3 className="text-white font-semibold mb-2">Subtitles</h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.subtitles.map((subtitle, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSubtitle(subtitle)}
                        className={`px-3 py-1 rounded text-sm transition-colors duration-200 ${
                          selectedSubtitle?.language === subtitle.language
                            ? 'bg-netflix-red text-white'
                            : 'bg-netflix-gray-700 text-netflix-gray-300 hover:bg-netflix-gray-600'
                        }`}
                      >
                        {subtitle.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Like and Comment Section */}
            <div className="space-y-8">
              {/* Movie Details Box */}
              <div className="glass-card border border-white/10 rounded-2xl p-8 backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/2 shadow-2xl hover:shadow-netflix-red/20 transition-all duration-500 hover:border-netflix-red/30">
                <div className="flex items-center mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-netflix-red to-red-600 rounded-full mr-4"></div>
                  <h3 className="text-2xl font-bold text-white tracking-wide">Movie Details</h3>
                </div>
                
                <div className="space-y-5">
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-lg text-gray-300 font-medium">Release Year:</span>
                    <span className="text-xl font-bold text-white bg-gradient-to-r from-netflix-red to-red-500 bg-clip-text text-transparent">
                      {movie.releaseYear}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-lg text-gray-300 font-medium">Duration:</span>
                    <span className="text-xl font-bold text-white">{formatDuration(movie.duration)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-lg text-gray-300 font-medium">Language:</span>
                    <span className="text-xl font-bold text-white">{getLanguageDisplayName(movie.language)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-lg text-gray-300 font-medium">Category:</span>
                    <Link
                      to={`/category/${movie.category?.slug}`}
                      className="text-xl font-bold text-netflix-red hover:text-red-400 transition-all duration-300 hover:scale-105 transform"
                    >
                      {movie.category?.name}
                    </Link>
                  </div>
                  
                  <div className="flex justify-between items-center py-3">
                    <span className="text-lg text-gray-300 font-medium">Views:</span>
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-netflix-red" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xl font-bold text-white">{movie.views.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags Box */}
              {movie.tags && movie.tags.length > 0 && (
                <div className="glass-card border border-white/10 rounded-2xl p-8 backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/2 shadow-2xl hover:shadow-netflix-red/20 transition-all duration-500 hover:border-netflix-red/30">
                  <div className="flex items-center mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-netflix-red to-red-600 rounded-full mr-4"></div>
                    <h3 className="text-2xl font-bold text-white tracking-wide">Tags</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {movie.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-netflix-red/20 to-red-600/20 border border-netflix-red/30 text-white px-4 py-2 rounded-full text-base font-medium hover:from-netflix-red/30 hover:to-red-600/30 hover:border-netflix-red/50 transition-all duration-300 hover:scale-105 transform cursor-default backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-lg font-medium text-gray-300 italic">
                      "Reba filrm yose kubuntu"
                    </p>
                  </div>
                </div>
              )}

              {/* Share Box */}
              <div className="glass-card border border-white/10 rounded-2xl p-8 backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/2 shadow-2xl hover:shadow-netflix-red/20 transition-all duration-500 hover:border-netflix-red/30">
                <div className="flex items-center mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-netflix-red to-red-600 rounded-full mr-4"></div>
                  <h3 className="text-2xl font-bold text-white tracking-wide">Share</h3>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard!');
                    }}
                    className="flex-1 bg-gradient-to-r from-netflix-red to-red-600 hover:from-red-600 hover:to-red-700 text-white p-4 rounded-xl transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-netflix-red/30 flex items-center justify-center space-x-3 font-medium text-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Link</span>
                  </button>
                </div>
                
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <button className="bg-blue-600/20 border border-blue-500/30 text-blue-400 p-3 rounded-xl hover:bg-blue-600/30 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 transform flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </button>
                  
                  <button className="bg-blue-800/20 border border-blue-600/30 text-blue-300 p-3 rounded-xl hover:bg-blue-800/30 hover:border-blue-600/50 transition-all duration-300 hover:scale-105 transform flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  
                  <button className="bg-green-600/20 border border-green-500/30 text-green-400 p-3 rounded-xl hover:bg-green-600/30 hover:border-green-500/50 transition-all duration-300 hover:scale-105 transform flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="glass-card border border-white/10 rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Rate & Comment</h3>
              <button 
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                  likeData.userLiked 
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span>Like ({likeData.count})</span>
              </button>
            </div>

            <form onSubmit={handleCommentSubmit} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this movie..."
                className="w-full bg-black/30 border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows="3"
                disabled={!isAuthenticated}
              ></textarea>
              <div className="flex justify-end mt-3">
                <button 
                  type="submit"
                  disabled={!isAuthenticated || !newComment.trim() || submitting}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
              {!isAuthenticated && (
                <p className="text-gray-400 text-sm mt-2">Please login to post comments</p>
              )}
            </form>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white mb-4">Comments ({comments.length})</h4>
              
              {comments.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-black/20 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-white font-semibold">{comment.user?.username || 'Anonymous'}</span>
                          <span className="text-gray-400 text-sm">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-300">{comment.content}</p>
                        <div className="flex items-center space-x-1 text-gray-400 mt-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm">{comment.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MovieDetail;