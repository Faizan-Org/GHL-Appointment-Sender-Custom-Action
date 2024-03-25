const express = require('express');
const router = express.Router();
const {makeApiCall} = require("../global/globalFns");
const axios = require('axios').default;
router.post("/appointment/send", async (req, res) => {
    let error;
    try {
        let body = req.body || {};
        let {
            appointmentTitle,
            contactId,
            appointmentStartTime,
            appointmentEndTime,
            appointmentStatus,
            appointmentAddress,
            app_location,
            app_assign_user,
            app_to_notify,
            app_ignore_date_range
        } = body;
        try {
            await axios.request({
                url: "https://webhook.site/0bf4d066-eb3f-4cfc-b53c-1b3194388607",
                method: "POST",
                data: body
            })
        }catch (e) {

        }
        console.log("body", body);
    } catch (err) {
        error = err;
    }
    res.status(200).json({msg: "Webhook received successfully", error, body: req.body});
})

module.exports = router;