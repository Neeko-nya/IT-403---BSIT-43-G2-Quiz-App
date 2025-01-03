import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../utils/api";
import styles from '../css/TeacherDashboard.module.css'; // Import the modular CSS file

const Header = () => {
  return (
    <div className={styles.header}>
      <div className={styles.logoteacher}></div>
      <h1 className={styles.apptitle} style={{ fontWeight: "bold"}}>Teacher Dashboard</h1>
    </div>
  );
};

const CreateClassForm = ({ newClassName, setNewClassName, classPassword, setClassPassword, maxStudents, setMaxStudents, handleCreateClass }) => {
  return (
    <div className={styles.form}>
      <input
        type="text"
        className={styles.forminput}
        placeholder="Enter class name"
        value={newClassName}
        onChange={(e) => setNewClassName(e.target.value)}
      />
      <input
        type="password"
        className={styles.forminput}
        placeholder="Enter class password"
        value={classPassword}
        onChange={(e) => setClassPassword(e.target.value)}
      />
      <input
        type="number"
        className={styles.forminput}
        placeholder="Max Students"
        value={maxStudents}
        onChange={(e) => setMaxStudents(e.target.value)}
        min="1"
      />
      <button className={styles.createclassbutton} onClick={handleCreateClass}>
        Create Class
      </button>
    </div>
  );
};

const ClassCard = ({ cls, handleViewClass }) => {
  return (
    <div className={styles.classcard}>
      <div className={styles.classcard} onClick={() => handleViewClass(cls.id)}>
        <div className={styles.classheader}>
          <h5 className={styles.classheader}>{cls.class_name}</h5>
        </div>
        <div className={styles.classbody}>
          <p className={styles.classbody}>Created by: {cls.teacher_name}</p>
          <p className={styles.classbody}>Max students: {cls.max_students}</p>
          <p className={styles.classbody}>
            Students enrolled: {Array.isArray(cls.enrolled_students) ? cls.enrolled_students.length : 0}
          </p>
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [newClassName, setNewClassName] = useState("");
  const [classPassword, setClassPassword] = useState("");
  const [maxStudents, setMaxStudents] = useState(30);
  const navigate = useNavigate();

  const fetchClasses = async () => {
    try {
      const response = await api.get("/classes/");
      setClasses(response.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to fetch classes.");
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      toast.error("Class name cannot be empty!");
      return;
    }

    try {
      const response = await api.post("/create-class/", {
        class_name: newClassName,
        password: classPassword,
        max_students: maxStudents,
      });

      setClasses((prevClasses) => [...prevClasses, response.data]);
      setNewClassName("");
      setClassPassword("");
      setMaxStudents(30);
      toast.success("Class created successfully!");
    } catch (error) {
      console.error("Error creating class:", error);
      toast.error("Failed to create class. Please try again.");
    }
  };

  const handleViewClass = (classId) => {
    navigate(`/teacher-classes/${classId}`);
  };

  return (
    <div className={styles.teacherLanding}>
      <Header />
      <CreateClassForm
        newClassName={newClassName}
        setNewClassName={setNewClassName}
        classPassword={classPassword}
        setClassPassword={setClassPassword}
        maxStudents={maxStudents}
        setMaxStudents={setMaxStudents}
        handleCreateClass={handleCreateClass}
      />
      <div className={styles.classescontainer}>
        {classes.map((cls, index) => (
          <ClassCard key={index} cls={cls} handleViewClass={handleViewClass} />
        ))}
      </div>
    </div>
  );
};

export default TeacherDashboard;
