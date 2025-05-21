const BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:4000";
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

    // 2. Intenta obtener la clave pública desde localStorage
    let publicKey = null;
    const encrypted = localStorage.getItem("encryptedPrivateKey");
    if (encrypted) {
      try {
        const parsed = JSON.parse(encrypted);
        if (parsed?.publicKeyJwk?.kty) {
          publicKey = parsed.publicKeyJwk;
        }
      } catch (e) {
        console.error("Error al parsear encryptedPrivateKey:", e);
      }
    }

    // Fallbacks legacy
    if (!publicKey) {
      const publicStr = localStorage.getItem("publicKey");
      if (publicStr) {
        try {
          publicKey = JSON.parse(publicStr);
        } catch (e) {}
      }
    }
    if (!publicKey) {
      const legacyStr = localStorage.getItem("symbionet_public_key");
      if (legacyStr) {
        try {
          publicKey = JSON.parse(legacyStr);
        } catch (e) {}
      }
    }

    if (!publicKey) {
      setError("No se encontró la clave pública. ¿Ya importaste tu identidad?");
      return false;
    }

    setLoading(true);
    try {
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
        return true;
      } else {
        setError(data.error || "Usuario no encontrado o sin token.");
        return false;
      }
    } catch (err) {
      setError("Error al obtener información del usuario.");
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { login, error, loading: loading || unlocking };
}
