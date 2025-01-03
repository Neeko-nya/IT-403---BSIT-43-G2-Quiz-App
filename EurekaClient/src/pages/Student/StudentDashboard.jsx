import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api"; // Import your centralized Axios config
import { toast } from "react-toastify";

const StudentDashboard = () => {
  const [classPassword, setClassPassword] = useState("");
  const [classes, setClasses] = useState([]);
  const navigate = useNavigate();

  // Fetch joined classes
  useEffect(() => {
    const fetchJoinedClasses = async () => {
      try {
        const response = await api.get("/joined-classes/");
        setClasses(response.data);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to fetch joined classes.");
      }
    };

    fetchJoinedClasses();
  }, []);

  // Handle joining a class
  const handleJoinClass = async () => {
    if (!classPassword.trim()) {
      toast.error("Please enter a class password!");
      return;
    }

    try {
      const response = await api.post("/join-class/", {
        password: classPassword,
      });
      toast.success(response.data.detail);

      // Optionally, update the state without re-fetching
      setClasses((prevClasses) => [...prevClasses, response.data.class]);
      setClassPassword("");
    } catch (error) {
      console.error("Error joining class:", error);
      toast.error(
        "Failed to join class. Please check the password and try again."
      );
    }
  };

  // Navigate to class details page
  const handleViewClass = (classId) => {
    navigate(`/student-classes/${classId}`); // Redirect to class details page
  };

  return (
    <div>
      <h1>Student Dashboard</h1>

      {/* Join Class Form */}
      <div className="mb-4">
        <input
          type="password"
          className="form-control"
          placeholder="Enter class password"
          value={classPassword}
          onChange={(e) => setClassPassword(e.target.value)}
        />
        <button className="btn btn-primary mt-2" onClick={handleJoinClass}>
          Join Class
        </button>
      </div>

      {/* Display Joined Classes */}
      <div className="row">
        {classes.map((cls, index) => (
          <div className="col-md-4" key={index}>
            <div
              className="card mb-4"
              onClick={() => handleViewClass(cls.class_id)}
            >
              <div className="card-body">
                <h5 className="card-title">{cls.class_name}</h5>
                <p className="card-text">Teacher: {cls.teacher_name}</p>
                <p className="card-text">Max students: {cls.max_students}</p>
                <p className="card-text">
                  Students enrolled: {cls.enrolled_students_count || 0}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;
