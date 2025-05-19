export async function getKeyFromPassword(password, saltBase64) {
  const enc = new TextEncoder();
  let salt;
  if (saltBase64) {
    // Si ya tienes un salt (en base64), úsalo (para descifrado)
    salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
  } else {
    // Si no, genera uno nuevo (para cifrado)
    salt = window.crypto.getRandomValues(new Uint8Array(16));
  }

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return { key, salt: btoa(String.fromCharCode(...salt)) };
}

export async function encryptPrivateKey(privateKey, password) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const { key, salt } = await getKeyFromPassword(password); // genera salt aleatorio
  const enc = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(privateKey)
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
    salt, // guarda el salt generado
    alg: "AES-GCM",
  };
}

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function decryptPrivateKey(encrypted, password) {
  const iv = base64ToArrayBuffer(encrypted.iv);
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext || encrypted.data);
  // Usa el salt almacenado para derivar la clave
  const { key } = await getKeyFromPassword(password, encrypted.salt);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}
