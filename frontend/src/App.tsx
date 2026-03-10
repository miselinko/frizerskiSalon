import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth";

// Public pages
import Home from "./pages/Home";
import BookingPage from "./pages/Booking";
import ServicesPage from "./pages/Services";
import ContactPage from "./pages/Contact";

// Admin pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminBookings from "./pages/admin/Bookings";
import AdminBarbers from "./pages/admin/Barbers";
import AdminServices from "./pages/admin/AdminServices";
import AdminSettings from "./pages/admin/Settings";
import AdminLayout from "./components/AdminLayout";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/zakazivanje" element={<BookingPage />} />
      <Route path="/usluge" element={<ServicesPage />} />
      <Route path="/kontakt" element={<ContactPage />} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="rezervacije" element={<AdminBookings />} />
        <Route path="frizeri" element={<AdminBarbers />} />
        <Route path="usluge" element={<AdminServices />} />
        <Route path="podesavanja" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
