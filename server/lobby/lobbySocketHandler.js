const lobbyManager = require('./lobbyManager');
const cs2Server = require('../services/cs2ServerService');

module.exports = function(io) {
    io.on('connection', (socket) => {
        const sessionUser = socket.request && socket.request.user;
        const userId = sessionUser?.id ? String(sessionUser.id) : String(socket.handshake.query.userId || '');
        const displayName = sessionUser?.displayName || socket.handshake.query.displayName || 'Anonymous';
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
                    const lobby = lobbyManager.performBan(lobbyId, String(userId), map);
                    io.to(lobbyId).emit('lobbyUpdated', lobby);

                    // If veto completed, change level quickly without restart
                    if (lobby && lobby.lobbyCompleted && lobby.finalMap) {
                        (async () => {
                            try {
                                await cs2Server.changeLevel(lobby.finalMap);
                                io.to(lobbyId).emit('serverStatus', { status: 'map_changed', map: lobby.finalMap });
                            } catch (err) {
                                console.error('Failed to change level:', err.message);
                                io.to(lobbyId).emit('serverStatus', { status: 'error', message: err.message });
                            }
                        })();
                    }
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
