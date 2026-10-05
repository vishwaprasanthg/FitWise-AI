import axios from 'axios';

// Standard Axios API Client for FitPilot AI
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send HttpOnly cookies automatically
  timeout: 15000,
});

// Request Interceptor: Attach JWT token from memory/localStorage as fallback
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fitpilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Normalize errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      success: false,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      statusCode: error.response?.status || 500,
      details: error.response?.data?.error || null,
    };
    return Promise.reject(customError);
  }
);

export default apiClient;
