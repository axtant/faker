// QueuePage.jsx
import React, { useState, useEffect } from "react";
import { socket } from "./main";

export default function QueuePage() {
  const [status, setStatus] = useState("Idle");
  const [queueSize, setQueueSize] = useState(0);
  const [lobby, setLobby] = useState(null);

  useEffect(() => {
    socket.on("queueUpdate", (data) => {
      setStatus(data.message);
      setQueueSize(data.queueSize || 0);
    });

    socket.on("lobbyCreated", (lobbyData) => {
      setLobby(lobbyData);
    });

    return () => {
      socket.off("queueUpdate");
      socket.off("lobbyCreated");
    };
  }, []);

  const joinQueue = () => {
    socket.emit("joinQueue");
    setStatus("Searching...");
  };

  const leaveQueue = () => {
    socket.emit("leaveQueue");
    setStatus("Left queue");
  };

  if (lobby) {
    return <LobbyPage lobby={lobby} />;
  }

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold">Matchmaking</h1>
      <p>Status: {status}</p>
      <p>Players in queue: {queueSize}/10</p>
      <button
        onClick={joinQueue}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4"
      >
        Join Queue
      </button>
      <button
        onClick={leaveQueue}
        className="bg-red-500 text-white px-4 py-2 rounded-lg mt-2"
      >
        Leave Queue
      </button>
    </div>
  );
}
