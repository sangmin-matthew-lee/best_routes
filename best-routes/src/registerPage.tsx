// Signup.tsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const Signup: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/users/register`, { username, password });
      alert("Account created successfully. Please log in.");
      navigate("/login");
    } catch (err: any) {
      alert(err.response?.data.detail || "Sign up failed");
    }
  };

  return (
    <div className="auth-wrapper">
        <div className="auth-card">
        <div className="mb-6 text-center">
          <Link to="/" className="text-6xl font-bold" style={{ textDecoration: 'none', color: 'inherit' }} >
            🚗 FindRoutes
          </Link>
        </div>
        
        <h2>Create an Account</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Register</button>
        </form>
        <p className="login-link">
          Already have an account?{' '}
          <a onClick={() => navigate('/login')}>Log in</a>
        </p>
      </div>
    </div>
  );  
};

export default Signup;
