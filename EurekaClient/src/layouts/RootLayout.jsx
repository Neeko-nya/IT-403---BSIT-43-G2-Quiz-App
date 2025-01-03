import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RootLayout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    logoutUser(); // Clear context and localStorage
    navigate("/login"); // Redirect to login
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleModalConfirm = () => {
    handleLogout();
    setShowModal(false);
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light px-4">
        <Link className="navbar-brand" to="/">
          MyApp
        </Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto">
            {user?.role === "student" && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/student-dashboard">
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/student-courses">
                    Courses
                  </Link>
                </li>
              </>
            )}
            {user?.role === "teacher" && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/teacher-dashboard">
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/quizzes">
                    Quizzes
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/questions">
                    Questions
                  </Link>
                </li>
              </>
            )}
          </ul>
          {user?.role === "student" && (
            <button
              className="btn btn-outline-primary ms-2"
              onClick={() => navigate("/profile/student")}
            >
              Profile
            </button>
          )}
          {user?.role === "teacher" && (
            <button
              className="btn btn-outline-primary ms-2"
              onClick={() => navigate("/profile/")}
            >
              Profile
            </button>
          )}

          <button
            className="btn btn-outline-danger ms-auto"
            onClick={() => setShowModal(true)}
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="container mt-4">{children}</main>

      {showModal && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Logout</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleModalClose}
                ></button>
              </div>
              <div className="modal-body">
                <p>Pag nag logout kana wala ng balikan okay?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleModalClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleModalConfirm}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RootLayout;
