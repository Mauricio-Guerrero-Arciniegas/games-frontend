"use client";
import { useEffect, useState } from "react";

interface Game {
  id: number;
  name: string;
  state: string;
  players: string[];
  score?: number | Record<string, number>;
}

const normalizeGame = (raw: any): Game => ({
  id: raw.id,
  name: raw.name || raw.title || `Partida ${raw.id}`,
  state: raw.state,
  players: raw.players || [],
  score: raw.score,
});

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchGames = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games`);
      if (!res.ok) throw new Error("Error al obtener partidas");
      const data = await res.json();
      setGames(data.map(normalizeGame));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/${id}/start`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Error al iniciar partida");
      setGames((prev) =>
        prev.map((g) => (g.id === id ? { ...g, state: "in_progress" } : g))
      );
    } catch (error) {
      console.error(error);
      alert("No se pudo iniciar la partida ❌");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnd = async (id: number) => {
    setActionLoading(id);
    const randomScore = Math.floor(Math.random() * 100);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/${id}/end`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: randomScore }),
      });
      if (!res.ok) throw new Error("Error al finalizar partida");
      setGames((prev) =>
        prev.map((g) => (g.id === id ? { ...g, state: "finished", score: randomScore } : g))
      );
    } catch (error) {
      console.error(error);
      alert("No se pudo finalizar la partida ❌");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar esta partida?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar partida");
      setGames((prev) => prev.filter((g) => g.id !== id));
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la partida ❌");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">🎮 Partidas</h1>

      <a
        href="/create"
        className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        ➕ Crear Partida
      </a>

      {loading ? (
        <p className="text-gray-500">Cargando partidas...</p>
      ) : (
        <ul className="space-y-4">
          {games.map((game) => (
            <li key={game.id} className="p-4 border rounded-lg shadow">
              <p>
                <b>{game.name}</b> — Estado: {game.state} — Jugadores:{" "}
                {game.players.join(", ") || "Ninguno"} — Score:{" "}
                {typeof game.score === "object"
                  ? JSON.stringify(game.score)
                  : game.score ?? "-"}
              </p>
              <div className="space-x-2 mt-2">
                <a
                  href={`/join/${game.id}`}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Unirse
                </a>
                <button
                  onClick={() => handleStart(game.id)}
                  disabled={actionLoading === game.id}
                  className={`px-3 py-1 rounded text-white ${
                    actionLoading === game.id
                      ? "bg-yellow-300 cursor-not-allowed"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                >
                  {actionLoading === game.id ? "Iniciando..." : "Iniciar"}
                </button>
                <button
                  onClick={() => handleEnd(game.id)}
                  disabled={actionLoading === game.id}
                  className={`px-3 py-1 rounded text-white ${
                    actionLoading === game.id
                      ? "bg-red-300 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {actionLoading === game.id ? "Finalizando..." : "Finalizar"}
                </button>
                <button
                  onClick={() => handleDelete(game.id)}
                  disabled={actionLoading === game.id}
                  className={`px-3 py-1 rounded text-white ${
                    actionLoading === game.id
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gray-700 hover:bg-gray-800"
                  }`}
                >
                  {actionLoading === game.id ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}