import axios from 'axios';

// Configure default base URL targeting the Express API server
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60-second network request timeout
});

// Request Interceptor: Automatically inject JWT token into header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch authorization and network exceptions
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token is invalid or expired, clear session states
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_authenticated');
      localStorage.removeItem('user_profile');
      
      // Trigger simple window alert or redirect if needed
      console.warn('Session expired. Redirecting or clearing states.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
