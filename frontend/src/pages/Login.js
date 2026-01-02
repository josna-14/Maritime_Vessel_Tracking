import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ✅ CHANGED: Using your public Ngrok Backend URL
      // We also added headers to bypass the Ngrok warning page
      const res = await axios.post(
        "https://celestina-raffish-nayeli.ngrok-free.dev/api/login/",
        {
          username: form.username,
          password: form.password
        },
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json"
          }
        }
      );

      // ✅ 2. On Success, store Token AND Role
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      localStorage.setItem("userRole", res.data.role); 
      localStorage.setItem("username", res.data.username);

      // 3. Redirect to Dashboard
      navigate("/dashboard");
      
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setError("Invalid username or password.");
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail); 
      } else {
        setError("Login failed. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <form className="auth__card" onSubmit={handleSubmit}>
        <h1>Login</h1>
        {error && (
          <p 
            className="auth__message error" 
            style={{
              background: "#ffebee", 
              color: "#c62828", 
              padding: "10px", 
              borderRadius: "8px"
            }}
          >
            {error}
          </p>
        )}
        
        <label>
          Username
          <input 
            type="text" 
            name="username" 
            value={form.username} 
            onChange={handleChange} 
            required 
            placeholder="Enter your username"
          />
        </label>
        
        <label>
          Password
          <input 
            type="password" 
            name="password" 
            value={form.password} 
            onChange={handleChange} 
            required 
            placeholder="Enter your password"
          />
        </label>
        
        <button type="submit" disabled={loading} style={{opacity: loading ? 0.7 : 1}}>
          {loading ? "Verifying..." : "Sign In"}
        </button>
        
        <p>
          Need an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </main>
  );
}