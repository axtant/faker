module.exports = (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });

  // TODO: Add more socket event handlers (e.g. vetoAction, lobby events) here
};
