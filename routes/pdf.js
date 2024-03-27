const express = require('express');
const {createContactPDF} = require("../global/contactPDF");
const {searchCustomField, uploadFileToCustomField} = require("../global/globalFns");
const router = express.Router();
router.post("/contact/pdf", async (req, res) => {
    const body = req.body;

    if (typeof body.contactId !== "string" || typeof body.locationId !== "string") {
        return reject("fun: Contact PDF, Invalid parameters, or data type.");
    }

    try {
        const file = await createContactPDF(body);
        const {id: customFieldId} = await searchCustomField(body.locationId);
        const data = await uploadFileToCustomField({...body, file, customFieldId});
        console.log(data);
        res.status(200).json(data);
    } catch (e) {
        console.log(e);
        const { status = 400, data: errorData = e } = e;
        res.status(status).json({ error: errorData });
    }
})

module.exports = router;