// controllers/matchmakingController.js
module.exports = (io, queueManager) => ({
  startMatchmaking: (req, res) => {
    const userId = req.user.id; // only pass userId
    const result = queueManager.addToQueue(userId, io);
    res.json(result);
  },

  leaveMatchmaking: (req, res) => {
    const userId = req.user.id; // only pass userId
    const result = queueManager.removeFromQueue(userId, io);
    res.json(result);
  },

  getMatchmakingStatus: (req, res) => {
    res.json(queueManager.getQueue());
  },

  resetMatchmakingQueue: (req, res) => {
    const result = queueManager.resetQueue(io);
    res.json(result);
  }
});
