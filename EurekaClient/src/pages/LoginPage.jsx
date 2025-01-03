import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { googleLogin, login } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

import styles from "./css/LoginPage.module.css";

const LoginPage = () => {
  const { isLoggedIn, user, loginUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      if (user.role === "student") {
        navigate("/student-dashboard");
      } else if (user.role === "teacher") {
        navigate("/teacher-dashboard");
      }
    }
  }, [isLoggedIn, user, navigate]);

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      const response = await googleLogin(credential);
      loginUser(response);
      const { role } = response.user;
      if (role === "student") {
        navigate("/student-dashboard");
      } else if (role === "teacher") {
        navigate("/teacher-dashboard");
      }
    } catch (error) {
      console.error("Google Login failed:", error);
      toast.error("Google login failed. Please try again.");
    }
  };

  const handleLoginSubmit = async (values) => {
    try {
      const { emailOrUsername, password } = values;
      const response = await login(emailOrUsername, password);
      const { username, access_token, role } = response;
      loginUser({ username, access_token, role });
      toast.success("Login Successfully!");

      if (role === "student") {
        navigate("/student-dashboard");
      } else if (role === "teacher") {
        navigate("/teacher-dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(error.message || "Login failed. Please try again.");
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
          <h1 className={styles.h1}>Login</h1>
          <div className={styles.tabs}>
            <Link to="/signup" className={styles.logintab}>
              SIGN UP
            </Link>
            <span className={styles.active}>LOGIN</span>
          </div>
          <Formik
            initialValues={{ emailOrUsername: "", password: "" }}
            validationSchema={Yup.object({
              emailOrUsername: Yup.string()
                .required("Required")
                .min(3, "Too short")
                .max(150, "Too long"),
              password: Yup.string()
                .min(6, "Too short")
                .matches(/[a-zA-Z]/, "Must contain a letter")
                .required("Required"),
            })}
            onSubmit={handleLoginSubmit}
          >
            <Form className={styles.form}>
              <div className="mb-3">
                <label htmlFor="emailOrUsername">Email or Username</label>
                <Field name="emailOrUsername" type="text" className="form-control" />
                <ErrorMessage name="emailOrUsername" component="div" className="text-danger" />
              </div>
              <div className="password-field">
                <label htmlFor="password">Password</label>
                <Field name="password" type="password" className="form-control" />
                <ErrorMessage name="password" component="div" className="text-danger" />
              </div>
              <button type="submit" className={styles.loginbutton}>LOGIN</button>
            </Form>
          </Formik>

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
              Don't have an account? <Link to="/signup" className="login-tab">Sign up</Link>
            </p> */}
          </div>
        </div>
      </div>
    </div >
  );
};

export default LoginPage;
