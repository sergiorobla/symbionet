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
import { registerUser, onUserDeleted } from "./api/socket.js";
import { KeyProvider } from "./contexts/KeyContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import { getAccessToken } from "./api/auth.js";
import { refreshToken } from "./api/api.js";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

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
        {/* Solo mostrar Navbar si NO estás en la ruta '/' */}
        {location.pathname !== "/" && location.pathname !== "/register" && (
          <Navbar />
        )}
        <Routes>
          <Route path="/" element={<FirstPage />} />
          <Route path="/agora" element={<Agora />} />
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
