// routes/authRoutes.js
const express = require('express');
 const passport = require('../middlewares/passportMiddleware');
const authController = require('../controller/authController');
const authMiddleware = require("../middlewares/authentication")
const router = express.Router();
// middlewares/passportMiddleware.js



// Google Login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google Auth Callback
router.get('/google/auth', passport.authenticate('google', { failureRedirect: '/auth/failed' }),authMiddleware, authController.googleLogin);



module.exports = router;
