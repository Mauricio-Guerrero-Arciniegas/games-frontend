"use client";
import { useEffect, useState } from "react";

interface Game {
  id: number;
  name: string;
  state: string;
  players: string[];
  score?: Record<string, number>;
}


const normalizeGame = (raw: any): Game => ({
  id: raw.id,
  name: raw.name || raw.title || `Partida ${raw.id}`,
  state: raw.state,
  players: raw.players || [],
  score: raw.score || {},
});

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [scoreInputs, setScoreInputs] = useState<Record<number, Record<string, number>>>({});

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

  // Polling automático cada 5 segundos
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

  const handleScoreChange = (gameId: number, player: string, value: string) => {
    setScoreInputs((prev) => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        [player]: Number(value) || 0,
      },
    }));
  };

  const handleEnd = async (id: number) => {
    setActionLoading(id);
    const scores = scoreInputs[id] || {};
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/${id}/end`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: scores }),
      });
      if (!res.ok) throw new Error("Error al finalizar partida");
      setGames((prev) =>
        prev.map((g) => (g.id === id ? { ...g, state: "finished", score: scores } : g))
      );
    } catch (error) {
      console.error(error);
      alert("No se pudo finalizar la partida ❌");
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
            <li key={game.id} className="p-4 border rounded-lg shadow space-y-2">
              <p>
                <b>{game.name}</b> — Estado: {game.state} — Jugadores:{" "}
                {game.players.join(", ") || "Ninguno"}
              </p>

              {game.state === "finished" && game.score && (
                <p>
                  <b>🏆 Resultados:</b>{" "}
                  {Object.entries(game.score)
                    .map(([player, score]) => `${player}: ${score}`)
                    .join(", ")}
                </p>
              )}

              {game.state === "in_progress" && (
                <div className="space-y-2">
                  <p className="font-semibold">📊 Ingresar puntajes:</p>
                  {game.players.map((player) => (
                    <div key={player} className="flex items-center gap-2">
                      <span className="w-32">{player}</span>
                      <input
                        type="number"
                        className="border p-1 rounded w-20"
                        value={scoreInputs[game.id]?.[player] ?? ""}
                        onChange={(e) =>
                          handleScoreChange(game.id, player, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

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
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}