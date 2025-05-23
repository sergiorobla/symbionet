import { decryptPrivateKey } from "./cryptoUtils";

export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
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
  return { publicKey: publicKeyJwk, privateKey: privateKeyJwk };
}

export async function loadKeyPair(password) {
  try {
    const encryptedStr = localStorage.getItem("encryptedPrivateKey");
    const publicKeyStr = localStorage.getItem("symbionet_public_key");
    if (!encryptedStr || !publicKeyStr) return null;

    const encrypted = JSON.parse(encryptedStr);
    const privateKeyJson = await decryptPrivateKey(encrypted, password);
    const privateKey = JSON.parse(privateKeyJson);
    const publicKey = JSON.parse(publicKeyStr);

    return { privateKey, publicKey };
  } catch (e) {
    console.error("Error al desencriptar la clave:", e);
    return null;
  }
}

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

function uint8ArrayToBase64(uint8Array) {
  let binary = "";
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

export async function signMessage(message, privateJwk) {
  if (typeof privateJwk === "string") {
    privateJwk = JSON.parse(privateJwk);
  }
  if (!privateJwk.kty) {
    throw new Error("La clave privada JWK no tiene el campo 'kty'.");
  }
  const privateKey = await window.crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  const data = new TextEncoder().encode(message);
  const rawSignature = await window.crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    privateKey,
    data
  );
  const derSignature = rawToDer(new Uint8Array(rawSignature));
  return uint8ArrayToBase64(derSignature);
}

// ✅ ahora requiere password explícitamente
export async function signMessageWithStoredKey(message, password) {
  const keyPair = await loadKeyPair(password);
  if (!keyPair?.privateKey) {
    console.error("Clave privada no cargada correctamente");
    return null;
  }
  return await signMessage(message, keyPair.privateKey);
}
