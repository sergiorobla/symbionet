import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import FirstPage from "./pages/FirstPage.jsx";
import Agora from "./pages/Agora.jsx";
import Community from "./pages/Community.jsx";
import Project from "./pages/Project.jsx";
import Profile from "./pages/Profile.jsx";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import Admin from "./pages/Admin.jsx";
import Login from "./components/Login.jsx";
import Footer from "./components/Footer.jsx";
import { KeyProvider } from "./contexts/KeyContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import { getAccessToken } from "./api/auth.js";
import { refreshToken } from "./api/api.js";
import { useUser } from "./contexts/UserContext";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { shouldForceLogout, setUser } = useUser();

  useEffect(() => {
    if (shouldForceLogout) {
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      alert("Tu cuenta ha sido eliminada por el administrador.");
      navigate("/register");
    }
  }, [shouldForceLogout, navigate, setUser]);

  useEffect(() => {
    const ensureAccessToken = async () => {
      const token = getAccessToken();
      if (!token) {
        const refreshed = await refreshToken();
        if (!refreshed) {
          console.warn("⚠️ No se pudo refrescar el accessToken");
        } else {
          console.log("🔁 accessToken refrescado automáticamente");
        }
      }
    };

    ensureAccessToken();
  }, []);

  return (
    <KeyProvider>
      <div className="flex flex-col md:min-h-screen bg-gray-900 text-white">
        {location.pathname !== "/" && location.pathname !== "/register" && (
          <Navbar />
        )}
        <Routes>
          <Route path="/" element={<FirstPage />} />
          <Route path="/agora" element={<Agora />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community/:id"
            element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:id"
            element={
              <ProtectedRoute>
                <Project />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Footer />
      </div>
    </KeyProvider>
  );
}
