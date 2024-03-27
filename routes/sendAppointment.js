const express = require('express');
const router = express.Router();
const {makeApiCall, addLogs, addTag} = require("../global/globalFns");
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

const allowedContactKeys = [
    "firstName",
    "lastName",
    "name",
    "email",
    "locationId",
    "gender",
    "phone",
    "address1",
    "city",
    "state",
    "postalCode",
    "website",
    "timezone",
    "dnd",
    "dndSettings",
    "inboundDndSettings",
    "tags",
    "customFields",
    "source",
    "country",
    "companyName"
]

const upsertContact = (contactId, locationId, upsertLocationId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const {contact} = await makeApiCall("contacts/" + contactId, 'GET', null, null, "location", locationId);
            console.log("upsertLocationId ", upsertLocationId);

            let dataBody = {};

            allowedContactKeys.forEach(key => {
                dataBody[key] = contact[key];
            });

            dataBody = {...dataBody, locationId: upsertLocationId};

            const {
                new: isNew,
                contact: upsertContactDetails
            } = await makeApiCall("contacts/upsert", "POST", dataBody, null, "location", upsertLocationId);

            return resolve({
                upsertLocationId: upsertContactDetails.locationId,
                contactId: upsertContactDetails.id,
                contactName: upsertContactDetails.name,
                isNew
            });
        } catch (error) {
            reject(error);
        }
    })
}

router.post("/appointment/send", async (req, res) => {
    let error;
    let appointment;
    try {
        let {body: {data = {}, extras = {}}} = req || {};
        let {app_locationId: upsertLocationId, contactId, appointment_rejection_tag} = data;
        let dataBody = getCalendarPostData(data);
        let {locationId, contactId: contact_id = contactId} = extras;
        try {
            const upsert = await upsertContact(contact_id, locationId, upsertLocationId);
            dataBody.contactId = upsert.contactId;
            appointment = await makeApiCall("calendars/events/appointments", "POST", dataBody, null, "location", upsertLocationId);
        } catch (err) {
            error = err;
            try {
                if (typeof appointment_rejection_tag === "string") {
                    appointment_rejection_tag = [appointment_rejection_tag];
                }
                await addTag(contact_id, locationId, appointment_rejection_tag);
            } catch (e) {
                addLogs({tagError: e, body: req.body}).then(() => {
                });
            }
        }
    } catch (err) {
        error = err;
    }
    try {
        addLogs({appointment, error, body: req.body}).then(() => {
        });
    } catch (e) {

    }
    res.status(200).json({msg: "Appointment send successfully", error});
})

module.exports = router;