const sendAppointmentRoute = require("./sendAppointment");
const getAllLocationRoute = require("./locations");
const getCalendarRoute = require("./calendars");
const getAllUserRoute = require("./users");
const oauthRoute = require("./oauth");
const express = require('express');
const router = express.Router();

router.use(oauthRoute);
router.use(sendAppointmentRoute);
router.use(getAllLocationRoute);
router.use(getAllUserRoute);
router.use(getCalendarRoute);

module.exports = router;