import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from './authContext';

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');
    return email && role ? { email, role } : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [role, setRole] = useState(() => localStorage.getItem('role'));

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });

      // Backend returns: { message, user: { id, name, email, role }, token }
      const { token, user: userData } = response.data;
      const { id, email: userEmail, role: userRole } = userData;

      localStorage.setItem('token', token);
      localStorage.setItem('role', userRole);
      localStorage.setItem('email', userEmail);
      localStorage.setItem('userId', id);

      setToken(token);
      setRole(userRole);
      setUser({ email: userEmail, role: userRole, ...userData });

      navigate(`/${userRole}/dashboard`);
      return { success: true };

    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
