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
            users = {
                "field": "user",
                "title": "Select Assign User",
                "fieldType": "select",
                "required": true,
                "options": users.map(user => ({"label": user.name, "value": (user.id || user._id)}))
            }
        } catch (err) {
            error = err;
            locations = err;
            console.log(error);
        }
        res.status(200).json(users);
    }
)

module.exports = router;