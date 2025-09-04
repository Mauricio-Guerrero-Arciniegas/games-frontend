"use client";
import { useState } from "react";
import { useParams } from "next/navigation";

export default function JoinGame() {
  const params = useParams();
  const gameId = params.id;
  const [playerName, setPlayerName] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/games/${gameId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName }),
    });
    alert("Te uniste a la partida 🎉");
    setPlayerName("");
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">👥 Unirse a Partida</h1>
      <form onSubmit={handleJoin} className="space-y-4">
        <input
          type="text"
          value={playerName}
          placeholder="Tu nombre"
          onChange={(e) => setPlayerName(e.target.value)}
          className="p-2 border rounded w-full"
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Unirse
        </button>
      </form>
    </main>
  );
}