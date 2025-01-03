import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/api"; // Import your centralized Axios instance

const Profile = () => {
    const [profile, setProfile] = useState({ username: "", email: "", role: "" });
    const [loading, setLoading] = useState(true);
    const [profileError, setProfileError] = useState(null);
    const [passwordError, setPasswordError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axiosInstance.get("/profile/");
                setProfile(response.data);
            } catch (err) {
                setProfileError(err.response?.data?.detail || "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile((prevProfile) => ({ ...prevProfile, [name]: value }));
    };

    const toggleEditing = () => {
        setIsEditing(!isEditing);
    };

    const saveProfile = async () => {
        try {
            const response = await axiosInstance.put("/profile/update/", profile);
            setProfile(response.data);
            setIsEditing(false);
            setProfileError(null);
        } catch (err) {
            setProfileError("Failed to save profile updates");
        }
    };

    const handlePasswordUpdate = async () => {
        try {
            const response = await axiosInstance.put("/profile/password/", {
                current_password: currentPassword,
                new_password: newPassword,
            });

            setPasswordMessage(response.data.message);
            setPasswordError(null);
            setCurrentPassword("");
            setNewPassword("");
        } catch (err) {
            setPasswordError(err.response?.data?.detail || "An error occurred");
            setPasswordMessage("");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div
            style={{
                maxWidth: "600px",
                margin: "0 auto",
                padding: "20px",
                backgroundColor: "#F3E3ED",
                borderRadius: "8px",
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
            }}
        >
            <h2
                style={{
                    textAlign: "center",
                }}
            >
                Profile Details
            </h2>
            {profileError && (
                <div style={{ color: "red", fontSize: "0.9em" }}>{profileError}</div>
            )}
            <form>
                <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                        Username:
                    </label>
                    <input
                        type="text"
                        name="username"
                        value={profile.username}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid gray",
                            borderRadius: "4px",
                        }}
                    />
                </div>
                <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                        Email:
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid gray",
                            borderRadius: "4px",
                        }}
                    />
                </div>
                <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                        Role:
                    </label>
                    <input
                        type="text"
                        name="role"
                        value={profile.role}
                        disabled={true}
                        style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            backgroundColor: "#f1f1f1",
                        }}
                    />
                </div>

                <div style={{ textAlign: "center" }}>
                    {isEditing ? (
                        <button
                            type="button"
                            onClick={saveProfile}
                            style={{
                                padding: "10px 20px",
                                color: "#fff",
                                backgroundColor: "#9D78BE",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                marginBottom: "20px",
                            }}
                        >
                            Save Changes
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={toggleEditing}
                            style={{
                                padding: "10px 20px",
                                color: "#fff",
                                backgroundColor: "#6c63ff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                marginBottom: "20px",
                            }}
                        >
                            Edit
                        </button>
                    )}
                </div>
            </form>

            <h2
                style={{
                    marginTop: "30px",
                    fontSize: "24px",
                    color: "#333",
                    textAlign: "left",
                    borderBottom: "2px solid #5a54cc",
                    paddingBottom: "5px",
                }}
            >
                Change Password
            </h2>
            {passwordMessage && (
                <p style={{ color: "green", fontSize: "0.9em" }}>{passwordMessage}</p>
            )}
            {passwordError && (
                <p style={{ color: "red", fontSize: "0.9em" }}>{passwordError}</p>
            )}
            <div style={{ marginBottom: "15px" }}>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                    Current Password:
                </label>
                <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                    }}
                />
            </div>
            <div style={{ marginBottom: "15px" }}>
                <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                    New Password:
                </label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                    }}
                />
            </div>
            <button
                onClick={handlePasswordUpdate}
                style={{
                    display: "block",
                    margin: "20px 0",
                    marginLeft: "205px",
                    padding: "10px 15px",
                    border: "none",
                    color: "white",
                    backgroundColor: "#6c63ff",
                    borderRadius: "5px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                }}
            >
                Update Password
            </button>
        </div>
    );
};

export default Profile;
