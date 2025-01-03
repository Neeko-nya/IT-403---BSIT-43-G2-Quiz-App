import { useState, useEffect } from "react";

// Custom hook to manage authentication state
export const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user details from localStorage (or another state management solution)
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  return { user };
};
