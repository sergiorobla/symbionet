/**
 * Obtiene la clave pública del localStorage de forma robusta.
 * Busca en encryptedPrivateKey, publicKey y symbionet_public_key.
 * @returns {object|null} Clave pública JWK o null si no existe.
 */
export function getPublicKeyFromStorage() {
  // 1. Intenta extraerla de encryptedPrivateKey (nuevo método)
  const encrypted = localStorage.getItem("encryptedPrivateKey");
  if (encrypted) {
    try {
      const parsed = JSON.parse(encrypted);
      if (parsed.publicKeyJwk) {
        return parsed.publicKeyJwk;
      }
    } catch (e) {}
  }
  // 2. Busca en publicKey (legacy)
  const publicStr = localStorage.getItem("publicKey");
  if (publicStr) {
    try {
      return JSON.parse(publicStr);
    } catch (e) {}
  }
  // 3. Busca en symbionet_public_key (más legacy)
  const legacyStr = localStorage.getItem("symbionet_public_key");
  if (legacyStr) {
    try {
      return JSON.parse(legacyStr);
    } catch (e) {}
  }
  // 4. Si no la encuentra, retorna null
  return null;
}