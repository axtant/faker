// const prisma = require('./prismaClient');
// const io = require('../server'); // Import socket.io instance from main server

// const queue = new Map();

// const matchmakingService = {
//   addToQueue(userId) {
//     queue.set(userId, Date.now());
//     return queue.size;
//   },

//   removeFromQueue(userId) {
//     queue.delete(userId);
//     return queue.size;
//   },

//   getQueueSize() {
//     return queue.size;
//   },

//   cleanupStaleEntries(timeoutSeconds = 60) {
//     const cutoff = Date.now() - timeoutSeconds * 1000;
//     for (const [userId, ts] of queue.entries()) {
//       if (ts < cutoff) {
//         queue.delete(userId);
//         console.log(`Removed stale queue entry for user ${userId}`);
//       }
//     }
//   },
// };

// async function addToQueue(userId) {
//   const existing = await prisma.matchQueue.findUnique({ where: { userId } });
//   if (!existing) {
//     await prisma.matchQueue.create({ data: { userId } });
//   }
//   await checkQueue();
//   return await getQueueSize();
// }

// async function removeFromQueue(userId) {
//   await prisma.matchQueue.deleteMany({ where: { userId } });
//   return await getQueueSize();
// }

// async function getQueueSize() {
//   return await prisma.matchQueue.count();
// }

// async function checkQueue() {
//   const queue = await prisma.matchQueue.findMany({
//     orderBy: { joinedAt: 'asc' }
//   });

//   while (queue.length >= 10) {
//     const playersToMatch = queue.splice(0, 10);
//     const playerIds = playersToMatch.map(q => ({ id: q.userId }));

//     // Pick 2 captains randomly
//     const shuffled = [...playersToMatch].sort(() => Math.random() - 0.5);
//     const captain1 = shuffled[0].userId;
//     const captain2 = shuffled[1].userId;

//     // Random team assignment (after captains chosen)
//     const remaining = shuffled.slice(2).map(p => p.userId);
//     const team1 = [captain1, ...remaining.slice(0, 4)];
//     const team2 = [captain2, ...remaining.slice(4, 8)];

//     const match = await prisma.match.create({
//       data: {
//         players: { connect: playerIds },
//         status: "lobby"
//       },
//       include: { players: true }
//     });

//     await prisma.matchQueue.deleteMany({
//       where: { userId: { in: playersToMatch.map(p => p.userId) } }
//     });

//     io.to(match.id).emit("lobbyCreated", {
//       matchId: match.id,
//       captains: [captain1, captain2],
//       team1,
//       team2,
//       players: match.players
//     });
//   }
// }

// async function getMatchForUser(userId) {
//   const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
//   return prisma.match.findFirst({
//     where: {
//       players: { some: { id: userId } },
//       createdAt: { gte: thirtyMinutesAgo }
//     },
//     include: { players: true }
//   });
// }

// async function resetQueue() {
//   await prisma.matchQueue.deleteMany({});
//   console.log("✅ Queue reset");
// }

// async function cleanupStaleEntries(io) {
//   const now = Date.now();

//   for (const [userId, ts] of queue.entries()) {
//     if (now - ts > 30000) { // 30s timeout
//       queue.delete(userId);

//       // Make sure socket still exists
//       const socket = io.sockets.sockets.get(userId); // adjust if you stored socketId
//       if (socket) {
//         socket.emit('matchmakingTimeout', { reason: 'Stale entry removed' });
//         socket.disconnect(true);
//       }

//       console.log(`Removed stale matchmaking entry for user ${userId}`);
//     }
//   }
// }

// module.exports = {
//   addToQueue,
//   removeFromQueue,
//   getQueueSize,
//   getMatchForUser,
//   resetQueue,
//   cleanupStaleEntries
// };
