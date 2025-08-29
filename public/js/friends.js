import { apiGet, apiPost } from './api.js';

export async function loadFriends() {
  try {
    const friends = await apiGet('/api/friends');
    renderFriends(friends);
  } catch (err) {
    console.error('Failed to load friends:', err);
  }
}

function renderFriends(friends) {
  const grid = document.getElementById('friendsGrid');
  grid.innerHTML = friends.map(f => `
    <div class="friend-card">
      <img src="${f.avatarUrl}" class="friend-avatar"/>
      <h4>${f.displayName}</h4>
    </div>`).join('');
}
