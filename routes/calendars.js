const express = require('express');
const router = express.Router();
const {makeApiCall} = require("../global/globalFns");

const getField = (field, title, fieldType = "string", required = true) => ({
    field,
    title,
    fieldType,
    required
})

router.post("/calendars", async (req, res) => {
    let fields = {
        inputs: [{
            "section": "Appointment Details",
            fields: []
        }]
    };
    // console.log("body = ", req.body, "; query = ", req.query);
    let error;
    let {app_location: locationId} = req.body;
    if (!locationId) {
        return res.status(401).send("Location id is missing.");
    }
    try {
        let {calendars = []} = await makeApiCall("/calendars/", 'GET', null, {
            locationId: locationId
        }, 'location');

        if (calendars.length < 1) {
            calendars = [{
                name: "No calendar found",
                id: null
            }]
        }
        let calendarField = {
            "field": "calendarId",
            "title": "Select user calendar",
            "fieldType": "select",
            "required": true,
            "options": calendars.map(calendar => ({
                "label": calendar.name,
                "value": (calendar.id || calendar._id)
            }))
        };
        fields.inputs[0].fields.push(calendarField);
    } catch (err) {
        error = err;
        console.log(error);
    }

    let inputFields = [
        {name: "Appointment Title", key: "appointmentTitle"},
        {name: "Contact Id", key: "contactId"},
        {name: "Appointment Start Time", key: "appointmentStartTime"},
        {name: "Appointment End Time", key: "appointmentEndTime"},
        {name: "Appointment Status", key: "appointmentStatus"},
        {name: "Appointment Address", key: "appointmentAddress"},
    ]

    let inpFieldsJson = inputFields.map(({name, key}) => getField(key, name));
    fields.inputs[0].fields = fields.inputs[0].fields.concat(inpFieldsJson);
    res.status(200).json(fields);
})

module.exports = router;