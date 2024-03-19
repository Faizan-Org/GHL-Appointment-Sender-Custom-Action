const express = require('express');
const router = express.Router();

router.get("/oauth/connect", (req, res) => {
    res.status(200).send("Connected with code: " + (req.query?.code || null));
})

module.exports = router;