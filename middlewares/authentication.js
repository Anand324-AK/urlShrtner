const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
   
    const user = req.user;    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    req.token = token
    next()

}



module.exports = authMiddleware