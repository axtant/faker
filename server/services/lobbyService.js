let lobbies = [];
let lobbyIdCounter = 1;

/**
 * Create a new lobby with given players
 */
function createLobby(players) {
  const lobby = {
    id: lobbyIdCounter++,
    players,
    createdAt: new Date(),
  };

  lobbies.push(lobby);
  console.log("🎮 New Lobby Created:", lobby);

  // TODO: WebSocket notify players here
  return lobby;
}

/**
 * Return all active lobbies
 */
function getLobbies() {
  return lobbies;
}

module.exports = { createLobby, getLobbies };
