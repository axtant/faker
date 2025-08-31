const matchmakingService = require('../services/matchmakingService');
const queueManager = require('../services/queueManager');

// Track active sockets (userId -> socket.id)
const activeSockets = {};

// ✅ helper: broadcast to all players in a lobby
function broadcastToLobby(io, lobbyId, event, data) {
  const lobby = queueManager.lobbies[lobbyId];
  if (!lobby) return;

  lobby.players.forEach(pid => {
    const sid = activeSockets[pid];
    if (sid) io.to(sid).emit(event, data);
  });
}

// ✅ helper: broadcast queue status to everyone waiting
function broadcastQueue(io) {
  queueManager.queue.forEach((pid, idx) => {
    const sid = activeSockets[pid];
    if (sid) {
      io.to(sid).emit("queueUpdate", {
        queueSize: queueManager.queue.length,
        position: idx + 1,
        message: "Waiting for players..."
      });
    }
  });
}

module.exports = (socket, io) => {
  const userId = socket.request?.session?.passport?.user;
  console.log(`Socket connected: ${socket.id}, userId: ${userId}`);

  if (!userId) {
    console.log("⚠️ No userId found for this socket");
    return;
  }

  // persist mapping
  activeSockets[userId] = socket.id;

  /**
   * Player joins queue
   */
  socket.on("joinQueue", () => {
    try {
      const result = queueManager.addPlayer(userId);

      if (result.status === "waiting") {
        broadcastQueue(io); // ✅ everyone sees updated queue
      }

      if (result.status === "lobby_created") {
        broadcastToLobby(io, result.lobbyId, "lobbyCreated", result);
      }
    } catch (err) {
      console.error("Error adding player to queue:", err);
    }
  });

  /**
   * Veto system (captain actions)
   */
  socket.on("vetoAction", ({ lobbyId, captainId, map }) => {
    try {
      const result = queueManager.handleVeto(lobbyId, captainId, map);
      broadcastToLobby(io, lobbyId, "vetoUpdate", result);
    } catch (err) {
      console.error("Error in vetoAction:", err);
    }
  });

  /**
   * Player leaves queue manually
   */
  socket.on("leaveQueue", () => {
    try {
      queueManager.removePlayer(userId);
      broadcastQueue(io); // ✅ refresh queue for everyone
      io.to(socket.id).emit("queueUpdate", { message: "You left the queue" });
    } catch (err) {
      console.error("Error removing player from queue:", err);
    }
  });

  /**
   * Handle disconnect → auto remove
   */
  socket.on("disconnect", async () => {
    console.log(`Socket disconnected: ${socket.id}, userId: ${userId}`);
    delete activeSockets[userId];

    try {
      queueManager.removePlayer(userId);
      await matchmakingService.removeFromQueue(userId);

      // ✅ Update both queue + any lobby he was part of
      broadcastQueue(io);

      // check if was inside a lobby
      for (const lobbyId in queueManager.lobbies) {
        if (queueManager.lobbies[lobbyId].players.includes(userId)) {
          broadcastToLobby(io, lobbyId, "playerLeft", {
            lobbyId,
            playerId: userId
          });
        }
      }
    } catch (err) {
      console.error("Error on disconnect cleanup:", err);
    }
  });
};
