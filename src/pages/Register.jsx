import { useState, useEffect, useRef } from "react";
import { registerUser, getMe } from "../api/api";
import { setAccessToken } from "../api/auth";
import { generateKeyPair, loadKeyPair } from "../api/cripto";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { useKey } from "../contexts/KeyContext";
import generateRandomQuestion from "../functions/generateQuestion";
import { encryptPrivateKey, decryptPrivateKey } from "../api/cryptoUtils";

function hasIdentity() {
  return !!localStorage.getItem("encryptedPrivateKey");
}

export default function Register() {
  const { user, setUser } = useUser();
  const { setPrivateKey } = useKey();
  const [captchaQuestion, setCaptchaQuestion] = useState(
    generateRandomQuestion()
  );
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmPwdModalVisible, setConfirmPwdModalVisible] = useState(false);
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pendingKeyPair, setPendingKeyPair] = useState(null);
  const [pendingEncrypted, setPendingEncrypted] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasIdentity()) {
      navigate("/agora");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

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

    try {
      const { publicKey, privateKey } = await generateKeyPair();
      const encrypted = await encryptPrivateKey(
        JSON.stringify(privateKey),
        password
      );
      setPendingKeyPair({ publicKey, privateKey });
      setPendingEncrypted(encrypted);
      setConfirmPwdModalVisible(true);
    } catch (err) {
      console.error("Error generando claves:", err);
      setError("No se pudo generar la clave.");
    }
  };

  const confirmRegistration = async () => {
    setLoading(true);
    try {
      await decryptPrivateKey(pendingEncrypted, confirmPwd); // Verifica la contraseña

      const { publicKey, privateKey } = pendingKeyPair;

      const res = await registerUser({
        public_key: publicKey,
        captchaQuestion: captchaQuestion.question,
        captchaAnswer,
        username,
      });

      if (res?.accessToken && res?.user) {
        setAccessToken(res.accessToken);
        setUser(res.user);
        setPrivateKey(privateKey);

        localStorage.setItem(
          "encryptedPrivateKey",
          JSON.stringify(pendingEncrypted)
        );
        localStorage.setItem("symbionet_public_key", JSON.stringify(publicKey));
        localStorage.setItem("username", res.user.username);

        navigate("/agora");
      } else {
        setError("Registro fallido.");
      }
    } catch (err) {
      console.error("Error en confirmación:", err);
      setError("La contraseña de confirmación no es válida.");
    } finally {
      setLoading(false);
      setConfirmPwdModalVisible(false);
      setConfirmPwd("");
      setPendingEncrypted(null);
      setPendingKeyPair(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full md:flex-1 w-full items-center justify-center gap-8 px-4 md:px-[15vw] py-8">
      {!user && (
        <>
          <div className="text-center md:text-left md:w-1/2">
            <h1 className="text-slate-300 text-4xl md:text-5xl mb-4">
              thefacebook
            </h1>
            <p className="text-lg md:text-xl px-[10vw] sm:px-[20vw] md:px-0 md:max-w-[30vw]">
              thefacebook es la primera red social verdaderamente
              descentralizada: sin censura, sin intermediarios, solo tú y tu
              comunidad.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 md:pr-12 w-full md:w-auto px-6 md:px-0"
          >
            <label className="block">
              Nombre de usuario:
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border rounded px-2 py-1 w-full text-black"
              />
            </label>
            <label className="block">
              Contraseña:
              <input
                type="password"
                autoComplete="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border rounded px-2 py-1 w-full text-black"
              />
            </label>
            <label className="block">
              Confirmar contraseña:
              <input
                type="password"
                autoComplete="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
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
              {loading ? "Procesando..." : "Registrarse"}
            </button>
            {error && <p className="text-red-600 mt-2">{error}</p>}
          </form>

          {confirmPwdModalVisible && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-5">
              <div className="bg-white p-6 rounded shadow-md text-black">
                <h2 className="text-xl mb-4">Confirma tu contraseña</h2>
                <p className="mb-2">
                  Vuelve a ingresarla para activar tu identidad:
                </p>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  className="border rounded px-2 py-1 w-full mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="bg-gray-300 px-4 py-2 rounded"
                    onClick={() => {
                      setConfirmPwdModalVisible(false);
                      setConfirmPwd("");
                      setPendingEncrypted(null);
                      setPendingKeyPair(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    onClick={confirmRegistration}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
