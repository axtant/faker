const lobbies = new Map();
const MAP_POOL = ['MapA', 'MapB', 'MapC', 'MapD', 'MapE'];

function createLobby(players) {
    // normalize ids as strings to avoid mismatches
    const normalizedPlayers = players.map(p => ({ id: String(p.id), displayName: p.displayName }));
    const lobbyId = Date.now().toString();

    // Assign first 2 players as captains
    const captains = [normalizedPlayers[0], normalizedPlayers[1]];

    // Remaining players
    const remainingPlayers = normalizedPlayers.slice(2);

    const teams = { A: [captains[0]], B: [captains[1]] };

    // Fill teams alternately
    remainingPlayers.forEach((p, idx) => {
        if (idx % 2 === 0) teams.A.push(p);
        else teams.B.push(p);
    });

    lobbies.set(lobbyId, {
        players: normalizedPlayers,
        captains,
        teams,
        mapPool: [...MAP_POOL],
        bans: [],
        currentTurnIndex: 0, // which captain's turn
        lobbyCompleted: false,
        finalMap: null
    });

    return lobbyId;
}

function getLobby(lobbyId) {
    return lobbies.get(lobbyId);
}

function performBan(lobbyId, captainId, map) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby || lobby.lobbyCompleted) return lobby;

    const currentCaptain = lobby.captains[lobby.currentTurnIndex % 2];
    if (String(currentCaptain.id) !== String(captainId)) throw new Error('Not your turn');

    if (!lobby.mapPool.includes(map)) throw new Error('Invalid map');

    // Add to ban list & remove from pool
    lobby.bans.push(map);
    lobby.mapPool = lobby.mapPool.filter(m => m !== map);

    // Check if veto completed
    if (lobby.mapPool.length === 1) {
        lobby.finalMap = lobby.mapPool[0];
        lobby.lobbyCompleted = true;
    } else {
        // Next captain turn
        lobby.currentTurnIndex += 1;
    }

    return lobby;
}

// ==================== Test Lobby ====================
// if (process.env.NODE_ENV !== 'production') {
//     const testPlayers = Array.from({ length: 10 }, (_, i) => ({
//         id: (i + 1).toString(),
//         displayName: `TestPlayer${i + 1}`
//     }));
//     const testLobbyId = createLobby(testPlayers);
//     console.log('Test Lobby Created with 10 Players. Lobby ID:', testLobbyId);
// }

module.exports = { createLobby, getLobby, performBan };
