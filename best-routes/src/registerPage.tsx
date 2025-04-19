// Signup.tsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const Signup: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const signUp = () => {
    axios
      .post(`${API_URL}/api/users/register`, {
        username,
        password,
      })
      .then(() => {
        alert("Account created successfully. Please log in");
        navigate("/login");
      })
      .catch((err) => {
        alert(err.response?.data.detail || "Sign up failed");
      });
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-4 shadow-lg border rounded">
      <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
      <input
        className="border p-2 w-full mb-2"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        className="border p-2 w-full mb-4"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={signUp}
        className="bg-blue-600 text-white w-full py-2 rounded"
      >
        Register
      </button>
    </div>
  );
};

export default Signup;
