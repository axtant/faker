const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const passport = require('./services/steamAuthService');
const authController = require('./controllers/authController');
const userController = require('./controllers/userController');
const matchmakingController = require('./controllers/matchmakingController');
const ensureAuthenticated = require('./middleware/ensureAuthenticated');
const socketHandlers = require('./sockets/socketHandlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Export io instance for use in services/controllers
module.exports = io;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 86400 * 1000 }, // 1 day
  })
);

app.use(passport.initialize());
app.use(passport.session());

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

// Serve static HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});
app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

// Socket.IO event handling
io.on('connection', socketHandlers);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
