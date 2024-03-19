const express = require('express');
const router = express.Router();

router.get("/appointment/send", (req, res) => {
    res.status(200).send("Webhook received successfully");
})

module.exports = router;