// VetoPage.jsx
import React, { useState } from "react";
import { socket } from "./main";

const maps = ["Dust2", "Mirage", "Inferno", "Nuke", "Overpass", "Ancient"];

export default function VetoPage({ veto, lobbyId }) {
  const [selected, setSelected] = useState(null);

  const handleAction = (map) => {
    setSelected(map);
    socket.emit("vetoAction", { lobbyId, captainId: veto.currentCaptain, map });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Map Veto Phase</h2>
      <p>Current Captain: {veto.currentCaptain}</p>

      <div className="grid grid-cols-2 gap-4 mt-4">
        {maps.map((map) => (
          <button
            key={map}
            disabled={veto.banned.includes(map)}
            onClick={() => handleAction(map)}
            className={`px-4 py-2 rounded-lg border ${
              veto.banned.includes(map)
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 text-white"
            }`}
          >
            {map}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="font-bold">Banned Maps:</h3>
        <ul>
          {veto.banned.map((map, idx) => (
            <li key={idx}>{map}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
