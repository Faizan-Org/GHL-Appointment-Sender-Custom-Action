const express = require('express');
const {createContactPDF} = require("../global/contactPDF");
const {upsertCustomField, uploadFileToCustomField, makeApiCall} = require("../global/globalFns");
const router = express.Router();
router.post("/contact/pdf", async (req, res) => {
    try {

        const body = req.body;

        const {id: contactId, locationId, type} = body;
        if (type !== 'ContactCreate') {
            console.log("for pdf: body", body);
            return res.status(400).send("fun: Contact PDF, Invalid parameters, or data type.");
        }

        let error = null;

        const file = await createContactPDF({contactId, locationId});

        const cf_pdf_file = await upsertCustomField(locationId, "pdf file", "FILE_UPLOAD");
        const uploadedFile = await uploadFileToCustomField(contactId, locationId, file, cf_pdf_file.id);

        /*
        const cf_pdf_url = await upsertCustomField(locationId, "pdf url", "TEXT");

        try \{
            let bodyPost = {
                "customFields": [
                    {
                        "id": cf_pdf_url.id,
                        "field_value": fileURL
                    }
                ]
            }

            await makeApiCall("contacts/" + contactId, "PUT", bodyPost, null, 'location', locationId);
        } catch (err) {
            console.log("Failed to update pdf url cf, Reason:", err);
            error = err;
        }
        */

        res.status(200).json({uploadedFile, error});
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