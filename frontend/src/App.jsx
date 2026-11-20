import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/Loader";
import StudentLayout from "./layouts/StudentLayout";
import AdminLayout from "./layouts/AdminLayout";
import OfflineBanner from "./components/OfflineBanner";
import Notifications from "./pages/Notifications";

// Screens before login
import Welcome from "./pages/auth/Welcome";
import StudentLogin from "./pages/auth/StudentLogin";
import StudentSignup from "./pages/auth/StudentSignup";
import AdminLogin from "./pages/auth/AdminLogin";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Student screens
import Home from "./pages/student/Home";
import Search from "./pages/student/Search";
import BookDetails from "./pages/student/BookDetails";
import MyReservations from "./pages/student/MyReservations";
import Profile from "./pages/student/Profile";
import Wishlist from "./pages/student/Wishlist";
import ReadingStats from "./pages/student/ReadingStats";

// Screens shared by students and admin (admin={true} shows the admin tools)
import Announcements from "./pages/Announcements";
import BookRequests from "./pages/BookRequests";
import DigitalLibrary from "./pages/DigitalLibrary";

// Admin screens
import Dashboard from "./pages/admin/Dashboard";
import ManageBooks from "./pages/admin/ManageBooks";
import Reservations from "./pages/admin/Reservations";
import Students from "./pages/admin/Students";
import AdminProfile from "./pages/admin/AdminProfile";
import LibrarySettings from "./pages/admin/LibrarySettings";

// Sends the user to the right place when they open "/"
function StartPage() {
  const { user, loading } = useAuth();
  if (loading) return <Loader full />;
  if (!user) return <Navigate to="/welcome" replace />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/home"} replace />;
}

// Login pages should not be shown again after logging in
function GuestOnly({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/home"} replace />;
  return children;
}

export default function App() {
  return (
    <>
    <OfflineBanner />
    <Routes>
      <Route path="/" element={<StartPage />} />

      <Route path="/welcome" element={<GuestOnly><Welcome /></GuestOnly>} />
      <Route path="/login" element={<GuestOnly><StudentLogin /></GuestOnly>} />
      <Route path="/signup" element={<GuestOnly><StudentSignup /></GuestOnly>} />
      <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
      <Route path="/admin/login" element={<GuestOnly><AdminLogin /></GuestOnly>} />

      {/* Student area */}
      <Route element={<ProtectedRoute role="student" />}>
        <Route element={<StudentLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/books/:id" element={<BookDetails />} />
          <Route path="/reservations" element={<MyReservations />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/stats" element={<ReadingStats />} />
          <Route path="/requests" element={<BookRequests />} />
          <Route path="/library" element={<DigitalLibrary />} />
          <Route path="/announcements" element={<Announcements />} />
        </Route>
      </Route>

      {/* Admin area */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/books" element={<ManageBooks />} />
          <Route path="/admin/reservations" element={<Reservations />} />
          <Route path="/admin/students" element={<Students />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/notifications" element={<Notifications />} />
          <Route path="/admin/requests" element={<BookRequests admin />} />
          <Route path="/admin/library" element={<DigitalLibrary admin />} />
          <Route path="/admin/announcements" element={<Announcements admin />} />
          <Route path="/admin/settings" element={<LibrarySettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
