import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useParams, useNavigate } from "react-router-dom";

const ClassDetailsStudent = () => {
  const { id: classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const fetchClassDetails = async () => {
    try {
      const response = await api.get(`classes/${classId}/`);
      setClassData(response.data);
    } catch (err) {
      console.error("Failed to load class details:", err);
      setError("Failed to load class details.");
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await api.get(`classes/${classId}/quizzes`);
      setQuizzes(response.data);
    } catch (err) {
      console.error("Failed to fetch quizzes:", err);
      setError("Failed to load quizzes.");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(""); // Clear errors before fetching
      await Promise.all([fetchClassDetails(), fetchQuizzes()]);
      setLoading(false);
    };
    loadData();
  }, [classId]);

const handleAnswerQuiz = (quizId) => {
  navigate("/quiz-details", { state: { quizId } });
};

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="class-details">
      <h2>{classData?.class_name}</h2>
      <p>
        <strong>Teacher:</strong> {classData?.teacher_name}
      </p>
      <p>
        <strong>Max Students:</strong> {classData?.max_students}
      </p>
      <p>
        <strong>Password:</strong> {classData?.password || "N/A"}
      </p>

      <h3>Quizzes</h3>
      {quizzes.length > 0 ? (
        <div className="row">
          {quizzes.map((quiz) => (
            <div className="col-md-4" key={quiz.id}>
              <div className="card mb-4">
                <div className="card-body">
                  <h5 className="card-title">{quiz.quiz_name}</h5>
                  <p>
                    <strong>Start:</strong>{" "}
                    {new Date(quiz.schedule_start).toLocaleString()}
                  </p>
                  <p>
                    <strong>End:</strong>{" "}
                    {new Date(quiz.schedule_end).toLocaleString()}
                  </p>
                  <p>
                    <strong>Duration:</strong> {quiz.duration_minutes} minutes
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAnswerQuiz(quiz.id)}
                  >
                    Answer Quiz
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No quizzes available for this class.</p>
      )}
    </div>
  );
};

export default ClassDetailsStudent;
