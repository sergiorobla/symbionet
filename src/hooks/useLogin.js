import { useState } from "react";
import { useUser } from "../contexts/UserContext";
import { useUnlockPrivateKey } from "./useUnlockPrivateKey";
import { useNavigate } from "react-router-dom";
import { setAccessToken } from "../api/auth";

export function useLogin() {
  const { setUser } = useUser();
  const {
    unlock,
    error: unlockError,
    loading: unlocking,
  } = useUnlockPrivateKey();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (password) => {
    setError(null);

    // 1. Desbloquea la clave privada
    const unlocked = await unlock(password);
    if (!unlocked) {
      setError(unlockError || "Error al desbloquear clave.");
      return false;
    }

    // 2. Obtén la clave pública de forma robusta
    let publicKey = null;

    // Intenta extraerla de encryptedPrivateKey (nuevo método)
    const encrypted = localStorage.getItem("encryptedPrivateKey");
    if (encrypted) {
      try {
        const parsed = JSON.parse(encrypted);
        if (parsed.publicKeyJwk) {
          publicKey = parsed.publicKeyJwk;
        }
      } catch (e) {
        // Si hay error al parsear, pasa al siguiente método
      }
    }

    // Si no la encuentra, busca en publicKey (legacy)
    if (!publicKey) {
      const publicStr = localStorage.getItem("publicKey");
      if (publicStr) {
        try {
          publicKey = JSON.parse(publicStr);
        } catch (e) {}
      }
    }

    // Si aún no la encuentra, busca en symbionet_public_key (más legacy)
    if (!publicKey) {
      const legacyStr = localStorage.getItem("symbionet_public_key");
      if (legacyStr) {
        try {
          publicKey = JSON.parse(legacyStr);
        } catch (e) {}
      }
    }

    if (!publicKey) {
      setError("No se encontró la clave pública.");
      return false;
    }

    setLoading(true);
    try {
      // 3. Busca el usuario en el backend usando la clave pública
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_key: publicKey }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.accessToken && data.user) {
        setAccessToken(data.accessToken);
        setUser(data.user);
        navigate(`/profile/${data.user.username || data.user.id}`);
        setLoading(false);
        return true;
      } else {
        setError(data.error || "Usuario no encontrado o sin token.");
        setLoading(false);
        return false;
      }
    } catch (err) {
      setError("Error al obtener información del usuario.");
      console.error(err);
    } finally {
      setLoading(false); // 🔁 Siempre se ejecuta
    }
  };

  // Devuelve el método y los estados para usar en el formulario
  return { login, error, loading: loading || unlocking };
}
