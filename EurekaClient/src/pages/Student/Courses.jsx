import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/api";

const Courses = () => {
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchJoinedClasses = async () => {
      try {
        const response = await axiosInstance.get("/joined-classes/");
        console.log(response.data); // Add this line to see the data
        setClasses(response.data);
        setError("");
      } catch (err) {
        setError(
          err.response?.data?.detail || "Failed to fetch joined classes."
        );
      }
    };

    fetchJoinedClasses();
  }, []);

  return (
    <div>
      <h1>Joined Classes</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {classes.map((cls) => (
          <li key={cls.class_id}>
            <h3>{cls.class_name}</h3>
            <p>Class ID: {cls.class_id}</p>
            <p>Teacher: {cls.teacher_name}</p>
            <p>Max Students: {cls.max_students}</p>
            <p>Enrolled Students: {cls.enrolled_students_count}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Courses;
