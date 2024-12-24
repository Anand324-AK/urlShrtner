// controllers/authController.js
exports.googleLogin = (req, res) => {
    res.status(200).json({
      message: 'Google user logged in successfully',
      user: req.user,
      token:req.token
    });
  };
  

  
  exports.failedLogin = (req, res) => {
    res.status(401).send('Login failed!');
  };
  