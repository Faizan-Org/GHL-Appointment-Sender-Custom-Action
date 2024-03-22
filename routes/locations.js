const express = require('express');
const router = express.Router();
const {makeApiCall} = require("../global/globalFns");

router.get("/locations/all", async (req, res) => {
    let locations = [];
    let error;
    try {
        ({locations} = await makeApiCall("/locations/search", 'GET', null, {
            limit: '1000',
            companyId: process.env.COMPANY_ID
        }));
    } catch (err) {
        error = err;
        console.log(error);
    }
    res.status(200).json(locations);
})

module.exports = router;