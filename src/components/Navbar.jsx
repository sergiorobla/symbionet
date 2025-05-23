import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useKey } from "../contexts/KeyContext";
import { removeAccessToken } from "../api/auth";

// Función para comprobar si hay identidad guardada
function hasIdentity() {
  return !!localStorage.getItem("encryptedPrivateKey");
}

export default function Navbar() {
  const { user, setUser } = useUser();
  const { clearKey } = useKey();
  const navigate = useNavigate();
  const identityExists = hasIdentity();

  const handleLogout = () => {
    removeAccessToken();
    clearKey();
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="bg-white shadow px-4 py-2 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
      {/* Logo */}
      <Link to="/agora" className="text-center sm:text-left">
        <h1 className="font-bold text-xl text-black">thefacebook</h1>
      </Link>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 items-center text-center">
        {!user && (
          <>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white w-full sm:w-auto"
            >
              Iniciar sesión
            </button>

            {!identityExists && (
              <Link
                to="/register"
                className="bg-gray-800 hover:bg-gray-600 px-4 py-2 rounded text-white w-full sm:w-auto"
              >
                Registro
              </Link>
            )}
          </>
        )}

        {user && (
          <>
            <Link
              to={`/profile/${user.username || user.id}`}
              className="bg-gray-800 hover:bg-gray-600 px-4 py-2 rounded text-white w-full sm:w-auto"
            >
              Perfil ({user?.username || "Anónimo"})
            </Link>

            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-white w-full sm:w-auto"
            >
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
