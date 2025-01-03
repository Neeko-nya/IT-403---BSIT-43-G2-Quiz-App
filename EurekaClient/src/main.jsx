import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google"; // Import GoogleOAuthProvider
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/index.css";
import "./css/app.css";

// Replace with your actual Google OAuth client ID
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Wrap the app with GoogleOAuthProvider and pass the clientId */}
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
