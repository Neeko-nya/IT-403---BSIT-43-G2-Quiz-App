import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext"; // Import AuthProvider
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import StudentDashboard from "./pages/Student/StudentDashboard";
import TeacherDashboard from "./pages/Teacher/TeacherDashboard";
import Profile from "./pages/Teacher/Profile";
import ClassDetails from "./pages/Teacher/ClassDetails"; // Import the ClassDetails component
import RootLayout from "./layouts/RootLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Bounce } from "react-toastify";
import Questions from "./pages/Teacher/Questions";
import Quizzes from "./pages/Teacher/Quizzes";
import Courses from "./pages/Student/Courses";
import QuizDetails from "./pages/Teacher/QuizDetails";
import ClassDetailsStudent from "./pages/Student/ClassDetailsStudent";
import QuizDetailsStudent from "./pages/Student/QuizDetailsStudent";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Protected Routes */}
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute role="student" component={<StudentDashboard />} />
            }
          />
          <Route
            path="/student-courses"
            element={<ProtectedRoute role="student" component={<Courses />} />}
          />
          <Route
            path="/profile/student"
            element={<ProtectedRoute role="student" component={<Profile />} />}
          />
          <Route
            path="/quiz-details/"
            element={
              <ProtectedRoute
                role="student"
                component={<QuizDetailsStudent />}
              />
            }
          />
          <Route
            path="/student-classes/:id"
            element={
              <ProtectedRoute
                role="student"
                component={<ClassDetailsStudent />}
              />
            }
          />
          <Route
            path="/teacher-dashboard"
            element={
              <ProtectedRoute role="teacher" component={<TeacherDashboard />} />
            }
          />
          <Route
            path="/quizzes"
            element={<ProtectedRoute role="teacher" component={<Quizzes />} />}
          />
          <Route
            path="/questions"
            element={
              <ProtectedRoute role="teacher" component={<Questions />} />
            }
          />
          <Route
            path="/teacher-classes/:id"
            element={
              <ProtectedRoute role="teacher" component={<ClassDetails />} />
            }
          />
          <Route
            path="/quiz-details/:quizId"
            element={
              <ProtectedRoute role="teacher" component={<QuizDetails />} />
            }
          />
          <Route
            path="/profile"
            element={<ProtectedRoute role="teacher" component={<Profile />} />}
          />
        </Routes>

        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          transition={Bounce}
          stacked
        />
      </Router>
    </AuthProvider>
  );
};

// ProtectedRoute component to redirect to login if user is not authenticated or role mismatch
const ProtectedRoute = ({ role, component }) => {
  const { user } = useAuth();
  console.log("Protected Route", user);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== role) {
    return <Navigate to="/login" />;
  }

  return (
    <RootLayout>
      {component} {/* Render the passed component for this route */}
    </RootLayout>
  );
};

export default App;
