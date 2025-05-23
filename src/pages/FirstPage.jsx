import { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import ImportIdentity from "../components/ImportIdentity";
import { Link } from "react-router-dom";

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
    <div className="flex flex-col md:flex-row h-full md:flex-1 w-full items-center justify-center gap-8 px-4 md:px-[15vw] py-8">
      {/* Descripción */}
      <div className="text-center md:text-left md:w-1/2">
        <h1 className="text-slate-300 text-4xl md:text-5xl mb-4">
          thefacebook
        </h1>
        <p className="text-lg md:text-xl px-[10vw] sm:px-[20vw] md:px-0 md:max-w-[30vw]">
          thefacebook es la primera red social verdaderamente descentralizada:
          sin censura, sin intermediarios, solo tú y tu comunidad.
        </p>
      </div>

      {/* Formulario de login e identidad */}
      <div className="flex flex-col space-y-4 w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded px-6 pt-6 pb-8 w-full flex flex-col items-center space-y-4"
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
            className="border rounded w-full py-2 px-3 text-gray-700"
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
            className="bg-gray-800 hover:bg-gray-700 p-2 rounded text-white text-center !mt-0"
          >
            Registro
          </Link>
        )}
      </div>
    </div>
  );
}
