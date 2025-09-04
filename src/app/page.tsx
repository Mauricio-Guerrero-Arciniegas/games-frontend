"use client";
import React, { useEffect, useState, useCallback } from "react";
import styles from "./page.module.scss";

interface Game {
  id: number;
  name: string;
  state: string;
  players: string[];
  score?: Record<string, number>;
}

interface RawGame {
  id: number;
  name?: string;
  title?: string;
  state: string;
  players?: string[];
  score?: Record<string, number>;
}

const normalizeGame = (raw: RawGame): Game => ({
  id: raw.id,
  name: raw.name || raw.title || `Partida ${raw.id}`,
  state: raw.state,
  players: raw.players || [],
  score: raw.score || {},
});

// Memoizado para que solo se re-renderice si cambian las props
const GameItem = React.memo(({
  game,
  scoreInputs,
  onScoreChange,
  onStart,
  onEnd,
  onDelete,
  actionLoading
}: {
  game: Game;
  scoreInputs: Record<number, Record<string, number>>;
  onScoreChange: (gameId: number, player: string, value: string) => void;
  onStart: (id: number) => void;
  onEnd: (id: number) => void;
  onDelete: (id: number) => void;
  actionLoading: number | null;
}) => (
  <li className={styles.home__item}>
    <p className={styles.home__gameInfo}>
      <b>{game.name}</b> — Estado: {game.state} — Jugadores: {game.players.join(", ") || "Ninguno"}
    </p>

    {game.state === "finished" && game.score && (
      <p className={styles.home__results}>
        🏆 Resultados: {Object.entries(game.score).map(([player, score]) => `${player}: ${score}`).join(", ")}
      </p>
    )}

    {game.state === "in_progress" && (
      <div className={styles.home__scores}>
        <p>📊 Ingresar puntajes:</p>
        {game.players.map(player => (
          <div key={player} className={styles.home__scoreInput}>
            <span>{player}</span>
            <input
              type="number"
              value={scoreInputs[game.id]?.[player] ?? ""}
              onChange={e => onScoreChange(game.id, player, e.target.value)}
            />
          </div>
        ))}
      </div>
    )}

    <div className={styles.home__buttons}>
      <a href={`/join/${game.id}`} className={`${styles.home__button} ${styles.home__buttonJoin}`}>Unirse</a>
      <button
        onClick={() => onStart(game.id)}
        disabled={actionLoading === game.id}
        className={`${styles.home__button} ${styles.home__buttonStart} ${actionLoading === game.id ? styles.home__buttonLoading : ""}`}
      >
        {actionLoading === game.id ? "Iniciando..." : "Iniciar"}
      </button>
      <button
        onClick={() => onEnd(game.id)}
        disabled={actionLoading === game.id}
        className={`${styles.home__button} ${styles.home__buttonEnd} ${actionLoading === game.id ? styles.home__buttonLoading : ""}`}
      >
        {actionLoading === game.id ? "Finalizando..." : "Finalizar"}
      </button>
      <button
        onClick={() => onDelete(game.id)}
        disabled={actionLoading === game.id}
        className={`${styles.home__button} ${styles.home__buttonDelete} ${actionLoading === game.id ? styles.home__buttonLoading : ""}`}
      >
        {actionLoading === game.id ? "Eliminando..." : "Eliminar"}
      </button>
    </div>
  </li>
));

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [scoreInputs, setScoreInputs] = useState<Record<number, Record<string, number>>>({});

  const API = `${process.env.NEXT_PUBLIC_API_URL}/api`;

  // Función para actualizar solo los juegos que cambian
  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch(`${API}/games`);
      if (!res.ok) throw new Error("Error al obtener partidas");

      const data: RawGame[] = await res.json();
      const normalized = data.map(normalizeGame);

      setGames(prev => {
        // Solo actualiza si hay cambios
        const hasChanged = normalized.some((g, i) =>
          !prev[i] || JSON.stringify(prev[i]) !== JSON.stringify(g)
        );
        return hasChanged ? normalized : prev;
      });
    } catch (error) {
      console.error(error);
    }
  }, [API]);

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, [fetchGames]);

  const handleStart = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/games/${id}/start`, { method: "PATCH" });
      if (!res.ok) throw new Error("Error al iniciar partida");
      setGames(prev => prev.map(g => g.id === id ? { ...g, state: "in_progress" } : g));
    } catch {
      alert("❌ No se pudo iniciar la partida");
    } finally {
      setActionLoading(null);
    }
  };

  const handleScoreChange = (gameId: number, player: string, value: string) => {
    setScoreInputs(prev => ({
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
      const res = await fetch(`${API}/games/${id}/end`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: scores }),
      });
      if (!res.ok) throw new Error("Error al finalizar partida");
      setGames(prev => prev.map(g => g.id === id ? { ...g, state: "finished", score: scores } : g));
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
      const res = await fetch(`${API}/games/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar partida");
      setGames(prev => prev.filter(g => g.id !== id));
    } catch {
      alert("❌ No se pudo eliminar la partida");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main className={styles.home}>
      <h1 className={styles.home__title}>🎮 Partidas</h1>
      <div className={styles.home__actions}>
        <a href="/create" className={styles.home__link}>➕ Crear Partida</a>
      </div>

      {loading ? (
        <p>Cargando partidas...</p>
      ) : (
        <ul className={styles.home__list}>
          {games.map(game => (
            <GameItem
              key={game.id}
              game={game}
              scoreInputs={scoreInputs}
              onScoreChange={handleScoreChange}
              onStart={handleStart}
              onEnd={handleEnd}
              onDelete={handleDelete}
              actionLoading={actionLoading}
            />
          ))}
        </ul>
      )}
    </main>
  );
}