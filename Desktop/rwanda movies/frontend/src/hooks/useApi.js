import { useState, useEffect } from 'react';
import axios from 'axios';

export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(url, options);
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchData();
    }
  }, [url]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(url, options);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};

export const useMovies = (filters = {}) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  const fetchMovies = async (page = 1, newFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page,
        limit: 12,
        ...filters,
        ...newFilters
      });

      const response = await axios.get(`/api/movies?${params}`);
      const { movies: movieData, totalPages, currentPage, total } = response.data;
      
      if (page === 1) {
        setMovies(movieData);
      } else {
        setMovies(prev => [...prev, ...movieData]);
      }
      
      setPagination({ currentPage, totalPages, total });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies(1, filters);
  }, [JSON.stringify(filters)]);

  const loadMore = () => {
    if (pagination.currentPage < pagination.totalPages && !loading) {
      fetchMovies(pagination.currentPage + 1, filters);
    }
  };

  const refresh = () => {
    fetchMovies(1, filters);
  };

  return {
    movies,
    loading,
    error,
    pagination,
    loadMore,
    refresh,
    hasMore: pagination.currentPage < pagination.totalPages
  };
};