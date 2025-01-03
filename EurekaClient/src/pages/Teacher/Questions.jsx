import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    question_type: "identification",
    correct_answer: "",
    choices: [],
  });
  const [editingQuestion, setEditingQuestion] = useState(null); // State for editing question
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility
  const navigate = useNavigate();

  const fetchQuestions = async () => {
    try {
      const response = await api.get("/questions/"); // Replace with your endpoint
      setQuestions(response.data);
    } catch (err) {
      setError("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/questions/${id}/`); // Endpoint to delete the question
      toast.success("Question deleted successfully!");
      setQuestions(questions.filter((question) => question.id !== id)); // Remove deleted question from state
    } catch (err) {
      console.error("Error deleting question:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to delete question. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question); // Set the question to be edited
    setNewQuestion({
      question_text: question.question_text,
      question_type: question.question_type,
      correct_answer: question.correct_answer,
      choices: question.choices || [],
    });
    setModalVisible(true); // Show the modal for editing
  };

  const handleAddQuestion = async () => {
    const { question_text, question_type, correct_answer, choices } =
      newQuestion;

    // Validation checks
    if (!question_text.trim() || !correct_answer.trim()) {
      toast.error("Question text and correct answer cannot be empty!");
      return;
    }

    if (
      question_type === "multiple choice" &&
      (!choices || choices.filter((choice) => choice.trim() !== "").length < 2)
    ) {
      toast.error(
        "Multiple-choice questions require at least two valid options."
      );
      return;
    }

    if (
      question_type === "true or false" &&
      !["true", "false"].includes(correct_answer.toLowerCase())
    ) {
      toast.error(
        "True or False questions require a correct answer of 'True' or 'False'."
      );
      return;
    }

    // Prepare data for request
    const requestData = {
      question_text,
      question_type,
      correct_answer,
      choices,
    };

    try {
      // Add the new question
      const response = await api.post("/add-question/", requestData);
      setQuestions([...questions, response.data]); // Add the new question to the list
      toast.success("Question added successfully!");

      // Reset state after adding the question
      resetForm();
    } catch (err) {
      console.error("Error adding question:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to add question. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleUpdateQuestion = async () => {
    const { question_text, question_type, correct_answer, choices } =
      newQuestion;

    // Validation checks
    if (!question_text.trim() || !correct_answer.trim()) {
      toast.error("Question text and correct answer cannot be empty!");
      return;
    }

    if (
      question_type === "multiple choice" &&
      (!choices || choices.filter((choice) => choice.trim() !== "").length < 2)
    ) {
      toast.error(
        "Multiple-choice questions require at least two valid options."
      );
      return;
    }

    if (
      question_type === "true or false" &&
      !["true", "false"].includes(correct_answer.toLowerCase())
    ) {
      toast.error(
        "True or False questions require a correct answer of 'True' or 'False'."
      );
      return;
    }

    // Prepare data for request
    const requestData = {
      question_text,
      question_type,
      correct_answer,
      choices,
    };

    try {
      // Update the question if we are editing
      await api.patch(`/update-question/${editingQuestion.id}/`, requestData); // Use PATCH and update URL
      toast.success("Question updated successfully!");

      // Reset state after updating the question
      resetForm();
      navigate("/questions"); // Refresh the page to reflect the changes
    } catch (err) {
      console.error("Error updating question:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to update question. Please try again.";
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setNewQuestion({
      question_text: "",
      question_type: "identification",
      correct_answer: "",
      choices: [],
    });
    setModalVisible(false); // Close the modal
    setEditingQuestion(null); // Reset editing state
  };

  const renderAnswerInput = () => {
    if (newQuestion.question_type === "true or false") {
      return (
        <div>
          <label>
            <input
              type="radio"
              name="correct_answer"
              value="true"
              checked={newQuestion.correct_answer === "true"}
              onChange={() =>
                setNewQuestion({ ...newQuestion, correct_answer: "true" })
              }
            />
            True
          </label>
          <label style={{ marginLeft: "10px" }}>
            <input
              type="radio"
              name="correct_answer"
              value="false"
              checked={newQuestion.correct_answer === "false"}
              onChange={() =>
                setNewQuestion({ ...newQuestion, correct_answer: "false" })
              }
            />
            False
          </label>
        </div>
      );
    } else {
      return (
        <input
          type="text"
          placeholder="Enter correct answer"
          value={newQuestion.correct_answer}
          onChange={(e) =>
            setNewQuestion({
              ...newQuestion,
              correct_answer: e.target.value,
            })
          }
          className="form-control mb-3"
        />
      );
    }
  };

  const renderChoicesInput = () => {
    if (newQuestion.question_type === "multiple choice") {
      return (
        <div className="mb-3">
          <label>Choices:</label>
          <textarea
            placeholder="Enter choices (comma-separated)"
            value={newQuestion.choices.join(", ")}
            onChange={(e) =>
              setNewQuestion({
                ...newQuestion,
                choices: e.target.value
                  .split(",")
                  .map((choice) => choice.trim()),
              })
            }
            className="form-control"
          />
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  if (loading) return <div>Loading questions...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Questions</h2>

      {/* Add or Edit Question Modal */}
      {modalVisible && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingQuestion ? "Edit a Question" : "Add a Question"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={resetForm}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label>Question:</label>
                  <input
                    type="text"
                    placeholder="Enter question text"
                    value={newQuestion.question_text}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        question_text: e.target.value,
                      })
                    }
                    className="form-control"
                  />
                </div>
                <div className="mb-3">
                  <label>Question Type:</label>
                  <select
                    value={newQuestion.question_type}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        question_type: e.target.value,
                      })
                    }
                    className="form-select"
                  >
                    <option value="identification">Identification</option>
                    <option value="multiple choice">Multiple Choice</option>
                    <option value="enumeration">Enumeration</option>
                    <option value="true or false">True or False</option>
                  </select>
                </div>
                {renderChoicesInput()}
                <div className="mb-3">
                  <label>Answer/s:</label>
                  {renderAnswerInput()}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={
                    editingQuestion ? handleUpdateQuestion : handleAddQuestion
                  }
                >
                  {editingQuestion ? "UPDATE AQUESTION" : "ADD QUESTION"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Button */}
      <div className="mb-3">
        <button
          className="btn btn-warning"
          onClick={() => setModalVisible(true)}
        >
          +  ADD QUESTION
        </button>
      </div>

      {/* List of Questions */}
      {questions.length === 0 ? (
        <p>No questions available.</p>
      ) : (
        <table className="qtable">
          <thead>
            <tr>
              <th>Question Text</th>
              <th>Type</th>
              <th>Correct Answer</th>
              <th>Choices</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <tr key={question.id}>
                <td>{question.question_text}</td>
                <td>{question.question_type}</td>
                <td>{question.correct_answer}</td>
                <td>
                  {question.choices && question.choices.length > 0
                    ? question.choices.join(", ")
                    : "N/A"}
                </td>
                <td>
                  <button
                    onClick={() => handleEdit(question)}
                    className="btn btn-warning btn-sm me-2"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    className="btn btn-danger btn-sm"
                  >
                    DELETE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Questions;
