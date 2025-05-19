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

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    const user = JSON.parse(userStr);
    if (!user.id) return;

    registerUser(user.id);

    onUserDeleted(() => {
      localStorage.removeItem("user");
      localStorage.removeItem("symbionet_private_key");
      localStorage.removeItem("symbionet_public_key");

      alert("Tu cuenta ha sido eliminada por el administrador.");

      navigate("/register"); // Redirige al registro (o cambia por "/login" si tienes)
    });
  }, []);

  return (
    <KeyProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/community/:id" element={<Community />} />
          <Route path="/project/:id" element={<Project />} />
        </Routes>
      </div>
    </KeyProvider>
  );
}
