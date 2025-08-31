// queueManager.js
const LOBBY_SIZE = process.env.LOBBY_SIZE || 2;

class QueueManager {
  constructor() {
    this.queue = [];       // players waiting
    this.lobbies = {};     // active lobbies { lobbyId: { players, status, vetoState } }
    this.lobbyCount = 0;
  }

  // Add player to queue
  addPlayer(playerId) {
    if (this.queue.includes(playerId)) {
      return { status: "already_queued", queueSize: this.queue.length };
    }

    this.queue.push(playerId);

    if (this.queue.length >= LOBBY_SIZE) {
      const playersForLobby = this.queue.splice(0, LOBBY_SIZE);
      return this.createLobby(playersForLobby);
    }

    return { status: "waiting", queueSize: this.queue.length };
  }

  removePlayer(playerId) {
  // Remove from queue if still waiting
  this.queue = this.queue.filter(p => p !== playerId);

  // Remove from lobbies if already inside
  for (const lobbyId in this.lobbies) {
    const lobby = this.lobbies[lobbyId];

    if (lobby.players.includes(playerId)) {
      lobby.players = lobby.players.filter(p => p !== playerId);

      // Also clean from teams if captains already picked
      lobby.teams.team1 = lobby.teams.team1.filter(p => p !== playerId);
      lobby.teams.team2 = lobby.teams.team2.filter(p => p !== playerId);

      // If a captain left → handle reassign
      if (lobby.captains.includes(playerId)) {
        lobby.captains = lobby.captains.filter(c => c !== playerId);
        // Optionally promote a random player as new captain
        const available = lobby.players.filter(p => !lobby.captains.includes(p));
        if (available.length > 0) {
          const newCaptain = available[0];
          lobby.captains.push(newCaptain);
          lobby.teams.team1.push(newCaptain); // put in first team by default
        }
      }

      // If lobby empty → delete it
      if (lobby.players.length === 0) {
        delete this.lobbies[lobbyId];
      }
    }
  }
}

  // Create new lobby & immediately start veto system
  createLobby(players) {
    this.lobbyCount++;
    const lobbyId = `lobby_${this.lobbyCount}`;

    // Pick 2 captains randomly
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    const captains = [shuffled[0], shuffled[1]];

    this.lobbies[lobbyId] = {
      id: lobbyId,
      players,
      captains,
      teams: { team1: [captains[0]], team2: [captains[1]] },
      status: "veto_phase",
      vetoState: {
        currentTurn: captains[0], // Captain1 starts
        mapsPool: ["Dust2", "Mirage", "Inferno", "Nuke", "Overpass", "Vertigo", "Ancient"],
        bans: [],
        finalMap: null
      },
      createdAt: Date.now()
    };

    return {
      status: "lobby_created",
      lobbyId,
      players,
      captains,
      message: `Lobby created. Captains are ${captains[0]} and ${captains[1]}.`
    };
  }

  // Handle veto actions (ban/pick maps)
  handleVeto(lobbyId, captainId, map) {
    const lobby = this.lobbies[lobbyId];
    if (!lobby || lobby.status !== "veto_phase") {
      return { error: "Invalid lobby or veto phase not active." };
    }

    const veto = lobby.vetoState;

    if (veto.currentTurn !== captainId) {
      return { error: "Not your turn!" };
    }

    if (!veto.mapsPool.includes(map)) {
      return { error: "Map not available in pool." };
    }

    // Ban the map
    veto.mapsPool = veto.mapsPool.filter(m => m !== map);
    veto.bans.push({ captain: captainId, map });

    // Switch turn to other captain
    veto.currentTurn = lobby.captains.find(c => c !== captainId);

    // If only 1 map left → final map chosen
    if (veto.mapsPool.length === 1) {
      veto.finalMap = veto.mapsPool[0];
      lobby.status = "in_game";
      return {
        status: "map_chosen",
        finalMap: veto.finalMap,
        message: `Final map is ${veto.finalMap}. Lobby moving to server creation.`
      };
    }

    return {
      status: "map_banned",
      nextTurn: veto.currentTurn,
      remainingMaps: veto.mapsPool
    };
  }

  getQueueStatus() {
    return {
      currentQueue: this.queue,
      waitingCount: this.queue.length,
      activeLobbies: Object.keys(this.lobbies).length
    };
  }
  addToQueue(playerId) { /* ... */ }
  removeFromQueue(playerId) { /* ... */ }
  getQueueSize() { return this.queue.length; }

  checkQueue() {
    // handle lobby creation
  }

  cleanupStaleEntries() {
    // no-op for memory testing
    return;
  }

  getMatchForUser(playerId) {
  for (const lobbyId in this.lobbies) {
    const lobby = this.lobbies[lobbyId];
    if (lobby.players.includes(playerId)) {
      return lobby;
    }
  }
  return null;
}
}

module.exports = new QueueManager();
