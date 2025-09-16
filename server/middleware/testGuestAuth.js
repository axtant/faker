const prisma = require('../services/prismaClient');

function generateGuestDisplayName(session) {
	if (!session.guestName) {
		const randomNumber = Math.floor(1000 + Math.random() * 9000);
		session.guestName = `Guest ${randomNumber}`;
	}
	return session.guestName;
}

async function ensureGuestUserInSession(req) {
	if (req.isAuthenticated && req.isAuthenticated()) return;
	if (!req.session) return;

	if (!req.session.guestId) {
		req.session.guestId = require('crypto').randomBytes(8).toString('hex');
	}

	const guestId = req.session.guestId;
	const steamId = `guest_${guestId}`;
	const displayName = generateGuestDisplayName(req.session);

	let user = await prisma.user.findUnique({ where: { steamId } });
	if (!user) {
		user = await prisma.user.create({
			data: {
				steamId,
				displayName,
				avatarUrl: null,
				profileUrl: `https://example.com/guest/${guestId}`,
				lastLoginAt: new Date(),
			},
		});
	}

	// Attach to passport session so passport.session() can deserialize
	req.session.passport = { user: user.id };
}

// Express middleware
async function http(req, res, next) {
	try {
		if (process.env.TEST_MODE === 'true') {
			await ensureGuestUserInSession(req);
		}
		next();
	} catch (error) {
		console.error('Test guest auth (http) error:', error);
		next();
	}
}

// Socket.IO middleware (uses socket.request like an express req)
async function socket(socket, next) {
	try {
		if (process.env.TEST_MODE === 'true') {
			await ensureGuestUserInSession(socket.request);
		}
		next();
	} catch (error) {
		console.error('Test guest auth (socket) error:', error);
		next(error);
	}
}

module.exports = { http, socket };


