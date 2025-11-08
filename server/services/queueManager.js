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
      // Automatically finds a free instance and assigns it to this lobby
      // Do not await to avoid blocking queue flow; log result
      (async () => {
        try {
          const result = await cs2Server.startInstance(null, null, lobbyId);
          console.log(`✅ CS2 instance ${result.instance} started for lobby ${lobbyId}`);
        } catch (err) {
          const errorMsg = err.message || err.toString() || 'Unknown error';
          const errorCode = err.code || 'NO_CODE';
          console.error(`❌ Failed to start CS2 instance for lobby ${lobbyId}:`, errorMsg);
          console.error(`   Error code: ${errorCode}`);
          if (err.stack) {
            console.error(`   Stack: ${err.stack}`);
          }
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
    
    // Release CS2 instance assignment (if any)
    // Find which instance was assigned to this lobby and release it
    const allStatuses = cs2Server.getAllInstanceStatuses().then(statuses => {
      for (const status of statuses) {
        if (status.lobbyId === lobbyId) {
          cs2Server.releaseInstance(status.instance, lobbyId);
          console.log(`Released CS2 instance ${status.instance} from lobby ${lobbyId}`);
          break;
        }
      }
    }).catch(err => {
      console.error(`Error releasing instance for lobby ${lobbyId}:`, err.message);
    });
    
    lobbies.delete(lobbyId);
    io.emit('lobbyClosed', { lobbyId });
  },
};
