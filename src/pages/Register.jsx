import { useState, useEffect, useRef } from "react";
import { registerUser, getMe } from "../api/api";
import { setAccessToken } from "../api/auth";
import { generateKeyPair, loadKeyPair } from "../api/cripto";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { encryptPrivateKey } from "../api/cryptoUtils";
import { useKey } from "../contexts/KeyContext";
import generateRandomQuestion from "../functions/generateQuestion";

export default function Register() {
  const { user, setUser } = useUser();
  const { setPrivateKey } = useKey();
  const [captchaQuestion, setCaptchaQuestion] = useState(
    generateRandomQuestion()
  );
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const userIdRef = useRef(user?.id);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user]);

  useEffect(() => {
    if (user && user.id) {
      navigate(`/profile/${user.id}`);
    }
  }, [user, navigate]);

  useEffect(() => {
    const checkStoredKeys = async () => {
      const keys = await loadKeyPair();
      if (!user && keys?.publicKey) {
        try {
          const res = await getMe(keys.publicKey);
          if (res?.user) {
            setUser(res.user);
          }
        } catch (err) {
          console.error("Error en getMe:", err);
        }
      }
    };
    checkStoredKeys();
  }, [user, setUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (parseInt(captchaAnswer, 10) !== captchaQuestion.answer) {
      setError("Respuesta incorrecta al CAPTCHA.");
      setCaptchaQuestion(generateRandomQuestion());
      setCaptchaAnswer("");
      return;
    }
    if (!password) {
      setError("Contraseña requerida.");
      return;
    }

    setLoading(true);
    try {
      const { publicKey, privateKey } = await generateKeyPair();
      const encrypted = await encryptPrivateKey(
        JSON.stringify(privateKey),
        password
      );
      const encryptedIdentity = {
        ciphertext: encrypted.ciphertext || encrypted.data,
        iv: encrypted.iv,
        salt: encrypted.salt,
        alg: encrypted.alg || "AES-GCM",
        publicKeyJwk: publicKey,
      };
      localStorage.setItem(
        "encryptedPrivateKey",
        JSON.stringify(encryptedIdentity)
      );
      localStorage.setItem("symbionet_public_key", JSON.stringify(publicKey));

      const res = await registerUser({
        public_key: publicKey,
        captchaQuestion: captchaQuestion.question,
        captchaAnswer,
      });

      if (res?.accessToken && res?.user) {
        setAccessToken(res.accessToken); // NUEVO: guarda el token
        setUser(res.user);
        setPrivateKey(privateKey); // Guarda la clave privada en tu estado/contexto
        localStorage.setItem("username", res.user.username);
      } else {
        setError("Registro fallido (sin usuario o token).");
      }
    } catch (err) {
      console.error("Error al generar claves o registrar:", err);
      setError("Tu navegador no soporta generación de claves criptográficas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Registro</h1>
      {user ? (
        <pre className="bg-gray-100 rounded p-2 text-sm text-black">
          {JSON.stringify(user, null, 2)}
        </pre>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
          <label className="block">
            Nombre de usuario:
            <input
              type="text"
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
              required
              className="border rounded px-2 py-1 w-full text-black"
            />
          </label>
          <label className="block">
            Contraseña:
            <input
              type="password"
              value={password}
              autoComplete="new-password"
              required
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded px-2 py-1 w-full text-black"
            />
          </label>
          <label className="block">
            {captchaQuestion.question}
            <input
              type="text"
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              required
              className="border rounded px-2 py-1 w-full text-black"
            />
          </label>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
            disabled={loading}
          >
            {loading ? "Registrando..." : "Generar identidad descentralizada"}
          </button>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </form>
      )}
    </div>
  );
}
