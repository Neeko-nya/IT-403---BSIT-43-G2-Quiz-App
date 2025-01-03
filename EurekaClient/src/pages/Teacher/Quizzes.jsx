import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { Link } from "react-router-dom";
import styles from '../css/Quizzes.module.css';
const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [quizData, setQuizData] = useState({
    title: "",
    assignTo: "",
    startDate: "",
    endDate: "",
    timeLimit: "",
  });
  const [showAddQuizModal, setShowAddQuizModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizzesResponse, classesResponse] = await Promise.all([
          api.get("/quizzes"),
          api.get("/classes"),
        ]);

        setQuizzes(
          quizzesResponse.data.map((quiz) => ({
            id: quiz.id,
            title: quiz.quiz_name,
            assignTo: quiz.class_name,
            startDate: quiz.schedule_start,
            endDate: quiz.schedule_end,
            timeLimit: quiz.duration_minutes,
          }))
        );

        setClasses(
          classesResponse.data.map((cls) => ({
            id: cls.id || cls.class_id,
            class_name: cls.class_name || cls.name,
          }))
        );

        setLoading(false);
      } catch (err) {
        setError("Failed to load data.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleQuizInputChange = (e) => {
    const { name, value } = e.target;
    setQuizData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveQuiz = async () => {
    if (!quizData.title.trim()) {
      alert("Quiz title cannot be empty!");
      return;
    }
    if (new Date(quizData.endDate) < new Date(quizData.startDate)) {
      alert("End date cannot be earlier than start date.");
      return;
    }

    try {
      const response = await api.post("/quizzes/", {
        quiz_name: quizData.title,
        class_id: parseInt(quizData.assignTo),
        schedule_start: quizData.startDate,
        schedule_end: quizData.endDate,
        duration_minutes: parseInt(quizData.timeLimit),
      });

      setQuizzes((prevQuizzes) => [
        ...prevQuizzes,
        {
          id: response.data.id,
          title: quizData.title,
          assignTo: classes.find(
            (cls) => cls.id === parseInt(quizData.assignTo)
          ).class_name,
          startDate: quizData.startDate,
          endDate: quizData.endDate,
          timeLimit: quizData.timeLimit,
        },
      ]);

      setShowAddQuizModal(false);
      setQuizData({
        title: "",
        assignTo: "",
        startDate: "",
        endDate: "",
        timeLimit: "",
      });
    } catch (err) {
      alert("Failed to save quiz. Please try again.");
    }
  };

  return (
    
    <div className="container-bg">
      <h1 className={styles.title}>Quizzes</h1>

      <button
          type="button"
          className="btn btn-warning"
          style={{
            marginBottom: "10px", // Use camelCase and string with units
          }}
          onClick={() => setShowAddQuizModal(true)}
        >
          +  ADD NEW QUIZ
        </button>

      {loading ? (
        <div className="alert alert-info">Loading quizzes...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className={styles.quizList}>
          {quizzes.map((quiz, index) => (
            <div
              key={index}
              className={styles.quizCard}
              style={{ cursor: "pointer"}}
            >
              <Link
                to={`/quiz-details/${quiz.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="card-body">
                  <h5 className={styles.cardTitle} 
                  style={{ textTransform: "capitalize",
                  }}>{quiz.title}</h5>
                  <p className="card-text">Assigned To: {quiz.assignTo}</p>
                  <p className="card-text">
                    Schedule: {quiz.startDate} to {quiz.endDate}
                  </p>
                  <p className="card-text">
                    Time Limit: {quiz.timeLimit} minutes
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )
      }


      {
        showAddQuizModal && (
          <div className={`modal show d-block ${styles.modal}`} tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Set up your Quiz</h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => setShowAddQuizModal(false)}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form>
                    <div className="form-group">
                      <label htmlFor="quizTitle">Quiz Title</label>
                      <input
                        type="text"
                        className="form-control"
                        id="quizTitle"
                        name="title"
                        placeholder="Quiz Title"
                        value={quizData.title}
                        onChange={handleQuizInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="assignTo">Assign To Class</label>
                      <select
                        className="form-control"
                        id="assignTo"
                        name="assignTo"
                        value={quizData.assignTo}
                        onChange={handleQuizInputChange}
                      >
                        {classes.length === 0 ? (
                          <option value="">No classes available</option>
                        ) : (
                          classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.class_name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="startDate">Start Date</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        id="startDate"
                        name="startDate"
                        value={quizData.startDate}
                        onChange={handleQuizInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="endDate">End Date</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        id="endDate"
                        name="endDate"
                        value={quizData.endDate}
                        onChange={handleQuizInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="timeLimit">Time Limit (minutes)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="timeLimit"
                        name="timeLimit"
                        placeholder="Time Limit (minutes)"
                        value={quizData.timeLimit}
                        onChange={handleQuizInputChange}
                      />
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-warning" onClick={handleSaveQuiz}>
                    Save Quiz
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowAddQuizModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Quizzes;
