import { useEffect, useState } from "react";
import { fetchHomePosts, createPost } from "../api/api";
import { signMessage } from "../api/cripto";
import { useKey } from "../contexts/KeyContext";
import { useUnlockPrivateKey } from "../hooks/useUnlockPrivateKey";
import { getPublicKeyFromStorage } from "../api/publicKeyUtils";
import { useUser } from "../contexts/UserContext";

export default function Agora() {
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { privateKey } = useKey();
  const { unlock } = useUnlockPrivateKey();
  const { user } = useUser();

  useEffect(() => {
    fetchHomePosts()
      .then((res) => setPosts(res.posts || []))
      .catch((err) => {
        console.error("Error al obtener posts del home:", err);
        setPosts([]);
      });
  }, []);

  const getValidPublicKey = () => {
    const key = getPublicKeyFromStorage();
    if (!key || !key.kty) {
      alert("Clave pública inválida o no encontrada. Vuelve a iniciar sesión.");
      return null;
    }
    return key;
  };

  const handlePost = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let unlockedPrivateKey = privateKey;

      if (!unlockedPrivateKey) {
        const password = window.prompt(
          "Introduce tu contraseña para firmar el post"
        );
        if (!password) return;

        const result = await unlock(password); // ahora retorna directamente la clave
        if (!result) {
          setError("Error al desbloquear la clave privada.");
          return;
        }

        unlockedPrivateKey = result; // ✅ CORRECTO: usar la clave retornada
      }

      const privateKeyJwk =
        typeof unlockedPrivateKey === "string"
          ? JSON.parse(unlockedPrivateKey)
          : unlockedPrivateKey;

      const publicKeyJwk = getValidPublicKey();
      if (!publicKeyJwk) return;

      const base64Signature = await signMessage(message.trim(), privateKeyJwk);
      await createPost(message.trim(), base64Signature, publicKeyJwk);
      const updated = await fetchHomePosts();
      setPosts(updated.posts || []);
      setMessage("");
      setSuccess("✅ Post publicado con éxito.");
    } catch (err) {
      console.error("Error al publicar:", err);
      setError("❌ Error al firmar o publicar post.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000); // ✅ Mostrar éxito 3 segundos
    }
  };

  return (
    <div className="p-4">
      {user && (
        <div className="mb-6">
          <p className="text-xl">
            Escribe algo para compartir con la comunidad:
          </p>
          <textarea
            className="w-full border p-2 rounded mb-2 text-black"
            placeholder="Escribe un nuevo post..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            onClick={handlePost}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded"
            disabled={loading || !message.trim()}
          >
            {loading ? "Publicando..." : "Publicar"}
          </button>
          {success && <p className="text-green-600 mt-2">{success}</p>}
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Publicaciones Recientes
      </h2>
      <div className="space-y-3">
        {posts.length === 0 ? (
          <p>No hay posts.</p>
        ) : (
          <div className="flex flex-col space-y-2">
            {posts.map((post) => (
              <div
                className="bg-white text-black p-4 rounded shadow"
                key={post.id}
              >
                <p className="text-xl font-semibold">{post.username}</p>
                <pre className="bg-blue-100 p-2 rounded my-2">
                  {post.content}
                </pre>
                <small className="pl-2 text-gray-600">
                  {new Date(post.created_at).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
