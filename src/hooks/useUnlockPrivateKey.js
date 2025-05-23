import { useState, useEffect } from "react";
import { useKey } from "../contexts/KeyContext";
import { decryptPrivateKey } from "../api/cryptoUtils";

export function useUnlockPrivateKey() {
  const { setPrivateKey } = useKey();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      setError(null);
      setLoading(false);
    };
  }, []);

  const unlock = async (password) => {
    setError(null);
    if (!password) {
      setError("La contraseña es obligatoria.");
      return null;
    }

    const encryptedStr = localStorage.getItem("encryptedPrivateKey");
    if (!encryptedStr) {
      setError("No hay clave privada guardada.");
      return null;
    }

    setLoading(true);
    try {
      const encrypted = JSON.parse(encryptedStr);
      const privateKeyJson = await decryptPrivateKey(encrypted, password);
      const privateKey = JSON.parse(privateKeyJson);
      setPrivateKey(privateKey);
      setLoading(false);
      return privateKey; // ✅ ahora retornamos la clave
    } catch (err) {
      setError("Contraseña incorrecta o datos corruptos.");
      setLoading(false);
      return null;
    }
  };

  return { unlock, error, loading };
}
