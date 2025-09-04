"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
    // Ajustar cantidad de inputs según el número de jugadores
    setPlayers((prev) => {
      const updated = [...prev];
      if (value > updated.length) {
        // agregar inputs vacíos
        return [...updated, ...Array(value - updated.length).fill("")];
      } else {
        // recortar jugadores sobrantes
        return updated.slice(0, value);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que todos los nombres estén llenos
    if (players.some((p) => !p.trim())) {
      alert("⚠️ Debes ingresar todos los nombres de jugadores");
      return;
    }

    try {
      // Crear la partida con el primer jugador
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

      // Agregar los demás jugadores con join
      for (let i = 1; i < players.length; i++) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/${newGame.id}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerName: players[i] }),
        });
      }

      alert("✅ Partida creada con todos los jugadores");
      router.push("/"); // redirige al listado
    } catch (error) {
      console.error(error);
      alert("❌ No se pudo crear la partida");
    }
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">➕ Crear Partida</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          placeholder="Nombre de la partida"
          onChange={(e) => setName(e.target.value)}
          className="p-2 border rounded w-full"
        />
        <input
          type="number"
          min={2}
          value={maxPlayers}
          placeholder="Máx jugadores"
          onChange={(e) => handleMaxPlayersChange(Number(e.target.value))}
          className="p-2 border rounded w-full"
        />

        {players.map((player, index) => (
          <input
            key={index}
            type="text"
            value={player}
            placeholder={`Nombre del jugador ${index + 1}`}
            onChange={(e) => handlePlayerChange(index, e.target.value)}
            className="p-2 border rounded w-full"
          />
        ))}

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Crear
        </button>
      </form>
    </main>
  );
}