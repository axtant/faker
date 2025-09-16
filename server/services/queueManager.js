const LOBBY_SIZE = parseInt(process.env.LOBBY_SIZE) || 2;
const queue = new Map(); // userId => displayName
const lobbies = new Map(); // lobbyId => lobby object
const userIdToLobbyId = new Map(); // userId => lobbyId (if currently in a lobby)

const lobbyManager = require('../lobby/lobbyManager');
const cs2Server = require('./cs2ServerService');

module.exports = {
  addToQueue(userId, io, displayName) {
    // Prevent users already in a lobby from queueing again
    if (userIdToLobbyId.has(String(userId))) {
      return { queueSize: queue.size, lobbyFormed: false, error: 'User already in a lobby', inLobby: true };
    }

    // Prevent duplicate queue entries
    if (!queue.has(userId)) {
      queue.set(userId, displayName);
    }

    // broadcast current queue state
    io.emit('queueUpdated', this.getState());

    // create a lobby if enough players
    if (queue.size >= LOBBY_SIZE) {
      const players = Array.from(queue.entries()).slice(0, LOBBY_SIZE);
      players.forEach(([id]) => queue.delete(id));

      const playerIds = players.map(([id, name]) => ({ id: String(id), displayName: name }));
      const lobbyId = lobbyManager.createLobby(playerIds);

      lobbies.set(lobbyId, lobbyManager.getLobby(lobbyId));

      // Mark users as assigned to this lobby
      playerIds.forEach(p => userIdToLobbyId.set(String(p.id), lobbyId));

      io.emit('matchCreated', { lobbyId, players: playerIds });

      // Start CS2 instance early to hide startup latency
      // Do not await to avoid blocking queue flow; log result
      (async () => {
        try {
          await cs2Server.startInstance();
          console.log(`CS2 instance started for lobby ${lobbyId}`);
        } catch (err) {
          console.error(`Failed to start CS2 instance for lobby ${lobbyId}:`, err.message);
        }
      })();

      return {
        queueSize: queue.size,
        lobbyFormed: true,
        newLobby: { lobbyId, players: playerIds },
      };
    }

    return { queueSize: queue.size, lobbyFormed: false };
  },

  removeFromQueue(userId, io) {
    if (queue.has(userId)) {
      console.log(`User ${userId} removed from queue`);
      queue.delete(userId);
      io.emit('queueUpdated', this.getState());
    }
    return { queueSize: queue.size };
  },

  getQueue() {
    return { queueSize: queue.size, players: Array.from(queue.values()) };
  },

  getState() {
    return {
      queueSize: queue.size,
      players: Array.from(queue.entries()).map(([id, name]) => ({ id, displayName: name })),
      lobbies: Array.from(lobbies.keys()).length
    };
  },

  resetQueue(io) {
    queue.clear();
    io.emit('queueUpdated', this.getState());
    return { queueSize: 0, players: [] };
  },

  getLobby(lobbyId) {
    return lobbies.get(lobbyId);
  },

  isUserInLobby(userId) {
    return userIdToLobbyId.has(String(userId));
  },

  // Optional: call this when a lobby ends to allow users to re-queue
  releaseLobby(lobbyId, io) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;
    if (Array.isArray(lobby.players)) {
      lobby.players.forEach(p => userIdToLobbyId.delete(String(p.id)));
    }
    lobbies.delete(lobbyId);
    io.emit('lobbyClosed', { lobbyId });
  },
};
