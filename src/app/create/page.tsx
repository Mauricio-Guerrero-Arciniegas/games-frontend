"use client";
import { useState } from "react";

export default function CreateGame() {
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [playerName, setPlayerName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, maxPlayers, playerName }),
    });
    alert("Partida creada 🎉");
    setName("");
    setPlayerName("");
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
          value={maxPlayers}
          placeholder="Máx jugadores"
          onChange={(e) => setMaxPlayers(Number(e.target.value))}
          className="p-2 border rounded w-full"
        />
        <input
          type="text"
          value={playerName}
          placeholder="Tu nombre"
          onChange={(e) => setPlayerName(e.target.value)}
          className="p-2 border rounded w-full"
        />
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