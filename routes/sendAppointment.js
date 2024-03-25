const express = require('express');
const router = express.Router();
const {makeApiCall} = require("../global/globalFns");

router.post("/appointment/send", async (req, res) => {
    let error;
    try {
        console.log("body", req.body);
    } catch (err) {
        error = err;
    }
    res.status(200).json({msg: "Webhook received successfully", error, body: req.body});
})

module.exports = router;