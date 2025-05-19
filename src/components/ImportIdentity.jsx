import React, { useRef } from "react";
import { decryptPrivateKey } from "../api/cryptoUtils"; // Ajusta el import según tu estructura
import { useKey } from "../contexts/KeyContext"; // Si usas contexto para la clave privada

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

export default function ImportIdentity({ onImport }) {
  const fileInputRef = useRef();
  const { setPrivateKey } = useKey(); // Si usas contexto, si no, pásalo por props

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = event.target.result;
        const json = JSON.parse(imported);

        if (!validateIdentityJson(json)) {
          alert(
            "El archivo no tiene el formato correcto de identidad SymbioNet."
          );
          return;
        }

        localStorage.setItem("encryptedPrivateKey", JSON.stringify(json));

        // Pide la contraseña y descifra la clave privada
        const password = prompt(
          "Introduce tu contraseña para desbloquear tu identidad:"
        );
        if (!password) {
          alert("Debes introducir una contraseña para usar tu identidad.");
          return;
        }
        try {
          const privateKeyJson = await decryptPrivateKey(json, password);
          const privateKey = JSON.parse(privateKeyJson);
          setPrivateKey(privateKey); // Guarda en contexto para usar en la sesión

          alert(
            "Identidad importada y desbloqueada correctamente. ¡Ya puedes iniciar sesión!"
          );
          if (onImport) onImport();
        } catch (err) {
          alert("Contraseña incorrecta o identidad corrupta.");
        }
      } catch (err) {
        alert("Archivo inválido o corrupto.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mt-4">
      <label
        htmlFor="import-identity"
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        ¿Ya tienes una identidad exportada?
      </label>
      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
        id="import-identity"
      />
      <button
        onClick={() => fileInputRef.current.click()}
        className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-white"
      >
        Importar identidad
      </button>
    </div>
  );
}
