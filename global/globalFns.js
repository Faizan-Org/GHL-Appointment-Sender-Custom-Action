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

function getLocationAccessToken(locationId) {
    return new Promise(async (resolve, reject) => {

        if (!locationId) {
            reject("Fun: getLocationAccessToken, Reject Reason: Location id is missing")
        }

        let cacheKey = process.env.CACHE_KEY + locationId;
        let cacheData;

        try {
            cacheData = await client.get(cacheKey);
            if (cacheData) {
                return resolve(cacheData);
            }
        } catch (e) {
            console.log("fun: getLocationAccessToken - cache get -, Reason:", e);
        }
        const encodedParams = new URLSearchParams();
        encodedParams.set('companyId', process.env.COMPANY_ID);
        encodedParams.set('locationId', locationId);

        const options = {
            method: 'POST',
            url: mainauthurl + 'oauth/locationToken',
            headers: {
                Version: process.env.API_VERSION,
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
                Authorization: 'Bearer ' + await getToken()
            },
            data: encodedParams
        };

        try {
            let {data} = await axios.request(options);
            const {access_token, expires_in} = data || {};
            try {
                await client.set(cacheKey, access_token, "EX", expires_in - 60);
            } catch (e) {
                console.log("fun: getLocationAccessToken - cache set -, Reason:", e);
            }
            resolve(access_token);
        } catch (err) {
            try {
                reject(err.response.data);
            } catch (e) {
                reject(err);
            }
        }
    })
}

const getToken = (type = "access_token", tokenType, locationId) => {
    return new Promise(async (resolve, reject) => {
        let token = "";

        try {

            if (tokenType === 'location') {
                token = await getLocationAccessToken(locationId);
            } else {
                let cacheData = await client.get(process.env.CACHE_KEY);
                if (cacheData) {
                    cacheData = JSON.parse(cacheData);
                    if (type === "access_token") {
                        token = cacheData.access_token;
                    } else {
                        token = cacheData.refresh_token;
                    }
                }
            }

            resolve(token);
        } catch (err) {
            console.log("Get Token", err);
            reject(err);
        }
    })
}

function checkTokenExp(data) {
    try {
        if (data && data?.statusCode) {
            let text = data.message;
            if (data.statusCode === 401 && data.message) {
                return ((text.includes('access') && (text.includes('expired') || text.includes('invalid'))) || text.toLowerCase().includes("invalid jwt"));
            }
        }
    } catch (e) {
        console.log("checkTokenExp -->", e)
    }
    return false;
}

