import React, { useState } from 'react';
import axios from 'axios';

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await axios.post('/login', { password });
      onLogin();
    } catch (err) {
      setError('Incorrect password');
    }
  };

  return (
    <div className="login-container">
      <h2>Admin Login</h2>
      <input
        type="password"
        placeholder="Enter admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

export default Login;
