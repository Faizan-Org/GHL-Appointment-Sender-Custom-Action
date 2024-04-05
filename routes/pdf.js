const express = require('express');
const {createContactPDF} = require("../global/contactPDF");
const {upsertCustomField, uploadFileToCustomField, makeApiCall} = require("../global/globalFns");
const router = express.Router();
router.post("/contact/pdf", async (req, res) => {
    try {

        const body = req.body;

        const {contactId, locationId} = body;
        if (typeof contactId !== "string" || typeof locationId !== "string") {
            return res.status(400).send("fun: Contact PDF, Invalid parameters, or data type.");
        }
        let error = null;

        const file = await createContactPDF({contactId, locationId});
        console.log({file});
        const {id: pdfUrlCFId} = await upsertCustomField(locationId, "pdf url", "TEXT");
        const {id: pdfFileCFId} = await upsertCustomField(locationId, "pdf file", "FILE_UPLOAD");
        const {meta, uploadedFiles} = await uploadFileToCustomField({...body, file, pdfFileCFId});

        let fieldValue = meta?.url || Object.values(uploadedFiles || {})[0] || '';
        let bodyPost = {
            "customFields": [
                {
                    "id": pdfUrlCFId,
                    "field_value": fieldValue
                }
            ]
        }

        try {
            await makeApiCall("contacts/" + contactId, "PUT", bodyPost, null, 'location', locationId);
        } catch (err) {
            console.log("Failed to update pdf url cf, Reason:", err);
            error = err;
        }

        res.status(200).json({meta, uploadedFiles, error});
    } catch (e) {
        try {
            console.log(e);
            const {statusCode = 400, message: errorData = e} = e;
            res.status(statusCode).json({error: errorData});
        } catch (err) {
            res.status(500).send("Internal Server Error");
        }
    }
})

module.exports = router;