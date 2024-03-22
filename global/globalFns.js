const axios = require('axios').default;
const {URLSearchParams} = require('url');
const client = require('./client')

if (process.env.NODE_ENV !== 'production') {
    require("dotenv").config();
}

let mainauthurl = "https://services.leadconnectorhq.com/";
const encodedParams = new URLSearchParams();
encodedParams.set('client_id', process.env.CLIENT_ID);
encodedParams.set('client_secret', process.env.CLIENT_SECRET);

const oauthToken = (code, type = "authorization_code") => {
    return new Promise(async (resolve, reject) => {
        let key_type = type === "refresh_token" ? "refresh_token" : "code";

        encodedParams.set('grant_type', type);
        encodedParams.set(key_type, code);
        const options = {
            method: 'POST',
            url: mainauthurl + 'oauth/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json'
            },
            data: encodedParams,
        };
        try {
            const {data} = await axios.request(options);
            if (data?.access_token) {
                try {
                    await client.set(process.env.CACHE_KEY, JSON.stringify(data, ["access_token", "refresh_token", "userType", "locationId"]));
                } catch (e) {
                    console.log(e);
                }
                return resolve(data.access_token);
            }
            reject('');
        } catch (err) {
            console.log("oauth promises was rejected. Reason:", (err.response?.data || err.message));
            reject(err.response?.data || err.message);
        }
    });
}
const getToken = (type = "access_token") => {
    return new Promise(async (resolve) => {
        let cacheData = await client.get(process.env.CACHE_KEY);
        let token;
        if (cacheData) {
            cacheData = JSON.parse(cacheData);
            if (type === "access_token") {
                token = cacheData.access_token;
            } else {
                token = cacheData.refresh_token;
            }
        }

        resolve(token);
    })
}

function checkTokenExp(data) {
    let text = data.message;
    if (data && data?.statusCode) {
        if (data.statusCode === 401 && data?.message) {
            return text.includes('access') && (text.includes('expired') || text.includes('invalid'));
        }
    }
    return false;
}

const makeApiCall = (uri, method = "GET", body = null, params=null) => {
    return new Promise(async (resolve, reject) => {
        let url = new URL(uri, mainauthurl);
        const token = await getToken();
        if (!token) {
            return reject({error: "Token not found. Please reconnect your app with account."})
        }
        const options = {
            method: method,
            url: url.toString(),
            headers: {
                Authorization: 'Bearer ' + token,
                Version: process.env.API_VERSION,
                Accept: 'application/json'
            },
            params
        };
        if (body) {
            body = typeof body !== "string" ? JSON.stringify(body) : body;
            options.data = body;
        }

        try {
            const {data} = await axios.request(options);
            resolve(data);
        } catch (error) {
            console.log("makeApiCall", error);

            if (checkTokenExp(error)) {
                const refresh = await getToken("refresh_token");
                if (refresh !== "") {
                    try {
                        await oauthToken(refresh, "refresh_token");
                        makeApiCall(uri, method = "GET", body = null).then(x => {
                            resolve(x);
                        })
                    } catch (err) {
                        console.log("makeApiCall oauthToken", err.response.data);
                        reject('invalid, from make api call');
                    }
                } else {
                    reject("Invalid");
                }
            } else {
                try {
                    reject(error.response.data);
                }catch (e) {
                    reject(error);
                }
            }

        }
    })
}

module.exports = {oauthToken, getToken, makeApiCall};