const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

// Register form
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// Create account
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;  // name attributes in form
    const user = new User({ username, email });
    const registeredUser = await User.register(user, password); // hashes & saves
    req.login(registeredUser, (err) => {               // auto login after register
      if (err) return next(err);
      req.flash('success', `Welcome, ${registeredUser.username}!`);
      res.redirect('/toilets');
    });
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/register');
  }
});

// Login form
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// Login
router.post(
  '/login',
  passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }),
  (req, res) => {
    req.flash('success', 'Welcome back!');
    const redirectUrl = req.session.returnTo || '/toilets';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

// Logout (Passport 0.6+ uses callback)
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'Logged out successfully');
    res.redirect('/toilets');
  });
});

module.exports = router;
