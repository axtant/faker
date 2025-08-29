const matchmakingService = require('../services/matchmakingService');

module.exports = (socket) => {
  const userId = socket.request?.session?.passport?.user;
  console.log(`Socket connected: ${socket.id}, userId: ${userId}`);

  socket.on('disconnect', async () => {
    console.log(`Socket disconnected: ${socket.id}, userId: ${userId}`);
    if (userId) {
      try { await matchmakingService.removeFromQueue(userId); } catch (e) { console.error(e); }
    }
  });
};
