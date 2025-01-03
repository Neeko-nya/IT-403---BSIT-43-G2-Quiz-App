import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useParams } from "react-router-dom";

const ClassDetails = () => {
    const { id: classId } = useParams();
    const [classData, setClassData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        class_name: "",
        password: "",
        max_students: "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const fetchClassDetails = async () => {
        try {
            const response = await api.get(`classes/${classId}/`);
            setClassData(response.data);
            setFormData({
                class_name: response.data.class_name,
                password: response.data.password,
                max_students: response.data.max_students,
            });
            setLoading(false);
        } catch (err) {
            setError("Failed to load class details");
            setLoading(false);
        }
    };

    const updateClassDetails = async () => {
        try {
            await api.put(`classes/${classId}/`, formData);
            fetchClassDetails();
            setIsEditing(false);
        } catch (err) {
            setError("Failed to update class details");
        }
    };

    const [newStudent, setNewStudent] = useState("");

    const inviteStudent = async () => {
        try {
            const response = await api.post(`/classes/${classId}/join/`, {
                username: newStudent,
            });
            alert(response.data.detail);
            setNewStudent("");
            fetchClassDetails();
        } catch (err) {
            if (err.response) {
                console.error(err.response.data);
                alert(err.response.data.detail || "Failed to invite student");
            } else {
                console.error(err.message);
                alert("Something went wrong. Please try again.");
            }
        }
    };

    const removeStudent = async (username) => {
        try {
            const response = await api.post(`/classes/${classId}/remove-student/`, {
                username,
            });
            alert(response.data.detail);
            fetchClassDetails();
        } catch (err) {
            if (err.response) {
                console.error(err.response.data);
                alert(err.response.data.detail || "Failed to remove student");
            } else {
                console.error(err.message);
                alert("Something went wrong. Please try again.");
            }
        }
    };

    useEffect(() => {
        fetchClassDetails();
    }, [classId]);

    const styles = {
        container: {
            padding: "30px",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            backgroundColor: "#F3E3ED",
            borderRadius: "8px",
            maxWidth: "900px",
            margin: "auto",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
        },
        header: {
            color: "black", // Changed to black
            fontSize: "26px",
            fontWeight: "600",
            marginBottom: "20px",
            borderBottom: "2px solid #f1f1f1",
            paddingBottom: "10px",
        },
        subHeader: {
            marginBottom: "15px",
            color: "black",
            fontSize: "18px",
            fontWeight: "500",
        },
        label: {
            fontSize: "14px",
            fontWeight: "500",
            marginBottom: "8px",
            color: "gray",
        },
        input: {
            padding: "10px 15px",
            fontSize: "14px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            width: "100%",
            marginBottom: "20px",
        },
        button: {
            padding: "12px 20px",
            backgroundColor: "#9D78BE",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
            transition: "background-color 0.3s ease",
        },
        buttonSecondary: {
            padding: "12px 20px",
            backgroundColor: "#6c757d",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
            transition: "background-color 0.3s ease",
        },
        table: {
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "30px",
            marginBottom: "20px",
        },
        th: {
            textAlign: "left",
            backgroundColor: "#f1f1f1",
            padding: "10px 15px",
            borderBottom: "2px solid #ddd",
            color: "black", // Changed to black
        },
        td: {
            padding: "10px 15px",
            borderBottom: "1px solid #ddd",
            color: "black", // Changed to black
        },
        inviteCard: {
            backgroundColor: "#9D78BE",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            width: "100%",
            marginBottom: "30px",
        },
        inviteInput: {
            width: "100%",
            marginRight: "10px",
        },
        studentActions: {
            display: "flex",
            gap: "10px",
        },
    };


    if (loading) {
        return <div style={styles.container}>Loading...</div>;
    }

    if (error) {
        return <div style={styles.container}>{error}</div>;
    }

    if (classData) {
        return (
            <div style={styles.container}>
                {!isEditing ? (
                    <>
                        <h2 style={{ textTransform: "capitalize" }}>{classData.class_name}</h2>
                        <div>
                            <p style={styles.subHeader}>
                                <strong>Teacher:</strong> {classData.teacher_name}
                            </p>
                            <p style={styles.subHeader}>
                                <strong>Max Students:</strong> {classData.max_students}
                            </p>
                            <p style={styles.subHeader}>
                                <strong>Password:</strong> {classData.password || "N/A"}
                            </p>
                        </div>

                        <div style={styles.inviteCard}>
                            <h3 style={styles.subHeader}>Invite a Student</h3>
                            <div>
                                <input
                                    type="text"
                                    placeholder="Enter student username"
                                    value={newStudent}
                                    onChange={(e) => setNewStudent(e.target.value)}
                                    style={styles.input}
                                />
                                <button
                                    style={styles.button}
                                    onClick={inviteStudent}
                                    disabled={!newStudent}
                                >
                                    Invite
                                </button>
                            </div>
                        </div>

                        <h3 style={styles.subHeader}>Enrolled Students</h3>
                        {classData.enrolled_students.length > 0 ? (
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Student Username</th>
                                        <th style={styles.th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classData.enrolled_students.map((student, index) => (
                                        <tr key={index}>
                                            <td style={styles.td}>{student}</td>
                                            <td style={styles.td}>
                                                <div style={styles.studentActions}>
                                                    <button
                                                        style={styles.buttonSecondary}
                                                        onClick={() => removeStudent(student)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No students enrolled</p>
                        )}

                        <button
                        className="btn btn-warning"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Class
                        </button>
                    </>
                ) : (
                    <div>
                        <h2>Edit Class</h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                updateClassDetails();
                            }}
                        >
                            <div>
                                <label style={styles.label}>Class Name</label>
                                <input
                                    type="text"
                                    name="class_name"
                                    value={formData.class_name}
                                    onChange={handleInputChange}
                                    required
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Password</label>
                                <input
                                    type="text"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Max Students</label>
                                <input
                                    type="number"
                                    name="max_students"
                                    value={formData.max_students}
                                    onChange={handleInputChange}
                                    required
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <button type="submit" className="btn btn-warning" style={{ marginRight: "5px"}}>
                                    Save Changes
                                </button>
                                <button
                                    type="button" className="btn btn-secondary"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default ClassDetails;
