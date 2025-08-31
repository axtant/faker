import { apiGet, apiPost } from './api.js';
import { loadFriends } from './friends.js';
import { setupMatchmaking } from './matchmaking.js';

let currentUser = null;

async function loadUser() {
  try {
    currentUser = await apiGet('/api/user');
    renderProfile(currentUser);
    renderFriendsAccess(currentUser);
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

function renderFriendsAccess(user) {
  if (user.friendsListAccess) loadFriends();
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