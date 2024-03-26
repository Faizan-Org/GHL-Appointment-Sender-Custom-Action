const express = require('express');
const router = express.Router();

router.post("/contact/pdf", async (req, res) => {
    console.log("Contact PDF", req.body)
    res.status(200).send("Successfully created...");
})

module.exports = router;