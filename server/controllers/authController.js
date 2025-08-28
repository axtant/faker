const passport = require('../services/steamAuthService');

exports.getSteamAuth = passport.authenticate('steam');

exports.getSteamReturn = [
  passport.authenticate('steam', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
];
