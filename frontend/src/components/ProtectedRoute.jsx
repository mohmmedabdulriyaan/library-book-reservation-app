// Only lets logged-in users with the right role see a page
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader full />;

  if (!user) {
    return <Navigate to={role === "admin" ? "/admin/login" : "/login"} replace />;
  }

  if (role && user.role !== role) {
    // Logged in, but wrong type of account
    return <Navigate to={user.role === "admin" ? "/admin" : "/home"} replace />;
  }

  return <Outlet />;
}
