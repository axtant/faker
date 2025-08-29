import { apiPost, apiGet } from './api.js';

let socket;
let inQueue = false;

export function setupMatchmaking(user) {
  socket = io('', { query: { userId: user.id } });

  socket.on('matchCreated', data => {
    if (data.players.some(p => p.id === user.id)) {
      renderMatch(data.players);
    }
  });

  document.getElementById('toggleQueueBtn').addEventListener('click', toggleQueue);
}

async function toggleQueue() {
  const btn = document.getElementById('toggleQueueBtn');
  btn.disabled = true;

  if (!inQueue) {
    await apiPost('/api/matchmaking/start');
    btn.textContent = 'Leave Queue';
    inQueue = true;
  } else {
    await apiPost('/api/matchmaking/leave');
    btn.textContent = 'Start Matchmaking';
    inQueue = false;
  }

  btn.disabled = false;
}

function renderMatch(players) {
  const list = document.getElementById('matchPlayersList');
  list.innerHTML = players.map(p => `<li>${p.displayName}</li>`).join('');
  document.getElementById('matchFound').style.display = 'block';
}
