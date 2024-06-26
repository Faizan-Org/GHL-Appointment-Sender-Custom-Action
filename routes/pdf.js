const express = require('express');
const {createContactPDF} = require("../global/contactPDF");
const {upsertCustomField, uploadFileToCustomField} = require("../global/globalFns");
const router = express.Router();
const {deleteDuplicate} = require("./deleteDuplicate");
router.post("/contact/pdf", async (req, res) => {
    try {

        const body = req.body;
        const {id: contactId, locationId = '', type} = body;
        if (type !== 'ContactCreate' || locationId === "") {
            console.log("for pdf: body", body);
            return res.status(400).send("fun: Contact PDF, Invalid parameters, or data type.");
        }


        try {
            deleteDuplicate(body).then(() => {
            });
        } catch (err) {
            console.error(err);
        }


        let error = null;
        const file = await createContactPDF({contactId, locationId});
        const cf_pdf_file = await upsertCustomField(locationId, "pdf file", "FILE_UPLOAD");
        const uploadedFile = await uploadFileToCustomField(contactId, locationId, file, cf_pdf_file.id);
        return res.status(200).json({uploadedFile, error});
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