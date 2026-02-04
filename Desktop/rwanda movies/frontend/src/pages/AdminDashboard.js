import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';

const AdminDashboard = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'Movies', path: '/admin/movies', icon: '🎬' },
    { name: 'Categories', path: '/admin/categories', icon: '📁' },
    { name: 'Users', path: '/admin/users', icon: '👥' },
  ];

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Rwanda Movies</title>
      </Helmet>

      <div className="min-h-screen pt-16 bg-netflix-black">
        <div className="flex">
          {/* Sidebar */}
          <div className="relative w-64 min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10"></div>
            <div className="relative z-10 p-8">
              <div className="mb-10">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">Admin Panel</h2>
                <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              </div>
              <nav className="space-y-3">
                {navItems.map((item, index) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center space-x-4 px-6 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      location.pathname === item.path
                        ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white shadow-lg backdrop-blur-md border border-white/20'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white backdrop-blur-sm border border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className={`text-2xl transition-transform duration-300 group-hover:scale-110 ${
                      location.pathname === item.path ? 'drop-shadow-lg' : ''
                    }`}>
                      {item.icon}
                    </div>
                    <span className="font-semibold text-lg">{item.name}</span>
                    {location.pathname === item.path && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/movies" element={<MoviesAdmin />} />
              <Route path="/categories" element={<CategoriesAdmin />} />
              <Route path="/users" element={<UsersAdmin />} />
            </Routes>
          </div>
        </div>
      </div>
    </>
  );
};

const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalCategories: 0,
    totalUsers: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [moviesRes, categoriesRes, usersRes] = await Promise.all([
          axios.get('/api/movies'),
          axios.get('/api/categories'),
          axios.get('/api/users')
        ]);
        
        const totalViews = moviesRes.data.movies.reduce((sum, movie) => sum + (movie.views || 0), 0);
        
        setStats({
          totalMovies: moviesRes.data.total || moviesRes.data.movies.length,
          totalCategories: categoriesRes.data.length,
          totalUsers: usersRes.data.length,
          totalViews
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-8">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-slate-900/90 backdrop-blur-xl p-8 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <span className="text-2xl">🎬</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Total Movies</h3>
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{stats.totalMovies}</p>
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-slate-900/90 backdrop-blur-xl p-8 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <span className="text-2xl">📁</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Categories</h3>
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{stats.totalCategories}</p>
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-slate-900/90 backdrop-blur-xl p-8 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <span className="text-2xl">👥</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Users</h3>
            <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{stats.totalUsers}</p>
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-slate-900/90 backdrop-blur-xl p-8 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <span className="text-2xl">👁️</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Total Views</h3>
            <p className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">{stats.totalViews.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MoviesAdmin = () => {
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    language: 'kinyarwanda',
    duration: '',
    releaseYear: new Date().getFullYear(),
    videoSource: { type: 'hosted', url: '' },
    tags: '',
    featured: false,
    poster: null
  });

  useEffect(() => {
    fetchMovies();
    fetchCategories();
  }, []);

  const fetchMovies = async () => {
    try {
      const response = await axios.get('/api/movies');
      setMovies(response.data.movies || []);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description,
      categoryId: movie.categoryId,
      language: movie.language,
      duration: movie.duration,
      releaseYear: movie.releaseYear,
      videoSource: typeof movie.videoSource === 'string' ? JSON.parse(movie.videoSource) : movie.videoSource,
      tags: Array.isArray(movie.tags) ? movie.tags.join(', ') : movie.tags,
      featured: movie.featured
    });
    setShowForm(true);
  };

  const handleDelete = async (movieId) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await axios.delete(`/api/movies/${movieId}`);
        fetchMovies();
      } catch (error) {
        console.error('Error deleting movie:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('categoryId', formData.categoryId);
      formDataToSend.append('language', formData.language);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('releaseYear', formData.releaseYear);
      formDataToSend.append('videoSource', JSON.stringify(formData.videoSource));
      formDataToSend.append('tags', JSON.stringify(formData.tags.split(',').map(t => t.trim()).filter(t => t)));
      formDataToSend.append('featured', formData.featured);
      
      if (formData.poster) {
        formDataToSend.append('poster', formData.poster);
      }

      if (editingMovie) {
        await axios.put(`/api/movies/${editingMovie.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/api/movies', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setShowForm(false);
      setEditingMovie(null);
      fetchMovies();
      setFormData({
        title: '',
        description: '',
        categoryId: '',
        language: 'kinyarwanda',
        duration: '',
        releaseYear: new Date().getFullYear(),
        videoSource: { type: 'hosted', url: '' },
        tags: '',
        featured: false,
        poster: null
      });
    } catch (error) {
      console.error('Error saving movie:', error.response?.data || error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'poster') {
      setFormData(prev => ({ ...prev, poster: files[0] }));
    } else if (name === 'videoType') {
      setFormData(prev => ({
        ...prev,
        videoSource: { ...prev.videoSource, type: value }
      }));
    } else if (name === 'videoUrl') {
      setFormData(prev => ({
        ...prev,
        videoSource: { ...prev.videoSource, url: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">Movies Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          ✨ Add Movie
        </button>
      </div>

      {showForm && (
        <div className="bg-netflix-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold text-white mb-4">{editingMovie ? 'Edit Movie' : 'Add New Movie'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="title"
                placeholder="Movie Title"
                value={formData.title}
                onChange={handleChange}
                className="bg-netflix-gray-700 text-black p-3 rounded border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
                required
              />
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="bg-netflix-gray-700 text-black p-3 rounded border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <textarea
              name="description"
              placeholder="Movie Description"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-netflix-gray-700 text-black p-3 rounded h-24 border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="bg-netflix-gray-700 text-black p-3 rounded border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
              >
                <option value="kinyarwanda">Kinyarwanda</option>
                <option value="english">English</option>
                <option value="french">French</option>
                <option value="mixed">Mixed</option>
              </select>
              
              <input
                type="number"
                name="duration"
                placeholder="Duration (minutes)"
                value={formData.duration}
                onChange={handleChange}
                className="bg-netflix-gray-700 text-black p-3 rounded border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
                required
              />
              
              <input
                type="number"
                name="releaseYear"
                placeholder="Release Year"
                value={formData.releaseYear}
                onChange={handleChange}
                className="bg-netflix-gray-700 text-black p-3 rounded border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-white">Video Source:</label>
              <div className="flex space-x-4">
                <label className="text-white">
                  <input
                    type="radio"
                    name="videoType"
                    value="hosted"
                    checked={formData.videoSource.type === 'hosted'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Hosted Video
                </label>
                <label className="text-white">
                  <input
                    type="radio"
                    name="videoType"
                    value="youtube"
                    checked={formData.videoSource.type === 'youtube'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  YouTube
                </label>
              </div>
              <input
                type="url"
                name="videoUrl"
                placeholder={formData.videoSource.type === 'youtube' ? 'YouTube URL' : 'Video File URL'}
                value={formData.videoSource.url}
                onChange={handleChange}
                className="w-full bg-netflix-gray-700 text-black p-3 rounded border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
                required
              />
            </div>

            <input
              type="text"
              name="tags"
              placeholder="Tags (comma separated)"
              value={formData.tags}
              onChange={handleChange}
              className="w-full bg-netflix-gray-700 text-black p-3 rounded border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
            />

            <div className="space-y-2">
              <label className="text-white">Movie Poster:</label>
              <input
                type="file"
                name="poster"
                accept="image/*"
                onChange={handleChange}
                className="w-full bg-netflix-gray-700 text-white p-3 rounded border border-netflix-gray-600 focus:border-netflix-red focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {formData.poster && (
                <p className="text-sm text-gray-400">Selected: {formData.poster.name}</p>
              )}
            </div>

            <label className="flex items-center text-white">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="mr-2"
              />
              Featured Movie
            </label>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-netflix-red text-white px-6 py-2 rounded hover:bg-red-700"
              >
                {editingMovie ? 'Update Movie' : 'Add Movie'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingMovie(null);
                  setFormData({
                    title: '',
                    description: '',
                    categoryId: '',
                    language: 'kinyarwanda',
                    duration: '',
                    releaseYear: new Date().getFullYear(),
                    videoSource: { type: 'hosted', url: '' },
                    tags: '',
                    featured: false
                  });
                }}
                className="bg-netflix-gray-700 text-white px-6 py-2 rounded hover:bg-netflix-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20"></div>
        <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-800/50 to-slate-700/50">
                <tr>
                  <th className="text-left p-6 text-white font-semibold">Title</th>
                  <th className="text-left p-6 text-white font-semibold">Category</th>
                  <th className="text-left p-6 text-white font-semibold">Language</th>
                  <th className="text-left p-6 text-white font-semibold">Year</th>
                  <th className="text-left p-6 text-white font-semibold">Views</th>
                  <th className="text-left p-6 text-white font-semibold">Featured</th>
                  <th className="text-left p-6 text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map(movie => (
                  <tr key={movie.id} className="border-t border-white/10 hover:bg-white/5 transition-colors duration-200">
                    <td className="p-6">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={movie.poster || 'https://via.placeholder.com/60x90/374151/9CA3AF?text=No+Image'} 
                          alt={movie.title}
                          className="w-12 h-18 object-cover rounded-lg shadow-md"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/60x90/374151/9CA3AF?text=No+Image';
                          }}
                        />
                        <span className="text-white font-medium">{movie.title}</span>
                      </div>
                    </td>
                    <td className="p-6 text-gray-300">{movie.category?.name}</td>
                    <td className="p-6 text-gray-300">{movie.language}</td>
                    <td className="p-6 text-gray-300">{movie.releaseYear}</td>
                    <td className="p-6 text-gray-300">{movie.views}</td>
                    <td className="p-6">
                      {movie.featured ? (
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">Featured</span>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </td>
                    <td className="p-6">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(movie)}
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(movie.id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoriesAdmin = () => {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`/api/categories/${categoryId}`);
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`/api/categories/${editingCategory.id}`, formData);
      } else {
        await axios.post('/api/categories', formData);
      }
      
      setShowForm(false);
      setEditingCategory(null);
      fetchCategories();
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">Categories Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          📁 Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-netflix-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold text-white mb-4">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Category Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-netflix-gray-700 text-black p-3 rounded border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
              required
            />
            <textarea
              name="description"
              placeholder="Category Description"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-netflix-gray-700 text-black p-3 rounded h-24 border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
            />
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-netflix-red text-white px-6 py-2 rounded hover:bg-red-700"
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                  setFormData({ name: '', description: '' });
                }}
                className="bg-netflix-gray-700 text-white px-6 py-2 rounded hover:bg-netflix-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-20"></div>
        <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-800/50 to-slate-700/50">
                <tr>
                  <th className="text-left p-6 text-white font-semibold">Name</th>
                  <th className="text-left p-6 text-white font-semibold">Description</th>
                  <th className="text-left p-6 text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category.id} className="border-t border-white/10 hover:bg-white/5 transition-colors duration-200">
                    <td className="p-6 text-white font-medium">{category.name}</td>
                    <td className="p-6 text-gray-300">{category.description || 'No description'}</td>
                    <td className="p-6">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(category)}
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersAdmin = () => {
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    changePassword: false
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchComments();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get('/api/users/comments/all');
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      changePassword: false
    });
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        fetchUsers();
        alert('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error.response?.data || error.message);
        alert(`Error deleting user: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await axios.delete(`/api/users/comments/${commentId}`);
        fetchComments();
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingUser || formData.changePassword) {
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
      }
    }
    
    try {
      const submitData = {
        username: formData.username,
        email: formData.email,
        role: formData.role
      };
      
      if (!editingUser || formData.changePassword) {
        submitData.password = formData.password;
      }
      
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, submitData);
      } else {
        await axios.post('/api/users', submitData);
      }
      
      setShowForm(false);
      setEditingUser(null);
      fetchUsers();
      setFormData({ username: '', email: '', password: '', confirmPassword: '', role: 'user', changePassword: false });
    } catch (error) {
      console.error('Error saving user:', error.response?.data || error.message);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">Users Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          👥 Add User
        </button>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded ${activeTab === 'users' ? 'bg-netflix-red text-white' : 'bg-netflix-gray-700 text-gray-300'}`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2 rounded ${activeTab === 'comments' ? 'bg-netflix-red text-white' : 'bg-netflix-gray-700 text-gray-300'}`}
        >
          Comments ({comments.length})
        </button>
      </div>

      {showForm && (
        <div className="bg-netflix-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold text-white mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                className="bg-netflix-gray-700 text-black p-3 rounded border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="bg-netflix-gray-700 text-black p-3 rounded border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
                required
              />
            </div>
            
            {editingUser && (
              <label className="flex items-center text-white">
                <input
                  type="checkbox"
                  name="changePassword"
                  checked={formData.changePassword}
                  onChange={(e) => setFormData({...formData, changePassword: e.target.checked, password: '', confirmPassword: ''})}
                  className="mr-2"
                />
                Change Password
              </label>
            )}
            
            {(!editingUser || formData.changePassword) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-netflix-gray-700 text-black p-3 rounded border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
                  required={!editingUser || formData.changePassword}
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-netflix-gray-700 text-black p-3 rounded border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
                  required={!editingUser || formData.changePassword}
                />
              </div>
            )}
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-netflix-gray-700 text-black p-3 rounded border border-netflix-gray-600 focus:border-netflix-red focus:outline-none"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-netflix-red text-white px-6 py-2 rounded hover:bg-red-700"
              >
                {editingUser ? 'Update User' : 'Add User'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  setFormData({ username: '', email: '', password: '', confirmPassword: '', role: 'user', changePassword: false });
                }}
                className="bg-netflix-gray-700 text-white px-6 py-2 rounded hover:bg-netflix-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-20"></div>
          <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-800/50 to-slate-700/50">
                  <tr>
                    <th className="text-left p-6 text-white font-semibold">Username</th>
                    <th className="text-left p-6 text-white font-semibold">Email</th>
                    <th className="text-left p-6 text-white font-semibold">Role</th>
                    <th className="text-left p-6 text-white font-semibold">Created</th>
                    <th className="text-left p-6 text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-t border-white/10 hover:bg-white/5 transition-colors duration-200">
                      <td className="p-6 text-white font-medium">{user.username}</td>
                      <td className="p-6 text-gray-300">{user.email}</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user.role === 'admin' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'bg-slate-600 text-white'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-6 text-gray-300">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-6">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEdit(user)}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                          >
                            Edit
                          </button>
                          {currentUser && currentUser.id !== user.id && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                            >
                              Delete
                            </button>
                          )}
                          {currentUser && currentUser.id === user.id && (
                            <span className="text-sm text-gray-400 px-4 py-2 bg-slate-700 rounded-lg">
                              (You)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-20"></div>
          <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-800/50 to-slate-700/50">
                  <tr>
                    <th className="text-left p-6 text-white font-semibold">User</th>
                    <th className="text-left p-6 text-white font-semibold">Movie</th>
                    <th className="text-left p-6 text-white font-semibold">Comment</th>
                    <th className="text-left p-6 text-white font-semibold">Date</th>
                    <th className="text-left p-6 text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.map(comment => (
                    <tr key={comment.id} className="border-t border-white/10 hover:bg-white/5 transition-colors duration-200">
                      <td className="p-6 text-white font-medium">{comment.user?.username}</td>
                      <td className="p-6 text-gray-300">{comment.movie?.title}</td>
                      <td className="p-6 text-gray-300 max-w-xs truncate">{comment.content}</td>
                      <td className="p-6 text-gray-300">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-6">
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;