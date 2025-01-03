import api from "../utils/api"; // Import the API configuration from utils/api.js

// Google Login Service
export const googleLogin = (token) => {
  return api
    .post("auth/google/", { token }) // Send the token to the backend
    .then((response) => {
      const { username, email, access_token, role } = response.data;

      // Store user information in localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({ username, email, access_token, role })
      );

      // Return the response data so it can be used further
      return response.data;
    })
    .catch((error) => {
      console.error("Error during Google login service:", error); // Handle errors from the API
      throw error; // Re-throw the error for further handling in the component
    });
};

const storedUser = JSON.parse(localStorage.getItem("user"));

// Regular Login Service
export const login = async (email, password) => {
  try {
    const response = await api.post(
      "auth/login/",
      { email, password },
      {
        headers: {
          Authorization: `Bearer ${storedUser?.access_token}`,
        },
      }
    );
    console.log("response sa login", response);
    const { username, access_token, role } = response.data;
    console.log("response", response.data);

    localStorage.setItem(
      "user",
      JSON.stringify({ username, access_token, role })
    );
    return response.data; // Now includes role
  } catch (error) {
    console.error("Login failed:", error);
    throw error; // Re-throw error for further handling
  }
};

// Regular Signup Service
export const signup = async (username, email, password, role) => {
  try {
    const response = await api.post("auth/signup/", {
      username,
      email,
      password,
      role,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response ? error.response.data.detail : error.message
    );
  }
};

// Logout Service
export const logout = () => {
  localStorage.removeItem("user");
};

// Optional: Add other authentication-related API calls here as needed (e.g., logout, reset password)
