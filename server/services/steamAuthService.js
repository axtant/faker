const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const prisma = require('./prismaClient');
require('dotenv').config();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { friends: true }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(new SteamStrategy({
  returnURL: `${process.env.DOMAIN}/auth/steam/return`,
  realm: process.env.DOMAIN,
  apiKey: process.env.STEAM_API_KEY,
}, async (identifier, profile, done) => {
  try {
    const steamId = identifier.split('/').pop();

    let user = await prisma.user.findUnique({ where: { steamId } });
    const userData = {
      steamId,
      displayName: profile.displayName || 'Unknown',
      avatarUrl: profile.photos && profile.photos[2] ? profile.photos[1].value : null,
      profileUrl: profile._json ? profile._json.profileurl : `https://steamcommunity.com/profiles/${steamId}`,
      realName: profile._json ? profile._json.realname : null,
      country: profile._json ? profile._json.loccountrycode : null,
      state: profile._json ? profile._json.locstatecode : null,
      city: profile._json ? profile._json.loccityid : null,
      lastLoginAt: new Date(),
    };

    if (user) {
      user = await prisma.user.update({
        where: { steamId },
        data: userData,
      });
    } else {
      user = await prisma.user.create({ data: userData });
    }

    return done(null, user);
  } catch (error) {
    console.error('Steam authentication error:', error);
    return done(error, null);
  }
}));

module.exports = passport;
