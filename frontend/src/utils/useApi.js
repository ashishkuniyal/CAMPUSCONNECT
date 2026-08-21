import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getAuthHeaders } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const authHeaders = getAuthHeaders();
    if (authHeaders.Authorization) {
      config.headers.Authorization = authHeaders.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Try to refresh the token
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });

        // Save new access token
        localStorage.setItem('token', data.accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Custom hook for API calls with loading and error states
export function useApi(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { method = 'GET', body = null, skip = false, dependencies = [] } = options;

  const fetchData = useCallback(async () => {
    if (skip) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const config = {
        method,
        url,
        ...(body && { data: body })
      };

      const response = await apiClient(config);
      setData(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      console.error('API Error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [url, method, JSON.stringify(body), skip]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
}

// Manual API call function
export async function apiCall(url, options = {}) {
  const { method = 'GET', body = null } = options;

  try {
    const config = {
      method,
      url,
      ...(body && { data: body })
    };

    const response = await apiClient(config);
    return { data: response.data, error: null };
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
    return { data: null, error: errorMessage };
  }
}

export { apiClient };
export default useApi;
