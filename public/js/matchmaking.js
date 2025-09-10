// matchmaking.js
export function setupMatchmaking(currentUser) {
  const socket = io();
  const joinBtn = document.getElementById("join-queue-btn");
  const leaveBtn = document.getElementById("leave-queue-btn");
  const queueSizeEl = document.getElementById("queue-size");
  const matchStatusEl = document.getElementById("match-status");

  let inQueue = false;

  socket.on("queueUpdated", ({ queueSize, players }) => {
    queueSizeEl.textContent = queueSize;
    console.log("Queue updated:", players);
  });

  socket.on("matchCreated", ({ lobbyId, players }) => {
    matchStatusEl.textContent = `✅ Match created`;
    inQueue = false;
    joinBtn.disabled = false;
    leaveBtn.disabled = true;
    if (lobbyId) {
      const dn = encodeURIComponent(currentUser.displayName || '');
      window.location.href = `/lobby/lobby.html?lobbyId=${lobbyId}&userId=${currentUser.id}&displayName=${dn}`;
    }
  });

  joinBtn.addEventListener("click", async () => {
    joinBtn.disabled = true;
    try {
      await fetch("/api/matchmaking/start", { method: "POST" });
      inQueue = true;
      matchStatusEl.textContent = "⏳ Waiting for players...";
      leaveBtn.disabled = false;
    } catch (err) {
      console.error(err);
      joinBtn.disabled = false;
    }
  });

  leaveBtn.addEventListener("click", async () => {
    leaveBtn.disabled = true;
    try {
      await fetch("/api/matchmaking/leave", { method: "POST" });
      inQueue = false;
      matchStatusEl.textContent = "❌ Left the queue.";
      joinBtn.disabled = false;
    } catch (err) {
      console.error(err);
      leaveBtn.disabled = false;
    }
  });
}
