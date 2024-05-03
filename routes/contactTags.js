const express = require('express');
const {addTag} = require("../global/globalFns");
const router = express.Router();

router.post("contact/:id/tags", async (req, res) => {
    const {body: tags} = req;
    const {id} = req.params;
    try {
        const response = await addTag(id, "Xi9xlFZVPhtek5GOUwrS", tags);
        res.status(200).json(response);
    } catch (e) {
        if (e.statusCode)
            res.status(e.statusCode).json(e);
        else
            res.status(400).json({error: e});
    }
})

module.exports = router;