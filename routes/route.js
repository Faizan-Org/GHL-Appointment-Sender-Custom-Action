const sendAppointmentRoute = require("./sendAppointment");
const getAllLocationRoute = require("./locations");
const getCalendarRoute = require("./calendars");
const getAllUserRoute = require("./users");
const oauthRoute = require("./oauth");
const contactPDFRoute = require("./pdf");
const appointmentLogsRoute = require("./appointmentLogs");
const contactTagsRoute = require("./contactTags");
const contactSearchRoute = require("./getContacts");
const express = require('express');
const router = express.Router();

router.use(oauthRoute);
router.use(sendAppointmentRoute);
router.use(getAllLocationRoute);
router.use(getAllUserRoute);
router.use(getCalendarRoute);
router.use(appointmentLogsRoute);
router.use(contactPDFRoute);
router.use(contactTagsRoute);
router.use(contactSearchRoute);

module.exports = router;