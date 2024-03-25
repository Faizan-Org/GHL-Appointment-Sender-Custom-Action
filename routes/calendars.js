const express = require('express');
const router = express.Router();
const {makeApiCall} = require("../global/globalFns");

router.post("/calendars", async (req, res) => {
    let calendars = [];
    console.log(req.body, req.query);
    let error;
    let {app_location: locationId} = req.body;
    if (!locationId) {
        return res.status(401).send("Location id is missing.");
    }
    try {
        ({calendars} = await makeApiCall("/calendars/", 'GET', null, {
            locationId: locationId
        }, 'location'));
        calendars = {
            inputs: [{
                "section": "Calendar",
                fields: [{
                    "field": "calendar",
                    "title": "Select user calendar",
                    "fieldType": "select",
                    "required": true,
                    "options": calendars.map(calendar => ({
                        "label": calendar.name,
                        "value": (calendar.id || calendar._id)
                    }))
                }]
            }]
        }
    } catch (err) {
        error = err;
        console.log(error);
    }
    res.status(200).json(calendars);
})

module.exports = router;