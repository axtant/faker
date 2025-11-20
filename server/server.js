const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const passport = require('./services/steamAuthService');
const testGuestAuth = require('./middleware/testGuestAuth');
const authController = require('./controllers/authController');
const userController = require('./controllers/userController');
const ensureAuthenticated = require('./middleware/ensureAuthenticated');
const socketHandlers = require('./sockets/socketHandlers');
const lobbySocketHandler = require('./lobby/lobbySocketHandler');

const queueManager = require('./services/queueManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
// --- SESSION SETUP ---
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 86400 * 1000 },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(sessionMiddleware);
// In test mode, pre-seed a guest user into the session before passport.session
app.use(testGuestAuth.http);
app.use(passport.initialize());
app.use(passport.session());

// --- SHARE SESSION + PASSPORT WITH SOCKET.IO ---
io.use((socket, next) => sessionMiddleware(socket.request, {}, next));
io.use((socket, next) => testGuestAuth.socket(socket, next));
io.use((socket, next) => passport.initialize()(socket.request, {}, next));
io.use((socket, next) => passport.session()(socket.request, {}, next));

// --- SOCKET HANDLERS ---
io.on('connection', (socket) => socketHandlers(socket, io, queueManager));

// Register lobby socket handlers AFTER session/passport are attached
lobbySocketHandler(io);

// --- ROUTES ---
app.get('/auth/steam', authController.getSteamAuth);
app.get('/auth/steam/return', authController.getSteamReturn);

app.get('/api/user', ensureAuthenticated, userController.getUserProfile);
app.post('/api/grant-friends-access', ensureAuthenticated, userController.grantFriendsAccess);
app.get('/api/friends', ensureAuthenticated, userController.getFriendsList);

const matchmakingController = require('./controllers/matchmakingController')(io, queueManager);

app.post('/api/matchmaking/start', ensureAuthenticated, matchmakingController.startMatchmaking);
app.post('/api/matchmaking/leave', ensureAuthenticated, matchmakingController.leaveMatchmaking);
app.get('/api/matchmaking/status', ensureAuthenticated, matchmakingController.getMatchmakingStatus);

// Serve static pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.get('/dashboard', ensureAuthenticated, (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'))
);

// --- SERVER START ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));

module.exports = io;
