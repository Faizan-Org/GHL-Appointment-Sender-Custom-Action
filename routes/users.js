const express = require('express');
const router = express.Router();
const {makeApiCall} = require("../global/globalFns");

router.get("/users/search", async (req, res) => {
    let users = [];
    let error;
    try {
        ({users} = await makeApiCall("/users/search", 'GET', null, {
            companyId: process.env.COMPANY_ID,
            limit: 1000,
        }));
        users = users.map(user => JSON.parse(JSON.stringify(user, ["id", "name"])));
    } catch (err) {
        error = err;
        console.log(error);
    }
    res.status(200).json({total: users.length, users, error});
})

module.exports = router;