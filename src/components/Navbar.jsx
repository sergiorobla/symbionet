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
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow px-4 py-2 flex justify-between items-center">
      <Link to="/">
        <h1 className="font-bold text-xl text-black">SymbioNet</h1>
      </Link>

      <div className="space-x-4 flex items-center">
        {!user && (
          <>
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-white"
            >
              Iniciar sesión
            </button>
            {/* Solo muestra el botón de registro si NO hay identidad */}
            {!identityExists && (
              <Link
                to="/register"
                className="bg-gray-800 hover:bg-gray-600 px-3 py-2 rounded text-white"
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
              className="bg-gray-800 hover:bg-gray-600 px-3 py-2 rounded text-white"
            >
              Perfil ({user?.username || "Usuario anónimo"})
            </Link>
            <button
              onClick={handleLogout}
              className="ml-2 bg-red-600 hover:bg-red-500 px-3 py-2 rounded text-white"
            >
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
