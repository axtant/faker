const prisma = require('./prismaClient');
const io = require('../server'); // Import socket.io instance from main server

async function addToQueue(userId) {
  const existing = await prisma.matchQueue.findUnique({ where: { userId } });
  if (!existing) {
    await prisma.matchQueue.create({ data: { userId } });
  }
  await checkQueue();
  return await getQueueSize();
}

async function removeFromQueue(userId) {
  await prisma.matchQueue.deleteMany({ where: { userId } });
  return await getQueueSize();
}

async function getQueueSize() {
  return await prisma.matchQueue.count();
}

async function checkQueue() {
  const queue = await prisma.matchQueue.findMany({
    orderBy: { joinedAt: 'asc' }
  });

  while (queue.length >= 2) {
    const playersToMatch = queue.splice(0, 2);

    const playersIds = playersToMatch.map(q => ({ id: q.userId }));
    const match = await prisma.match.create({
      data: {
        players: { connect: playersIds }
      },
      include: { players: true }
    });

    const idsToRemove = playersToMatch.map(p => p.id);
    await prisma.matchQueue.deleteMany({ where: { id: { in: idsToRemove } } });

    // Notify players in the match
    match.players.forEach(player => {
      io.to(player.id).emit('matchCreated', { matchId: match.id, players: match.players });
    });
  }
}

async function getMatchForUser(userId) {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return prisma.match.findFirst({
    where: {
      players: { some: { id: userId } },
      createdAt: { gte: thirtyMinutesAgo }
    },
    include: { players: true }
  });
}

module.exports = {
  addToQueue,
  removeFromQueue,
  getQueueSize,
  getMatchForUser,
};
