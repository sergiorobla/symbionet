import { useEffect, useState } from "react";
import { fetchHomePosts } from "../api/api";

export default function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchHomePosts()
      .then((res) => setPosts(res.posts))
      .catch((err) => {
        console.error("Error al obtener posts del home:", err);
        setPosts([]);
      });
  }, []);

  return (
    <div>
      <h1>Home</h1>
      {posts.length === 0 ? (
        <p>No hay posts.</p>
      ) : (
        <div className="flex flex-col space-y-2 my-10 mx-10">
          {posts.map((post) => (
            <div
              className="bg-white text-black p-4 rounded shadow"
              key={post.id}
            >
              <p className="text-xl font-semibold">{post.username}</p>
              <pre className="bg-blue-100 p-2 rounded my-2">{post.content}</pre>
              <small className="pl-2 text-gray-600">
                {new Date(post.created_at).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
