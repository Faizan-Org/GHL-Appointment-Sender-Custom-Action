const express = require('express');
const {makeApiCall} = require("../global/globalFns");
const router = express.Router();

router.post(":locationId/contacts/:email", async (req, res) => {
    try {
        const {locationId, email} = req.params;
        const {contacts} = await makeApiCall(`contacts/`, 'GET', null, {
            locationId: locationId,
            query: email
        }, 'location');
        res.status(200).json({status: 'success', statusCode: 200, isExist: !!contacts.length});
    } catch (e) {
        if (e.statusCode)
            res.status(e.statusCode).json(e);
        else
            res.status(400).json({error: e});
    }
});

module.exports = router;