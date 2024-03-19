const sendAppointmentRoute = require("./sendAppointment");
const oauthRoute = require("./oauth");
const express = require('express');
const router = express.Router();

router.use(oauthRoute);
router.use(sendAppointmentRoute);

module.exports = router;