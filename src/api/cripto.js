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

// Convierte una firma RAW (r|s) de 64 bytes a DER ASN.1
function rawToDer(rawSig) {
  const r = rawSig.slice(0, 32);
  const s = rawSig.slice(32, 64);

  function trimLeadingZeros(buf) {
    let i = 0;
    while (i < buf.length - 1 && buf[i] === 0) i++;
    return buf.slice(i);
  }

  function toDERInt(buf) {
    let v = trimLeadingZeros(buf);
    if (v[0] & 0x80) {
      const res = new Uint8Array(v.length + 1);
      res[0] = 0x00;
      res.set(v, 1);
      return res;
    }
    return v;
  }

  const rDER = toDERInt(r);
  const sDER = toDERInt(s);
  const totalLength = 2 + rDER.length + 2 + sDER.length;
  const der = new Uint8Array(2 + totalLength);
  der[0] = 0x30;
  der[1] = totalLength;
  der[2] = 0x02;
  der[3] = rDER.length;
  der.set(rDER, 4);
  der[4 + rDER.length] = 0x02;
  der[5 + rDER.length] = sDER.length;
  der.set(sDER, 6 + rDER.length);
  return der;
}

// Convierte un Uint8Array a base64
function uint8ArrayToBase64(uint8Array) {
  let binary = "";
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

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
  const rawSignature = await window.crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    privateKey,
    data
  );
  const derSignature = rawToDer(new Uint8Array(rawSignature));
  const base64Signature = uint8ArrayToBase64(derSignature);
  return base64Signature;
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