function makeApiCall(uri, method = "GET", body = null, params = null, tokenType = null, locationId) {
    return new Promise(async (resolve, reject) => {
        try {
            locationId = locationId || params?.locationId;
            if (tokenType === 'location' && typeof locationId !== "string") {
                return reject("fun -> makeApiCall, reason -> locationId is missing or invalid data type");
            }
            let token = await getToken(undefined, tokenType, locationId);
            let url = new URL(uri, mainauthurl);
            if (!token || token.error) {
                return reject({error: "Token not found. Please reconnect your app with account.", msg: token?.error})
            }

            const options = {
                method: method,
                url: url.toString(),
                headers: {
                    Authorization: 'Bearer ' + token,
                    Version: process.env.API_VERSION,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                params
            };

            if (body) {
                body = typeof body !== "string" ? JSON.stringify(body) : body;
                options.data = body;
            }

            const {data} = await axios.request(options);
            resolve(data);
        } catch (error) {
            console.log("makeApiCall", error);
            if (checkTokenExp(error) || checkTokenExp(error.response?.data)) {
                console.log("Token expired... getting valid token");
                const refresh = await getToken("refresh_token");
                if (refresh !== "") {
                    try {
                        await oauthToken(refresh, "refresh_token");
                        makeApiCall(...arguments).then(x => {
                            resolve(x);
                        })
                    } catch (err) {
                        console.log("makeApiCall oauthToken", err);
                        reject('invalid, from make api call');
                    }
                } else {
                    reject("Invalid");
                }
            } else {
                try {
                    reject({
                        ...error.response.data,
                        locationId,
                        tokenType,
                        uri
                    });
                } catch (e) {
                    reject(error);
                }
            }

        }
    })
}

function searchCustomField(locationId, query = "pdf file") {
    return new Promise(async (resolve, reject) => {
        const params = {
            parentId: '',
            skip: 0,
            limit: 10,
            documentType: "field",
            model: "contact",
            query,
        }

        try {
            const {customFields} = await makeApiCall("locations/" + locationId + "/customFields/search", "GET", null, params, "location", locationId);
            resolve(customFields ? customFields[0] : null);
        } catch (error) {
            reject(error);
        }
    })
}

function upsertCustomField(locationId, query = "pdf file", dataType = "FILE_UPLOAD") {
    return new Promise(async (resolve, reject) => {
        try {
            let error = null;
            let body = {
                "name": query.toUpperCase(),
                "dataType": dataType,
                "acceptedFormat": [".pdf", ".docx"],
                "model": "contact",
                "isMultipleFile": false,
                "maxNumberOfFiles": 1
            }

            let customField;
            try {
                customField = await searchCustomField(locationId, query);
            } catch (e) {
                error = e;
            }

            if (!customField) {
                try {
                    customField = await makeApiCall("locations/" + locationId + "/customFields", "POST", body, null, 'location', locationId);
                } catch (e) {
                    error = e;
                }
            }

            if (error) {
                reject(error);
            } else {
                resolve(customField)
            }
        } catch (e) {
            reject(e);
        }
    })
}

function uploadFileToCustomField(contactId, locationId, file, customFieldId) {
    return new Promise(async (resolve, reject) => {
        try {
            await makeApiCall("contact/" + contactId, "PUT", {
                "customFields": [{
                    "id": customFieldId,
                    "field_value": null
                }]
            }, null, 'location', locationId);
        } catch (e) {

        }
        try {
            const form = new FormData();
            form.set(customFieldId, file);
            const options = {
                method: 'POST',
                url: mainauthurl + 'forms/upload-custom-files',
                params: {contactId, locationId},
                headers: {
                    Authorization: 'Bearer ' + await getToken(undefined, "location", locationId),
                    Version: process.env.API_VERSION,
                    'Content-Type': 'multipart/form-data; boundary=---011000010111000001101001',
                    Accept: 'application/json'
                },
                data: form
            };

            const {data} = await axios.request(options);
            /*let url = '';
            try {
                const {contact: {customFields}} = data || {};
                const field = customFields.find(cf => cf.id === customFieldId);
                if(field){

                }
                console.log("field", customFields);
            } catch (e) {
                url = e.message || '';
            }*/
            return resolve(data);
        } catch (error) {
            try {
                reject(error.response.data);
            } catch (e) {
                reject("custom field - file upload fun" + error);
            }
        }
    })
}

function addTag(contactId, locationId, tags) {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await makeApiCall("contacts/" + contactId + "/tags", "POST", {tags}, null, "location", locationId);
            return resolve(data);
        } catch (e) {
            reject(e);
        }
    })
}

function addLogs(data, sheetName = false) {
    const LOGS_URL = "https://script.google.com/macros/s/AKfycbwvjHmw5YmK3D657zfu-9kFLiTlMLB_BdcYG8qrW4n-zn_VW-mu5umsWvyqSCvE0HScUA/exec?sheetName=" + sheetName;
    return new Promise(async (resolve) => {
        let msg = "logs added";
        try {
            await axios.request({
                method: "POST",
                url: LOGS_URL,
                data: data
            })
        } catch (e) {
            msg = e.message;
        }
        resolve(msg);
    })
}

module.exports = {
    oauthToken,
    getToken,
    makeApiCall,
    uploadFileToCustomField,
    searchCustomField,
    addLogs,
    addTag,
    upsertCustomField
};