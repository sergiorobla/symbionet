import { useEffect, useState } from "react";
import { fetchPosts, createPost, deletePost, updateUsername } from "../api/api";
import { signMessage } from "../api/cripto";
import { useUser } from "../contexts/UserContext";
import { useKey } from "../contexts/KeyContext";
import { useUnlockPrivateKey } from "../hooks/useUnlockPrivateKey";
import ExportIdentity from "../components/ExportIdentity";
import { getPublicKeyFromStorage } from "../api/publicKeyUtils";

export default function Profile() {
  const [accessToken, setAccessTokenState] = useState(null);
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
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (token) setAccessTokenState(token);
  }, []);

  useEffect(() => {
    if (user?.public_key && accessToken) {
      setLoadingPosts(true);
      fetchPosts(user.public_key)
        .then((res) => {
          setPosts(res?.posts || []);
          setLoadingPosts(false);
        })
        .catch((err) => {
          console.error("fetchPosts error", err);
          setPosts([]);
          setLoadingPosts(false);
        });
    }
  }, [user?.public_key, accessToken]);

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

      const publicKeyJwk = getPublicKeyFromStorage();

      if (!publicKeyJwk || !publicKeyJwk.kty) {
        alert(
          "Clave pública inválida o no encontrada. Vuelve a iniciar sesión."
        );
        return;
      }

      const base64Signature = await signMessage(message, privateKeyJwk);
      await createPost(message, base64Signature, publicKeyJwk);
      const updated = await fetchPosts(publicKeyJwk);
      setPosts(updated.posts || []);
      setMessage("");
    } catch (err) {
      console.error("Error al crear post:", err);
      alert("Error al firmar o publicar post.");
    }
  };

  if (!user || !accessToken || loadingPosts) {
    return <p>Cargando perfil...</p>;
  }

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
