const express = require('express');
const limiter = require("../middlewares/rateLimiter")
const urlController = require("../controller/urlController")
const decodetoken = require("../util/helpers")
const router = express.Router();


router.post('/api/shorten', limiter,decodetoken,urlController.postShortUrl );

router.get("/api/shorten/:alias",limiter,urlController.redirectUrl)



module.exports = router