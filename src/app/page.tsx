"use client";
import { useEffect, useState } from "react";

interface Game {
  id: number;
  name: string;
  state: string;
  players: string[];
  score?: number;
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

  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [playerName, setPlayerName] = useState("");

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

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          maxPlayers,
          playerName: playerName || undefined,
        }),
      });

      if (!res.ok) throw new Error("Error al crear partida");
      const newGame = await res.json();
      setGames((prev) => [...prev, normalizeGame(newGame)]);

      setName("");
      setMaxPlayers(2);
      setPlayerName("");
    } catch (error) {
      console.error(error);
      alert("No se pudo crear la partida ❌");
    }
  };

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
        prev.map((g) =>
          g.id === id ? { ...g, state: "finished", score: randomScore } : g
        )
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

      {/* Formulario de creación */}
      <form
        onSubmit={handleCreateGame}
        className="space-y-4 p-4 border rounded-lg shadow"
      >
        <h2 className="text-xl font-semibold">➕ Crear nueva partida</h2>
        <div>
          <label className="block mb-1">Nombre de la partida</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Máximo de jugadores</label>
          <input
            type="number"
            min={2}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            required
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Tu nombre (jugador opcional)</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Crear Partida
        </button>
      </form>

      {/* Lista de partidas */}
      {loading ? (
        <p className="text-gray-500">Cargando partidas...</p>
      ) : (
        <ul className="space-y-4">
          {games.map((game) => (
            <li key={game.id} className="p-4 border rounded-lg shadow">
              <p>
                <b>{game.name}</b> — Estado: {game.state} — Jugadores:{" "}
                {game.players.join(", ") || "Ninguno"} — Score: {game.score ?? "-"}
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

