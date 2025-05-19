import { decryptPrivateKey } from "./cryptoUtils";

// Genera un par de claves ECDSA y las guarda en localStorage.
export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.publicKey
  );
  const privateKeyJwk = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.privateKey
  );

  return {
    publicKey: publicKeyJwk,
    privateKey: privateKeyJwk,
  };
}

// Carga las claves almacenadas localmente, pide la contraseña y devuelve el par clave.
export async function loadKeyPair() {
  try {
    const encrypted = localStorage.getItem("encryptedPrivateKey");
    const publicKeyStr = localStorage.getItem("symbionet_public_key");
    if (!encrypted || !publicKeyStr) return null;

    const parsedEncrypted = JSON.parse(encrypted);
    const password = prompt(
      "Introduce tu contraseña para desbloquear tu identidad:"
    );
    const privateKeyJson = await decryptPrivateKey(parsedEncrypted, password);
    let privateKey;
    try {
      privateKey = JSON.parse(privateKeyJson);
    } catch (e) {
      console.error(
        "Error al parsear la clave privada desencriptada:",
        privateKeyJson
      );
      throw e;
    }

    return {
      privateKey,
      publicKey: JSON.parse(publicKeyStr),
    };
  } catch (e) {
    console.error("Error al desencriptar la clave:", e);
    alert("Contraseña incorrecta o datos corruptos.");
    return null;
  }
}

/**
 * Función de utilidad para firmar un mensaje con una clave privada JWK.
 */
export async function signMessage(message, privateJwk) {
  // Protección extra
  if (typeof privateJwk === "string") {
    try {
      privateJwk = JSON.parse(privateJwk);
    } catch (e) {
      throw new Error("La clave privada no es un objeto JWK válido.");
    }
  }
  if (!privateJwk.kty) {
    throw new Error("La clave privada JWK no tiene el campo 'kty'.");
  }
  const privateKey = await window.crypto.subtle.importKey(
    "jwk",
    privateJwk,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const signature = await window.crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    privateKey,
    data
  );

  return new Uint8Array(signature);
}

/**
 * Wrapper para obtener y usar la clave privada directamente.
 */
export async function signMessageWithStoredKey(message) {
  const keyPair = await loadKeyPair();
  if (!keyPair || !keyPair.privateKey) {
    console.error("Clave privada no cargada correctamente");
    return null;
  }

  return await signMessage(message, keyPair.privateKey);
}
