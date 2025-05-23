import { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import ImportIdentity from "../components/ImportIdentity";
import { Link, useNavigate } from "react-router-dom";

function hasIdentity() {
  return !!localStorage.getItem("encryptedPrivateKey");
}

export default function FirstPage() {
  const [password, setPassword] = useState("");
  const { login, error, loading } = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(password);
    // El propio hook navega al perfil si el login es correcto
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center space-x-5 px-[10vw]">
      <div>
        <h1 className="text-slate-300 text-5xl">thefacebook</h1>
        <p className="w-[30vw] text-xl">
          thefacebook es la primera red social verdaderamente descentralizada:
          sin censura, sin intermediarios, solo tú y tu comunidad.
        </p>
      </div>
      <div className="flex flex-col space-y-2">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 max-w-sm w-full flex flex-col items-center space-y-4"
        >
          <input
            type="text"
            name="username"
            autoComplete="username"
            style={{ display: "none" }}
            tabIndex={-1}
          />
          <input
            type="password"
            placeholder="Introduce tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            autoComplete="current-password"
            className="border rounded w-full py-2 px-3 mb-4 text-gray-700"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded w-full"
          >
            {loading ? "Cargando..." : "Entrar"}
          </button>
          {error && <p className="text-red-600 mt-2 text-center">{error}</p>}
        </form>
        <ImportIdentity onImport={() => window.location.reload()} />
        {!hasIdentity() && (
          <Link
            to="/register"
            className="bg-gray-800 hover:bg-gray-700 p-2 rounded text-white text-center"
          >
            Registro
          </Link>
        )}
      </div>
    </div>
  );
}
