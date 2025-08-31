module.exports = (socket, io, queueManager) => {
  const user = socket.request.user;

  if (!user || !user.id) {
    console.log(`❌ Unauthorized socket connection: ${socket.id}`);
    socket.disconnect(true);
    return;
  }

  const userId = user.id;
  console.log(`✅ User ${userId} connected with socket ${socket.id}`);

  // Send current queue state
  socket.emit('queueUpdated', queueManager.getState());

  // Join queue
  socket.on('joinQueue', () => {
    queueManager.addToQueue(userId, io, user.displayName);
  });

  // Leave queue
  socket.on('leaveQueue', () => {
    queueManager.removeFromQueue(userId, io);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
    queueManager.removeFromQueue(userId, io);
  });
};
