import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";

const QuizDetailsStudent = () => {
    const location = useLocation();
    const quizId = location.state?.quizId; // Retrieve quizId from state passed via navigate

    const [quizDetails, setQuizDetails] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [answers, setAnswers] = useState([]); // Track user's answers
    const [submissionMessage, setSubmissionMessage] = useState("");
    const [score, setScore] = useState(null); // Store the grade/score
    const [correctAnswers, setCorrectAnswers] = useState(null); // Store correct answers count
    const [totalQuestions, setTotalQuestions] = useState(null); // Store total questions count

    const navigate = useNavigate();

    // Fetch quiz details and questions
    const fetchQuizDetails = async () => {
        if (!quizId) {
            setError("Invalid quiz ID");
            return;
        }

        try {
            const response = await api.get(`/quiz/${quizId}`);
            setQuizDetails(response.data);
        } catch (err) {
            setError("Failed to load quiz details.");
        }
    };

    const fetchQuestions = async () => {
        if (!quizId) {
            setError("Invalid quiz ID");
            return;
        }

        try {
            const response = await api.get(`/quiz/${quizId}/questions`);
            setQuestions(response.data);
        } catch (err) {
            setError("Failed to load questions.");
        }
    };

    useEffect(() => {
        if (!quizId) {
            setError("Invalid quiz ID");
            return;
        }

        const loadData = async () => {
            setLoading(true);
            setError("");
            try {
                await Promise.all([fetchQuizDetails(), fetchQuestions()]);
            } catch (err) {
                setError("An error occurred while fetching quiz data.");
            }
            setLoading(false);
        };

        loadData();
    }, [quizId]);

    // Handle answer change
    const handleAnswerChange = (questionId, answer) => {
        setAnswers((prevAnswers) => {
            const updatedAnswers = prevAnswers.filter(
                (ans) => ans.question_id !== questionId
            );
            updatedAnswers.push({ question_id: questionId, answer });
            return updatedAnswers;
        });
    };

    // Handle form submission
    const handleSubmit = async () => {
        console.log("eto ung answers:", answers);
        try {
            const response = await api.post(`/quiz/${quizId}/submit`, {
                answers: answers,
            });

            setSubmissionMessage(response.data.message);
            setScore(response.data.score);
            setCorrectAnswers(response.data.correct_answers);
            setTotalQuestions(response.data.total_questions);
            setAnswers([]);
        } catch (err) {
            setSubmissionMessage("An error occurred while submitting the quiz.");
        }
    };

    const styles = {
        container: {
            fontFamily: "Arial, sans-serif",
            padding: "20px",
            maxWidth: "900px",
            margin: "0 auto",
            backgroundColor: "#f4f4f4", // Add a light background color for the container
            borderRadius: "8px", // Rounded corners for the container
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)", // Shadow effect to give depth
        },
        heading: {
            textAlign: "center",
            fontSize: "24px",
            color: "#333",
            marginBottom: "20px", // Space below the heading
        },
        paragraph: {
            fontSize: "16px",
            margin: "8px 0",
            color: "#555", // Lighter color for paragraph text
        },
        quizInfo: {
            backgroundColor: "#ffffff", // White background for the quiz details section
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", // Soft shadow for quiz info box
            marginBottom: "20px", // Space below the quiz info section
        },
        infoHeading: {
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "10px", // Space below the heading for each piece of info
        },
        infoValue: {
            fontSize: "16px",
            color: "#333",
            marginBottom: "10px",
        },
        questionCard: {
            border: "1px solid #ddd",
            borderRadius: "5px",
            padding: "15px",
            margin: "10px 0",
            backgroundColor: "#F3E3ED",
        },
        list: {
            listStyleType: "none",
            paddingLeft: "20px",
        },
        label: {
            fontSize: "16px",
        },
        input: {
            marginRight: "10px",
        },
        textarea: {
            width: "100%",
            padding: "8px",
            marginTop: "5px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            resize: "vertical",
        },
        button: {
            padding: "10px 20px",
            fontSize: "16px",
            borderRadius: "5px",
            cursor: "pointer",
            marginTop: "20px",
        },
        btnPrimary: {
            backgroundColor: "#9D78BE",
            color: "white",
            border: "none",
        },
        btnSecondary: {
            backgroundColor: "gray",
            color: "white",
            border: "none",
        },
        errorMessage: {
            color: "red",
            fontSize: "18px",
            textAlign: "center",
            marginTop: "20px",
        },
        scoreMessage: {
            marginTop: "20px",
            fontSize: "18px",
            textAlign: "center",
            color: "#333",
        },
    };


    if (error) {
        return <div style={styles.errorMessage}>{error}</div>;
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.heading}>{quizDetails?.quiz_name}</h2>
            <p style={styles.paragraph}>
                <strong>Start:</strong>{" "}
                {new Date(quizDetails?.schedule_start).toLocaleString()}
            </p>
            <p style={styles.paragraph}>
                <strong>End:</strong>{" "}
                {new Date(quizDetails?.schedule_end).toLocaleString()}
            </p>
            <p style={styles.paragraph}>
                <strong>Duration:</strong> {quizDetails?.duration_minutes} minutes
            </p>

            <h3>Questions</h3>
            {questions.length > 0 ? (
                questions.map((question, index) => (
                    <div key={question.id} style={styles.questionCard}>
                        <h4>
                            {index + 1}. {question.question_text}
                        </h4>
                        {/* Render different question types */}
                        {question.question_type === "multiple choice" &&
                            question.choices && (
                                <ul style={styles.list}>
                                    {question.choices.map((choice, idx) => (
                                        <li key={idx}>
                                            <label style={styles.label}>
                                                <input
                                                    type="radio"
                                                    name={`question_${question.id}`}
                                                    onChange={() =>
                                                        handleAnswerChange(question.id, choice)
                                                    }
                                                    style={styles.input}
                                                />
                                                {choice}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        {question.question_type === "true or false" && (
                            <ul style={styles.list}>
                                <li>
                                    <label style={styles.label}>
                                        <input
                                            type="radio"
                                            name={`question_${question.id}`}
                                            onChange={() => handleAnswerChange(question.id, "True")}
                                            style={styles.input}
                                        />
                                        True
                                    </label>
                                </li>
                                <li>
                                    <label style={styles.label}>
                                        <input
                                            type="radio"
                                            name={`question_${question.id}`}
                                            onChange={() => handleAnswerChange(question.id, "False")}
                                            style={styles.input}
                                        />
                                        False
                                    </label>
                                </li>
                            </ul>
                        )}
                        {question.question_type === "identification" && (
                            <div>
                                <label style={styles.label}>
                                    Answer:
                                    <input
                                        type="text"
                                        onChange={(e) =>
                                            handleAnswerChange(question.id, e.target.value)
                                        }
                                        style={styles.textarea}
                                    />
                                </label>
                            </div>
                        )}
                        {question.question_type === "enumeration" && (
                            <div>
                                <label style={styles.label}>
                                    Answer:
                                    <textarea
                                        onChange={(e) =>
                                            handleAnswerChange(question.id, e.target.value)
                                        }
                                        rows="3"
                                        style={styles.textarea}
                                    ></textarea>
                                </label>
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <p>No questions available for this quiz.</p>
            )}

            <button
                onClick={handleSubmit}
                style={{ ...styles.button, ...styles.btnPrimary }}
            >
                Submit Answers
            </button>

            {submissionMessage && <p>{submissionMessage}</p>}

            {/* Display the grade/score and correct answers after submission */}
            {score !== null && correctAnswers !== null && totalQuestions !== null && (
                <div style={styles.scoreMessage}>
                    <h3>
                        Your Score: {correctAnswers}/{totalQuestions} ({score}%)
                    </h3>
                </div>
            )}

            <button
                onClick={() => navigate(-1)}
                style={{ ...styles.button, ...styles.btnSecondary }}
            >
                Back to Quizzes
            </button>
        </div>
    );
};

export default QuizDetailsStudent;
