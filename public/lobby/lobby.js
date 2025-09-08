const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const lobbyId = urlParams.get('lobbyId');
const statusEl = document.getElementById('status');

let currentUserId = null;
let lobbyState = null;

statusEl.textContent = 'Waiting for other players to join...';

fetch('/api/user')
  .then(res => res.json())
  .then(user => currentUserId = user.id)
  .catch(err => console.error(err));

socket.emit('joinLobby', lobbyId);

socket.on('lobbyUpdated', (data) => {
    lobbyState = data;
    renderLobby();
});

function sendAction(action, map) {
    if (!lobbyState) return;
    const currentCaptain = lobbyState.captains[lobbyState.currentTurnIndex % 2];
    if (currentUserId !== currentCaptain.id) {
        alert('Not your turn!');
        return;
    }
    socket.emit('lobbyAction', { lobbyId, captainId: currentUserId, action, map });
}

function renderLobby() {
    if (!lobbyState) {
        statusEl.textContent = 'Waiting for other players to join...';
        return;
    }

    const currentCaptain = lobbyState.captains[lobbyState.currentTurnIndex % 2];

    statusEl.innerHTML = '';

    const header = document.createElement('h2');
    header.textContent = `${lobbyState.captains[0].displayName} vs ${lobbyState.captains[1].displayName}`;
    statusEl.appendChild(header);

    const info = document.createElement('p');
    info.textContent = `Current Turn: ${lobbyState.turnType.toUpperCase()} by ${currentCaptain.displayName}`;
    statusEl.appendChild(info);

    const bans = document.createElement('p');
    bans.textContent = `Bans: ${lobbyState.bans.join(', ')}`;
    statusEl.appendChild(bans);

    const picks = document.createElement('p');
    picks.textContent = `Picks: ${lobbyState.picks.join(', ')}`;
    statusEl.appendChild(picks);

    const finalMap = document.createElement('p');
    finalMap.textContent = lobbyState.lobbyCompleted
        ? `Final Map: ${lobbyState.finalMap}`
        : `Available Maps:`;
    statusEl.appendChild(finalMap);

    const mapPoolDiv = document.createElement('div');
    mapPoolDiv.id = 'mapPool';
    lobbyState.mapPool.forEach(map => {
        const mapItem = document.createElement('div');
        mapItem.className = 'map-item';
        mapItem.textContent = map;
        mapPoolDiv.appendChild(mapItem);
    });
    statusEl.appendChild(mapPoolDiv);

    const teamADiv = document.createElement('div');
    teamADiv.id = 'teamA';
    teamADiv.innerHTML = '<h3>Team A</h3><ul>' +
        lobbyState.teams.A.map(p =>
            `<li>${p.displayName} ${lobbyState.captains.some(c => c.id === p.id) ? '(Captain)' : ''}</li>`
        ).join('') +
        '</ul>';
    statusEl.appendChild(teamADiv);

    const teamBDiv = document.createElement('div');
    teamBDiv.id = 'teamB';
    teamBDiv.innerHTML = '<h3>Team B</h3><ul>' +
        lobbyState.teams.B.map(p =>
            `<li>${p.displayName} ${lobbyState.captains.some(c => c.id === p.id) ? '(Captain)' : ''}</li>`
        ).join('') +
        '</ul>';
    statusEl.appendChild(teamBDiv);

    const actionButtons = document.createElement('div');
    actionButtons.id = 'actionButtons';

    if (currentUserId === currentCaptain.id && !lobbyState.lobbyCompleted) {
        lobbyState.mapPool.forEach(map => {
            const banBtn = document.createElement('button');
            banBtn.textContent = `Ban ${map}`;
            banBtn.onclick = () => sendAction('ban', map);
            actionButtons.appendChild(banBtn);
        });
    }

    statusEl.appendChild(actionButtons);

    if (lobbyState.lobbyCompleted) {
        const completeMsg = document.createElement('p');
        completeMsg.textContent = 'Lobby completed! Teams are ready.';
        statusEl.appendChild(completeMsg);
    }
}
