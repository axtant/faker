// LobbyPage.jsx
import React, { useEffect, useState } from "react";
import { socket } from "./main";
import VetoPage from "./VetoPage";

export default function LobbyPage({ lobby }) {
  const [players, setPlayers] = useState(lobby.players);
  const [veto, setVeto] = useState(null);

  useEffect(() => {
    socket.on("vetoUpdate", (data) => {
      setVeto(data);
    });

    return () => {
      socket.off("vetoUpdate");
    };
  }, []);

  if (veto) {
    return <VetoPage veto={veto} lobbyId={lobby.lobbyId} />;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Lobby Created!</h2>
      <div className="grid grid-cols-2 gap-6 mt-4">
        <div>
          <h3 className="font-bold">Team A</h3>
          <ul>
            {players.slice(0, 5).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold">Team B</h3>
          <ul>
            {players.slice(5).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-6 text-gray-600">
        Waiting for captains to start map veto...
      </p>
    </div>
  );
}
