import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Home from "./pages/Home.jsx";
import Community from "./pages/Community.jsx";
import Project from "./pages/Project.jsx";
import Profile from "./pages/Profile.jsx";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import Admin from "./pages/Admin.jsx";
import Login from "./components/Login.jsx";
import { registerUser, onUserDeleted } from "./api/socket.js";
import { KeyProvider } from "./contexts/KeyContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import { getAccessToken } from "./api/auth.js";
import { refreshToken } from "./api/api.js";

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.id) {
        registerUser(user.id);

        onUserDeleted(() => {
          localStorage.removeItem("user");
          localStorage.removeItem("symbionet_private_key");
          localStorage.removeItem("symbionet_public_key");

          alert("Tu cuenta ha sido eliminada por el administrador.");
          navigate("/register");
        });
      }
    }

    // ✅ Refrescar token si está perdido
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
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* RUTAS PROTEGIDAS */}
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
      </div>
    </KeyProvider>
  );
}
