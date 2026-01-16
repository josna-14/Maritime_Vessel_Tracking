import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Operator", 
  });

  // ✅ 1. State for Messages & Loading
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true); // Disable button while loading

    try {
      // ✅ Point to Render Backend
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
        // ✅ Success: Show Green Box
        setSuccess(`Registration Successful as ${formData.role}! Redirecting to login...`);
        
        // Wait 2 seconds then redirect
        setTimeout(() => {
            navigate("/login");
        }, 2000);
        
      } else {
        // ✅ Error: Show Red Box with specific details
        // This handles "Username already exists" or "Password too short"
        if (data.username) setError(`Username error: ${data.username[0]}`);
        else if (data.email) setError(`Email error: ${data.email[0]}`);
        else if (data.password) setError(`Password error: ${data.password[0]}`);
        else if (data.detail) setError(data.detail);
        else setError("Registration failed. Please check your inputs.");
      }
    } catch (error) {
      console.error("Error registering:", error);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false); // Re-enable button
    }
  };

  // ✅ Styles for Messages
  const styles = {
    container: {
      display: "flex", justifyContent: "center", alignItems: "center",
      height: "100vh", backgroundColor: "#f4f7f6", 
    },
    card: {
      backgroundColor: "white", padding: "2.5rem", borderRadius: "12px",
      boxShadow: "0 4px 15px rgba(0,0,0,0.1)", width: "380px", textAlign: "center",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    title: {
      color: "#003366", marginBottom: "20px", fontSize: "24px", fontWeight: "bold",
    },
    // Red Box for Errors
    errorMsg: {
      backgroundColor: "#ffebee", color: "#c62828", padding: "10px",
      borderRadius: "6px", fontSize: "14px", marginBottom: "15px", border: "1px solid #ffcdd2"
    },
    // Green Box for Success
    successMsg: {
      backgroundColor: "#e8f5e9", color: "#2e7d32", padding: "10px",
      borderRadius: "6px", fontSize: "14px", marginBottom: "15px", border: "1px solid #c8e6c9"
    },
    inputGroup: { marginBottom: "15px", textAlign: "left" },
    label: { display: "block", marginBottom: "5px", color: "#333", fontSize: "14px", fontWeight: "600" },
    input: {
      width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ddd",
      fontSize: "15px", boxSizing: "border-box", transition: "border 0.3s",
    },
    select: {
      width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ddd",
      backgroundColor: "#fff", fontSize: "15px", cursor: "pointer",
    },
    button: {
      width: "100%", padding: "12px", backgroundColor: "#003366", color: "white",
      border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px",
      fontWeight: "bold", marginTop: "10px", transition: "background 0.3s",
      opacity: loading ? 0.7 : 1 // Dim button when loading
    },
    footer: { marginTop: "15px", fontSize: "14px", color: "#666" },
    link: { color: "#003366", textDecoration: "none", fontWeight: "bold", marginLeft: "5px" },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        
        {/* ✅ 2. Render Messages Here */}
        {error && <div style={styles.errorMsg}>{error}</div>}
        {success && <div style={styles.successMsg}>{success}</div>}

        <form onSubmit={handleRegister}>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input type="text" name="username" placeholder="Enter username" value={formData.username} onChange={handleChange} style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input type="email" name="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Select Role</label>
            <select name="role" value={formData.role} onChange={handleChange} style={styles.select}>
              <option value="Operator">Operator (Standard)</option>
              <option value="Analyst">Analyst (Reports)</option>
              <option value="Admin">Admin (Control Center)</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} style={styles.input} required />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Registering..." : "Register"}
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