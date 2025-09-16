import { apiGet, apiPost } from './api.js';
import { setupMatchmaking } from './matchmaking.js';

let currentUser = null;

async function loadUser() {
  try {
    currentUser = await apiGet('/api/user');
    renderProfile(currentUser);
    
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
  } catch {
    window.location.href = '/';
  }
}

function renderProfile(user) {
  document.getElementById('userAvatar').src = user.avatarUrl || '/assets/default-avatar.png';
  document.getElementById('displayName').textContent = user.displayName;
  document.getElementById('steamId').textContent = `Steam ID: ${user.steamId}`;
}

 

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await apiPost('/logout');
  window.location.href = '/';
});

window.addEventListener('DOMContentLoaded', async () => {
  await loadUser();
  setupMatchmaking(currentUser);
});

window.addEventListener('DOMContentLoaded', async () => {
  await loadUser();
  setupMatchmaking(currentUser); // pass the user object
});