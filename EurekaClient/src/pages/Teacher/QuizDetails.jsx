import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import { toast } from "react-toastify";

const QuizDetails = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [isTabSwitched, setIsTabSwitched] = useState(false); // State to track tab switching
  const navigate = useNavigate();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched to another tab
        setIsTabSwitched(true);
        toast.warning("You switched tabs! Please stay on this page.");
      } else {
        // User returned to the quiz tab
        setIsTabSwitched(false);
      }
    };

    // Adding event listener for tab visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      // Clean up event listener
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Fetch quiz details
  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const response = await api.get(`/quiz/${quizId}`);
        setQuiz(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch quiz details.");
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [quizId]);

  // Fetch all questions for the quiz
  useEffect(() => {
    const fetchQuizQuestions = async () => {
      try {
        const response = await api.get(`/quiz/${quizId}/questions`);
        setQuizQuestions(response.data);
      } catch (err) {
        setError("Failed to fetch questions for this quiz.");
      }
    };

    fetchQuizQuestions();
  }, [quizId]);

  // Fetch all available questions (if needed for modal)
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get("/questions");
        setQuestions(response.data);
      } catch (err) {
        setError("Failed to fetch questions.");
      }
    };

    fetchQuestions();
  }, []);

  const addQuestionToQuiz = async () => {
    if (!selectedQuestionId) {
      toast.error("Please select a valid question.");
      return;
    }

    try {
      const response = await api.post("/quiz-question/", {
        quiz_id: quizId,
        question_id: selectedQuestionId,
      });
      toast.success("Question added successfully!");

      // Find the selected question by ID
      const selectedQuestion = questions.find(
        (q) => String(q.id) === String(selectedQuestionId)
      );

      if (!selectedQuestion) {
        toast.error("Selected question not found.");
        return;
      }

      // Avoid adding duplicates
      setQuizQuestions((prevQuestions) => {
        if (prevQuestions.some((q) => q.id === selectedQuestionId)) {
          toast.warning("This question has already been added.");
          return prevQuestions;
        }

        return [
          ...prevQuestions,
          {
            id: selectedQuestionId,
            question_text: selectedQuestion.question_text,
            question_type: selectedQuestion.question_type,
            choices: selectedQuestion.choices,
            correct_answer: selectedQuestion.correct_answer,
          },
        ];
      });

      setShowModal(false); // Close the modal after successful addition
      navigate(`/quiz-details/${quizId}`); // Refresh the page to reflect the changes
    } catch (err) {
      console.error(err);
      toast.error("Failed to add question.");
    }
  };

  if (loading) {
    return <div>Loading quiz details...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container-bg">
      <h2
        className="text-left"
        style={{ textTransform: "capitalize", marginBottom: "1rem" }}
      >
        {quiz.quiz_name}
      </h2>
      <p className="text-left">Assigned To: {quiz.class_name}</p>
      <p className="text-left">
        Schedule: {quiz.schedule_start} to {quiz.schedule_end}
      </p>
      <p className="text-left">Time Limit: {quiz.duration_minutes} minutes</p>

      {/* Modal for selecting question */}
      {showModal && (
        <div className="modal show" style={{ display: "block" }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Select a Question</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <select
                  className="form-select"
                  onChange={(e) => setSelectedQuestionId(e.target.value)}
                  value={selectedQuestionId}
                >
                  <option value="">Select a question</option>
                  {questions.map((question) => (
                    <option key={question.id} value={question.id}>
                      {question.question_text}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn btn-warning" onClick={addQuestionToQuiz}>
                  Add Question
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Display questions in a table */}
      <div className="d-flex justify-content-between align-items-center mb-3 mt-5">
        <h2 className="mb-0">Questions in this Quiz</h2>
        <div className="d-flex gap-2">
          <button
            className="btn btn-warning"
            onClick={() => setShowModal(true)}
          >
            Add Existing Question
          </button>
          <button
            className="btn btn-success"
            onClick={() => navigate("/questions")}
          >
            Add New Question
          </button>
        </div>
      </div>

      {quizQuestions.length > 0 ? (
        <div className="table-responsive">
          <table className="qtable">
            <thead>
              <tr>
                <th>Questions</th>
                <th>Type</th>
                <th>Choices</th>
                <th>Correct Answer</th>
              </tr>
            </thead>
            <tbody>
              {quizQuestions.map((question, index) => (
                <tr key={`${question.id}-${index}`}>
                  <td>{question.question_text}</td>
                  <td>{question.question_type || "N/A"}</td>
                  <td>
                    {question.choices?.join(", ") || "No choices available"}
                  </td>
                  <td>{question.correct_answer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center">No questions added to this quiz yet.</p>
      )}
    </div>
  );
};

export default QuizDetails;
