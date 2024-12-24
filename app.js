const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');
const expressSession = require('express-session');
const dotenv = require('dotenv');
const urlRoute = require("./routes/urlRoute")
// Import routes
const authRoutes = require('./routes/authRoute');
const analyticsRoute = require("./routes/analyticsRoute")
// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Express Session Middleware
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET || 'secret_key',
    resave: true,
    saveUninitialized: true,
  })
);

// Initialize Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Use routes
app.use(authRoutes);
app.use(urlRoute)
app.use(analyticsRoute)
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.log(err);
  });


const PORT = process.env.PORT || 3100;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
