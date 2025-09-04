"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.scss";

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
  const [loading, setLoading] = useState(false);
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
    } catch {
      alert("❌ No se pudo iniciar la partida");
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
    } catch {
      alert("❌ No se pudo finalizar la partida");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("⚠️ ¿Seguro que deseas eliminar esta partida?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar partida");
      setGames((prev) => prev.filter((g) => g.id !== id));
    } catch {
      alert("❌ No se pudo eliminar la partida");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main className={styles.home}>
      <h1 className={styles["home__title"]}>🎮 Partidas</h1>

      <div className={styles["home__actions"]}>
        <a href="/create" className={styles["home__link"]}>
          ➕ Crear Partida
        </a>
      </div>

      {loading ? (
        <p>Cargando partidas...</p>
      ) : (
        <ul className={styles["home__list"]}>
          {games.map((game) => (
            <li key={game.id} className={styles["home__item"]}>
              <p className={styles["home__game-info"]}>
                <b>{game.name}</b> — Estado: {game.state} — Jugadores:{" "}
                {game.players.join(", ") || "Ninguno"}
              </p>

              {game.state === "finished" && game.score && (
                <p className={styles["home__results"]}>
                  🏆 Resultados:{" "}
                  {Object.entries(game.score)
                    .map(([player, score]) => `${player}: ${score}`)
                    .join(", ")}
                </p>
              )}

              {game.state === "in_progress" && (
                <div className={styles["home__scores"]}>
                  <p className="ingresar">📊 Ingresar puntajes:</p>
                  {game.players.map((player) => (
                    <div key={player} className={styles["home__score-input"]}>
                      <span>{player}</span>
                      <input
                        type="number"
                        value={scoreInputs[game.id]?.[player] ?? ""}
                        onChange={(e) =>
                          handleScoreChange(game.id, player, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className={styles["home__buttons"]}>
                <a href={`/join/${game.id}`} className={`${styles["home__button"]} ${styles["home__button--join"]}`}>
                  Unirse
                </a>
                <button
                  onClick={() => handleStart(game.id)}
                  disabled={actionLoading === game.id}
                  className={`${styles["home__button"]} ${styles["home__button--start"]} ${
                    actionLoading === game.id ? styles["home__button--loading"] : ""
                  }`}
                >
                  {actionLoading === game.id ? "Iniciando..." : "Iniciar"}
                </button>
                <button
                  onClick={() => handleEnd(game.id)}
                  disabled={actionLoading === game.id}
                  className={`${styles["home__button"]} ${styles["home__button--end"]} ${
                    actionLoading === game.id ? styles["home__button--loading"] : ""
                  }`}
                >
                  {actionLoading === game.id ? "Finalizando..." : "Finalizar"}
                </button>
                <button
                  onClick={() => handleDelete(game.id)}
                  disabled={actionLoading === game.id}
                  className={`${styles["home__button"]} ${styles["home__button--delete"]} ${
                    actionLoading === game.id ? styles["home__button--loading"] : ""
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