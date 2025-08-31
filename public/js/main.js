// main.js
import { io } from "socket.io-client";
if (document.getElementById('steamLoginBtn')) {
  import('./auth.js').then(m => m.initAuth());
}

if (document.getElementById('dashboardContent')) {
  import('./dashboard.js').then(m => m.initDashboard());
}

export const socket = io("http://localhost:3000", {
  withCredentials: true,
});

// Example logging
socket.on("connect", () => console.log("✅ Connected:", socket.id));