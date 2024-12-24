const express = require("express");
const analyticsController = require("../controller/analyticsController")
const decodetoken = require("../util/helpers")
const router = express.Router();


router.get("/api/analytics/overall",decodetoken,analyticsController.overAllClickHandler)

router.get("/api/analytics/:alias",decodetoken,analyticsController.clickEventsHandler)

router.get("/api/analytics/topic/:topic",decodetoken,analyticsController.topicHandler)


module.exports = router