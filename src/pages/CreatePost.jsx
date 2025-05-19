import { useState } from "react";
import { createPost } from "../api/api";
import { loadKeyPair, signMessage } from "../api/cripto";

export default function CreatePost() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const handlePost = async () => {
    try {
      let unlockedPrivateKey = privateKey;
      if (!unlockedPrivateKey) {
        const password = window.prompt(
          "Introduce tu contraseña para firmar el post"
        );
        if (!password) return;
        const ok = await unlock(password);
        if (!ok) return;
        unlockedPrivateKey = privateKey; // vuelve a obtenerlo tras unlock
      }

      // Asegúrate de que la clave privada es un objeto JWK
      const privateKeyJwk =
        typeof unlockedPrivateKey === "string"
          ? JSON.parse(unlockedPrivateKey)
          : unlockedPrivateKey;

      // Obtén la clave pública como objeto JWK
      const publicKeyJwk = (() => {
        const fromStorage = localStorage.getItem("symbionet_public_key");
        if (fromStorage) return JSON.parse(fromStorage);
        if (user?.public_key) {
          return typeof user.public_key === "string"
            ? JSON.parse(user.public_key)
            : user.public_key;
        }
        return null;
      })();

      if (!publicKeyJwk || !publicKeyJwk.kty) {
        alert(
          "Clave pública inválida o no encontrada. Vuelve a iniciar sesión."
        );
        return;
      }
      if (!privateKeyJwk || !privateKeyJwk.kty) {
        alert(
          "Clave privada inválida o no encontrada. Vuelve a iniciar sesión."
        );
        return;
      }

      // Aquí usa privateKeyJwk, NO privateJwk
      const rawSignature = await signMessage(message, privateKeyJwk);
      const derSignature = rawToDer(rawSignature);
      const base64Signature = uint8ArrayToBase64(derSignature);

      const res = await createPost(message, base64Signature, publicKeyJwk);
      setPosts((prev) => [res.post, ...prev]);
      setMessage("");
    } catch (err) {
      console.error("Error al crear post:", err);
      alert("Error al firmar o publicar post.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Crear post firmado</h2>
      <textarea
        className="w-full p-2 border rounded mb-2"
        rows="4"
        placeholder="Escribe tu mensaje aquí..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        onClick={handlePost}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Publicar
      </button>
      {status && <p className="mt-2 text-sm text-gray-700">{status}</p>}
    </div>
  );
}
