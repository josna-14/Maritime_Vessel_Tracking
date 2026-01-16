import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Operator", // ✅ Default role
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      // ✅ CHANGED: Point to Render Backend instead of localhost
      const response = await fetch("https://maritime-backend-0521.onrender.com/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role, 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Registration Successful as ${formData.role}! Please Login.`);
        navigate("/login");
      } else {
        alert("Error: " + JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error registering:", error);
      alert("Registration failed. Please check your connection.");
    }
  };

  // ✅ Inline Styles
  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#f4f7f6", 
    },
    card: {
      backgroundColor: "white",
      padding: "2.5rem",
      borderRadius: "12px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
      width: "380px",
      textAlign: "center",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    title: {
      color: "#003366", 
      marginBottom: "20px",
      fontSize: "24px",
      fontWeight: "bold",
    },
    inputGroup: {
      marginBottom: "15px",
      textAlign: "left",
    },
    label: {
      display: "block",
      marginBottom: "5px",
      color: "#333",
      fontSize: "14px",
      fontWeight: "600",
    },
    input: {
      width: "100%",
      padding: "12px",
      borderRadius: "6px",
      border: "1px solid #ddd",
      fontSize: "15px",
      boxSizing: "border-box",
      transition: "border 0.3s",
    },
    select: {
      width: "100%",
      padding: "12px",
      borderRadius: "6px",
      border: "1px solid #ddd",
      backgroundColor: "#fff",
      fontSize: "15px",
      cursor: "pointer",
    },
    button: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#003366", 
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "bold",
      marginTop: "10px",
      transition: "background 0.3s",
    },
    footer: {
      marginTop: "15px",
      fontSize: "14px",
      color: "#666",
    },
    link: {
      color: "#003366",
      textDecoration: "none",
      fontWeight: "bold",
      marginLeft: "5px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <form onSubmit={handleRegister}>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Select Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="Operator">Operator (Standard)</option>
              <option value="Analyst">Analyst (Reports)</option>
              <option value="Admin">Admin (Control Center)</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" style={styles.button}>
            Register
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account? 
          <Link to="/login" style={styles.link}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;