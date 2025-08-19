module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl; // so we can send them back after login
    req.flash('error', 'You must be signed in first');
    return res.redirect('/login');
  }
  next();
};
