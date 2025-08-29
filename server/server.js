const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const matchmakingService = require('./services/matchmakingService');
const passport = require('./services/steamAuthService');
const authController = require('./controllers/authController');
const userController = require('./controllers/userController');
const matchmakingController = require('./controllers/matchmakingController');
const ensureAuthenticated = require('./middleware/ensureAuthenticated');
const socketHandlers = require('./sockets/socketHandlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// --- SESSION SETUP ---
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 86400 * 1000 }, // 1 day
});

// --- Express Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Use session + passport for Express routes
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// --- SHARE SESSION + PASSPORT WITH SOCKET.IO ---
io.use((socket, next) => sessionMiddleware(socket.request, {}, next));
io.use((socket, next) => passport.initialize()(socket.request, {}, next));
io.use((socket, next) => passport.session()(socket.request, {}, next));

// Export io instance for use in services/controllers
module.exports = io;

// --- ROUTES ---
// Auth routes
app.get('/auth/steam', authController.getSteamAuth);
app.get('/auth/steam/return', authController.getSteamReturn);

// User routes
app.get('/api/user', ensureAuthenticated, userController.getUserProfile);
app.post('/api/grant-friends-access', ensureAuthenticated, userController.grantFriendsAccess);
app.get('/api/friends', ensureAuthenticated, userController.getFriendsList);

// Matchmaking routes
app.post('/api/matchmaking/start', ensureAuthenticated, matchmakingController.startMatchmaking);
app.post('/api/matchmaking/leave', ensureAuthenticated, matchmakingController.leaveMatchmaking);
app.get('/api/matchmaking/status', ensureAuthenticated, matchmakingController.getMatchmakingStatus);
app.post('/api/matchmaking/reset', matchmakingController.resetMatchmakingQueue);

// Serve static HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});
app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

// --- SOCKET HANDLERS ---
io.on('connection', (socket) => {
  socketHandlers(socket, io);
});

// --- CLEANUP STALE QUEUE ENTRIES ---
setInterval(() => {
  matchmakingService.cleanupStaleEntries(io).catch(console.error);
}, 15_000);

// --- SERVER START ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
