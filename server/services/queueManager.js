const LOBBY_SIZE = parseInt(process.env.LOBBY_SIZE) || 2;

const queue = new Map(); // userId => displayName
const lobbies = [];      // stores completed lobbies

module.exports = {
  addToQueue(userId, io, displayName) {
    queue.set(userId, displayName);

    // broadcast current queue state
    io.emit('queueUpdated', this.getState());

    // create a lobby if enough players
    if (queue.size >= LOBBY_SIZE) {
      const players = Array.from(queue.entries()).slice(0, LOBBY_SIZE);
      players.forEach(([id]) => queue.delete(id));

      lobbies.push({ players, createdAt: Date.now() });

      io.emit('matchCreated', {
        players: players.map(([id, name]) => ({ id, displayName: name })),
      });

      return {
        queueSize: queue.size,
        lobbyFormed: true,
        newLobby: players.map(([id, name]) => ({ id, displayName: name })),
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
    return { queueSize: queue.size, players: Array.from(queue.entries()).map(([id, name]) => ({ id, displayName: name })) };
  },

  resetQueue(io) {
    queue.clear();
    io.emit('queueUpdated', this.getState());
    return { queueSize: 0, players: [] };
  },
};
