import axios from "axios";

// Kunin ung token changes para sa putanginang 401 error
const getAuthToken = () => {
  const storedUser = JSON.parse(localStorage.getItem("user")); 
  return storedUser?.access_token || null;
};

const axiosInstance = axios.create({
  baseURL: "http://127.0.0.1:8000/api", // Update with your backend API URL
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Authorization added sa header ng axios kada changes
axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optionally, intercept responses to handle token expiration or refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is due to authentication failure (401 Unauthorized)
    if (error.response && error.response.status === 401) {
      // Handle the 401 case
      localStorage.removeItem("user"); // Optionally clear the user data
      window.location.href = "/login"; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
