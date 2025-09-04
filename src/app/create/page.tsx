
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./CreateGame.module.scss";

export default function CreateGame() {
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [players, setPlayers] = useState<string[]>(["", ""]);
  const router = useRouter();

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const handleMaxPlayersChange = (value: number) => {
    setMaxPlayers(value);
    setPlayers((prev) => {
      const updated = [...prev];
      if (value > updated.length) {
        return [...updated, ...Array(value - updated.length).fill("")];
      } else {
        return updated.slice(0, value);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (players.some((p) => !p.trim())) {
      alert("⚠️ Debes ingresar todos los nombres de jugadores");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          maxPlayers,
          playerName: players[0],
        }),
      });

      if (!res.ok) throw new Error("Error al crear partida");

      const newGame = await res.json();

      for (let i = 1; i < players.length; i++) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/${newGame.id}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerName: players[i] }),
        });
      }

      alert("✅ Partida creada con todos los jugadores");
      router.push("/");
    } catch (error) {
      console.error(error);
      alert("❌ No se pudo crear la partida");
    }
  };

  return (
    <main className={styles["create-game"]}>
      <h1 className={styles["create-game__title"]}>➕ Crear Partida</h1>
      <form onSubmit={handleSubmit} className={styles["create-game__form"]}>
        <input
          type="text"
          value={name}
          placeholder="Nombre de la partida"
          onChange={(e) => setName(e.target.value)}
          className={styles["create-game__input"]}
        />
        <input
          type="number"
          min={2}
          value={maxPlayers}
          placeholder="Máx jugadores"
          onChange={(e) => handleMaxPlayersChange(Number(e.target.value))}
          className={styles["create-game__input"]}
        />
        {players.map((player, index) => (
          <input
            key={index}
            type="text"
            value={player}
            placeholder={`Nombre del jugador ${index + 1}`}
            onChange={(e) => handlePlayerChange(index, e.target.value)}
            className={styles["create-game__input"]}
          />
        ))}
        <button type="submit" className={styles["create-game__button"]}>
          Crear
        </button>
      </form>
    </main>
  );
}