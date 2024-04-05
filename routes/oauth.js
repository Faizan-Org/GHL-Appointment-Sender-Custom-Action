const express = require('express');
const router = express.Router();
const {oauthToken} = require("../global/globalFns");

if (process.env.NODE_ENV !== 'production') {
    require("dotenv").config();
}

const get_connectivity_url = (redirectURL) => (new URL(`https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=${redirectURL}&client_id=${process.env.CLIENT_ID}&scope=${process.env.APP_SCOPES}`).toString());

router.get("/oauth/connect", async (req, res) => {
    const code = req.query?.code || null;
    const REDIRECT_URI = encodeURIComponent('https://' + req.get('host') + req.originalUrl);
    if (code) {
        try {
            await oauthToken(code);
            return res.status(200).send('Connected Successfully.');
        } catch (err) {
            console.log(err);
            return res.status(400).json({msg: "Invalid Request. ", error: err});
        }
    } else {
        return res.redirect(get_connectivity_url(REDIRECT_URI));
    }
})

module.exports = router;