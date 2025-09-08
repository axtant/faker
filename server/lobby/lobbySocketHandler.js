const lobbyManager = require('./lobbyManager');

module.exports = function(io) {
    io.on('connection', (socket) => {
        const { userId, displayName } = socket.handshake.query;
        if (!userId) {
            console.log(`❌ Unauthorized socket connection: ${socket.id}`);
            socket.disconnect();
            return;
        }

        console.log(`✅ User ${displayName} connected`);

        // Join lobby room
        socket.on('joinLobby', (lobbyId) => {
            const lobby = lobbyManager.getLobby(lobbyId);
            if (lobby) {
                socket.join(lobbyId);
                socket.emit('lobbyUpdated', lobby);
            } else {
                socket.emit('lobbyError', 'Lobby not found');
            }
        });

        // Ban map
        socket.on('lobbyAction', ({ lobbyId, action, map }) => {
            try {
                if (action === 'ban') {
                    const lobby = lobbyManager.performBan(lobbyId, userId, map);
                    io.to(lobbyId).emit('lobbyUpdated', lobby);
                } else {
                    socket.emit('lobbyError', 'Invalid action');
                }
            } catch (err) {
                socket.emit('lobbyError', err.message);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User ${displayName} disconnected`);
        });
    });
};
