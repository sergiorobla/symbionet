import React from "react";

// Función de validación avanzada (puedes reutilizar la de importación)
function validateIdentityJson(json) {
  if (typeof json !== "object" || json === null) return false;
  const requiredFields = ["ciphertext", "iv", "salt", "alg", "publicKeyJwk"];
  for (const field of requiredFields) {
    if (!(field in json)) return false;
  }
  const jwk = json.publicKeyJwk;
  const jwkFields = ["kty", "crv", "x", "y"];
  for (const field of jwkFields) {
    if (!(field in jwk)) return false;
  }
  if (jwk.kty !== "EC" || jwk.crv !== "P-256") return false;
  return true;
}

export default function ExportIdentity() {
  const handleExport = () => {
    const data = localStorage.getItem("encryptedPrivateKey");
    if (!data) {
      alert("No hay identidad para exportar.");
      return;
    }
    try {
      const json = JSON.parse(data);
      if (!validateIdentityJson(json)) {
        alert("Identidad corrupta o incompleta. No se puede exportar.");
        return;
      }
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "symbionet-identity.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Error al exportar la identidad.");
    }
  };

  return (
    <button
      onClick={handleExport}
      className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded mx-1 text-white mt-4"
    >
      Exportar identidad (backup)
    </button>
  );
}
