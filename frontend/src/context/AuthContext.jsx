// Keeps track of who is logged in (student or admin).
// The token and user are saved in localStorage so a page refresh keeps you logged in.
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Save login details after a successful login / sign up
  const saveLogin = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Student login with roll number
  const loginStudent = async (rollNumber, password) => {
    const { data } = await api.post("/auth/student/login", { rollNumber, password });
    saveLogin(data.token, data.user);
    return data.user;
  };

  // Student sign up
  const registerStudent = async (form) => {
    const { data } = await api.post("/auth/student/register", form);
    saveLogin(data.token, data.user);
    return data.user;
  };

  // Admin login with username
  const loginAdmin = async (username, password) => {
    const { data } = await api.post("/auth/admin/login", { username, password });
    saveLogin(data.token, data.user);
    return data.user;
  };

  // Update the saved user (after editing the profile)
  const updateUser = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // When the app opens, check that the saved token is still valid
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then(({ data }) => updateUser(data.user))
      .catch((error) => {
        // Only log out if the server says the token is bad (not when the server is off)
        if (error.response && error.response.status === 401) logout();
      })
      .finally(() => setLoading(false));
  }, []);

  const value = { user, loading, loginStudent, registerStudent, loginAdmin, logout, updateUser, saveLogin };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
