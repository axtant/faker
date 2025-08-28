const ensureAuthenticated = require('../middleware/ensureAuthenticated');
const matchmakingService = require('../services/matchmakingService');

exports.startMatchmaking = [
  ensureAuthenticated,
  async (req, res) => {
    try {
      const queueSize = await matchmakingService.addToQueue(req.user.id);
      res.json({ queueSize });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to join matchmaking queue' });
    }
  }
];

exports.leaveMatchmaking = [
  ensureAuthenticated,
  async (req, res) => {
    try {
      const queueSize = await matchmakingService.removeFromQueue(req.user.id);
      res.json({ queueSize });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to leave matchmaking queue' });
    }
  }
];

exports.getMatchmakingStatus = [
  ensureAuthenticated,
  async (req, res) => {
    try {
      const [queueSize, match] = await Promise.all([
        matchmakingService.getQueueSize(),
        matchmakingService.getMatchForUser(req.user.id),
      ]);
      res.json({ queueSize, match });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to get matchmaking status' });
    }
  }
];
