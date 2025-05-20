import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchPosts, createPost, deletePost, updateUsername } from "../api/api";
import { signMessage } from "../api/cripto";
import { useUser } from "../contexts/UserContext";
import { useKey } from "../contexts/KeyContext";
import { useUnlockPrivateKey } from "../hooks/useUnlockPrivateKey";
import ExportIdentity from "../components/ExportIdentity";
import { getPublicKeyFromStorage } from "../api/publicKeyUtils";

// Convierte una firma raw (64 bytes) a formato DER (ASN.1)
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

export default function Profile() {
  const location = useLocation();
  const { user, setUser } = useUser();
  const { privateKey } = useKey();
  const {
    unlock,
    error: unlockError,
    loading: unlockLoading,
  } = useUnlockPrivateKey();

  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [changingName, setChangingName] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.public_key && location.pathname.startsWith("/profile")) {
      fetchPosts(user.public_key)
        .then((res) => {
          if (res?.posts) setPosts(res.posts);
          else setPosts([]);
        })
        .catch((err) => {
          console.error("fetchPosts error", err);
          setPosts([]);
        });
    }
  }, [user?.public_key, location.pathname]);

  const handleUsernameChange = async () => {
    setChangingName(true);
    setError(null);
    try {
      const publicKeyJwk = getPublicKeyFromStorage();
      if (!publicKeyJwk || !publicKeyJwk.kty) {
        alert(
          "Clave pública inválida o no encontrada. Vuelve a iniciar sesión."
        );
        return;
      }
      const res = await updateUsername(newUsername, publicKeyJwk);
      setUser(res.user);
      setNewUsername("");
      // Opcional: mostrar mensaje de éxito
      // setSuccess("Nombre de usuario actualizado correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setChangingName(false);
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm("¿Seguro quieres eliminar este post?")) {
      try {
        await deletePost(postId, user.public_key);
        setPosts((prev) => prev.filter((post) => post.id !== postId));
      } catch (error) {
        alert("Error eliminando post: " + error.message);
      }
    }
  };

  const handlePost = async () => {
    try {
      let unlockedPrivateKey = privateKey;
      if (!unlockedPrivateKey) {
        const password = window.prompt(
          "Introduce tu contraseña para firmar el post"
        );
        if (!password) return;
        const ok = await unlock(password);
        if (!ok) return;
        unlockedPrivateKey = privateKey;
      }

      const privateKeyJwk =
        typeof unlockedPrivateKey === "string"
          ? JSON.parse(unlockedPrivateKey)
          : unlockedPrivateKey;

      if (!privateKeyJwk || !privateKeyJwk.kty) {
        alert("Contraseña correcta.");
        return;
      }

      // Usa la función utilitaria robusta
      const publicKeyJwk = getPublicKeyFromStorage();

      if (!publicKeyJwk || !publicKeyJwk.kty) {
        alert(
          "Clave pública inválida o no encontrada. Vuelve a iniciar sesión."
        );
        return;
      }

      const keys = {
        privateKey: privateKeyJwk,
        publicKey: publicKeyJwk,
      };

      const base64Signature = await signMessage(message, privateKeyJwk);

      const res = await createPost(message, base64Signature, publicKeyJwk);
      setPosts((prev) => [res.post, ...prev]);
      setMessage("");
    } catch (err) {
      console.error("Error al crear post:", err);
      alert("Error al firmar o publicar post.");
    }
  };

  if (!user) return <p>Cargando perfil...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">
        {user?.username || "Usuario anónimo"}
      </h1>
      <div className="mt-4">
        <label className="block font-medium">Cambiar nombre de usuario</label>
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          className="border p-1 rounded text-black w-full mt-1"
          placeholder="Nuevo nombre"
        />
        <button
          onClick={handleUsernameChange}
          className="mt-2 mx-1 bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded"
          disabled={changingName}
        >
          Cambiar nombre
        </button>
        {error && <p className="text-red-600 mt-1">{error}</p>}
        <ExportIdentity />
      </div>

      <p className="text-gray-700">Reputación: {user.reputation}</p>
      <p className="text-xl">Aquí puedes escribir tus publicaciones.</p>

      <textarea
        className="w-full border p-2 rounded mb-2 text-black"
        placeholder="Escribe un nuevo post..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        onClick={handlePost}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded"
      >
        Publicar
      </button>

      <h2 className="text-xl font-semibold mt-6 mb-2">Tus Publicaciones</h2>
      <div className="space-y-3">
        {posts.length > 0 ? (
          <div className="flex flex-col space-y-2 my-10 mx-10">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border rounded p-2 bg-white text-black"
              >
                <pre className="bg-blue-100 p-2 rounded my-2 font-mono whitespace-pre-wrap break-words">
                  {post.content}
                </pre>
                <small className="text-gray-500 flex justify-between">
                  {new Date(post.created_at).toLocaleString()}{" "}
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-red-50 hover:text-red-600 bg-red-600 hover:bg-red-50 border border-red-600 rounded px-3"
                  >
                    Eliminar
                  </button>
                </small>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No has publicado nada aún.</p>
        )}
      </div>
    </div>
  );
}
