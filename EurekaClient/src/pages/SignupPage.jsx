import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { googleLogin, signup } from "../services/authService";
import { toast } from "react-toastify";
import styles from "./css/SignupPage.module.css";
const SignupPage = () => {
  const navigate = useNavigate();
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse; // Google token from the credentialResponse
      const response = await googleLogin(credential); // Pass the token to the backend

      // Update the user context or state (e.g., using React context or Redux)
      loginUser(response); // Assuming loginUser is a function to update context state

      // Based on the role, navigate to the appropriate dashboard
      const { role } = response;
      if (role === "student") {
        navigate("/student-dashboard");
      } else if (role === "teacher") {
        navigate("/teacher-dashboard");
      }
    } catch (error) {
      console.error("Google Login failed:", error); // Handle any errors during login
    }
  };

  const handleSignupSubmit = async (values) => {
    try {
      const { email, password, role, username } = values;
      const response = await signup(username, email, password, role);
      // Show success toast
      toast.success("Signup successful! Please login.");
      navigate("/login");
    } catch (error) {
      toast.error("Signup failed. Please try again.");
    }
  };

  return (
    <div className={styles.maincontainer}>
      <div className={styles.circle}></div>
      <div className={styles.circle1}></div>
      <div className={styles.circle2}></div>
      <div className={styles.circle3}></div>
      <div className={styles.circle4}></div>
      <div className={styles.circle5}></div>
      <div className={styles.circle6}></div>

      <div className={styles.contentwrapper}>
        <div className={styles.logosection}>
          <div className={styles.logologin}>Your Logo</div>
        </div>
        <div className={styles.formsection}>
          <h1 style={{ fontWeight: "bold", fontSize: 45, color: "black", }}>Welcome to Eureka</h1>
          <h1 className={styles.h1}>SIGNUP</h1>
          <div className={styles.tabs}>
            <span className={styles.active}>SIGNUP</span>
            <Link to="/login" className={styles.signtab}>
              LOGIN
            </Link>
          </div>

          {/* Formik Signup Form */}
          <Formik
            initialValues={{
              username: "",
              email: "",
              password: "",
              confirmPassword: "",
              role: "",
            }}
            validationSchema={Yup.object({
              username: Yup.string()
                .min(3, "Username must be at least 3 characters")
                .max(20, "Username must be 20 characters or less")
                .required("Required"),
              email: Yup.string()
                .email("Invalid email address")
                .required("Required"),
              password: Yup.string()
                .min(6, "Password is too short")
                .required("Required"),
              confirmPassword: Yup.string()
                .oneOf([Yup.ref("password"), null], "Passwords must match")
                .required("Required"),
              role: Yup.string().required("Please select a role"), // Role is required
            })}
            onSubmit={handleSignupSubmit}
          >
            <Form className={styles.form}>
              <div className="mb-3">
                <label htmlFor="username">Username</label>
                <Field name="username" type="text" className="form-control" />
                <ErrorMessage
                  name="username"
                  component="div"
                  className="text-danger"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="email">Email</label>
                <Field name="email" type="email" className="form-control" />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-danger"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password">Password</label>
                <Field name="password" type="password" className="form-control" />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-danger"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <Field
                  name="confirmPassword"
                  type="password"
                  className="form-control"
                />
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="text-danger"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="role">Role</label>
                <Field as="select" name="role" className="form-control">
                  <option value="">Select your role</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </Field>
                <ErrorMessage
                  name="role"
                  component="div"
                  className="text-danger"
                />
              </div>
              <button type="submit" className={styles.signupbutton}>
                LOGIN
              </button>
            </Form>
          </Formik>

          <hr />
          <div className={styles.divider}>or</div>

          <div className={styles.googleloginwrapper}>
            <GoogleLogin
              shape="circle"
              onSuccess={handleGoogleLogin}
              onError={(error) => console.error("Google login failed", error)}
              width={300}
              className={styles.googleloginwrapper}
            />
          </div>

          <div className="mt-3 text-center">
            {/* <p>
              Already have an account? <Link to="/login">Login</Link>
            </p> */}
          </div>
        </div>
      </div>
    </div>

  );
};

export default SignupPage;
