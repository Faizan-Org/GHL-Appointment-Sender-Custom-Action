const express = require('express');
const axios = require("axios");
const router = express.Router();

const LOGS_URL = "https://script.google.com/macros/s/AKfycbwvjHmw5YmK3D657zfu-9kFLiTlMLB_BdcYG8qrW4n-zn_VW-mu5umsWvyqSCvE0HScUA/exec";
router.get("/appointments/logs", async (req, res) => {
    let {data} = await axios.get(LOGS_URL);
    res.send("<style>*{padding: 0; margin: 0;}</style>" + data)
})

module.exports = router;