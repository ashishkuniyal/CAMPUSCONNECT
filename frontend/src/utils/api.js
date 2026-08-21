import axios from "axios";

// Get auth headers with token
export function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Check if user is authenticated
export function isAuthenticated() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return !!(token && user);
}

// Get current user
export function getCurrentUser() {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Error parsing user:", error);
    return null;
  }
}

// Logout user
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

// Setup axios interceptor for token refresh
export function setupAxiosInterceptors() {
  // Set global base URL for all raw axios calls
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  axios.defaults.baseURL = apiUrl.replace(/\/api$/, "");

  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for token expiration
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Check if error is 401 and we haven't already retried
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Check if it's a token expired error
        if (error.response?.data?.code === 'TOKEN_EXPIRED') {
          try {
            // Try to refresh the token
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
              const { data } = await axios.post("/api/auth/refresh", { refreshToken });
              
              // Update tokens
              localStorage.setItem("token", data.accessToken);
              localStorage.setItem("refreshToken", data.refreshToken);
              
              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            logout();
            return Promise.reject(refreshError);
          }
        } else {
          // Token is invalid, logout
          logout();
        }
      }

      return Promise.reject(error);
    }
  );
}
