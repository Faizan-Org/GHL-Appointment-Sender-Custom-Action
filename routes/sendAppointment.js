const express = require('express');
const router = express.Router();
const {makeApiCall} = require("../global/globalFns");

const getCalendarPostData = (obj = {}) => ({
    "calendarId": obj.calendarId,
    "locationId": obj.app_locationId,
    "startTime": obj.appointmentStartTime,
    "endTime": obj.appointmentEndTime,
    "title": obj.appointmentTitle,
    "appointmentStatus": obj.appointmentStatus,
    "assignedUserId": obj.app_assign_user,
    "address": obj.appointmentAddress,
    "ignoreDateRange": obj.app_ignore_date_range,
    "toNotify": obj.app_to_notify
});

const upsertContact = (contactId, locationId, copyToLocation_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const {contact} = await makeApiCall("contacts/" + contactId, 'GET', null, null, "location", locationId);
            const {
                new: isNew,
                contact: upsertContact
            } = await makeApiCall("contacts/upsert", "POST", contact, null, "location", copyToLocation_id);

            return resolve({
                copyToLocation_id: upsertContact.locationId,
                contactId: upsertContact.id,
                contactName: upsertContact.name,
                isNew
            });

        } catch (error) {
            try {
                return reject(error.response.data);
            } catch (e) {
                return reject(error);
            }
        }
    })
}

router.post("/appointment/send", async (req, res) => {
    let error;
    try {
        let {body: {data = {}, extras = {}}} = req || {};
        let {app_locationId, contactId} = data;
        let dataBody = getCalendarPostData(data);
        let {locationId, contactId: contact_id = contactId} = extras;
        try {
            const upsert = upsertContact(contact_id, locationId, app_locationId);
            dataBody.contactId = upsert.contactId;
            const data = await makeApiCall("calendars/events/appointments", "POST", dataBody, null, "location", app_locationId);
            console.log("Appointment created successfully", data);
        } catch (err) {
            try {
                error = err.response.data;
            } catch (e) {
                error = err;
            }
        }
        console.log("send appointment", req.body);
    } catch (err) {
        error = err;
    }

    console.log("error", error);
    res.status(200).json({msg: "Appointment send successfully", error});
})

module.exports = router;