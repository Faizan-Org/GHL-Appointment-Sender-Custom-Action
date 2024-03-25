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
    const encodedParams = new URLSearchParams();
    encodedParams.set('companyId', process.env.COMPANY_ID);
    encodedParams.set('locationId', 'S5YcXrbX6zbGQlNnsQ8b');

    return new Promise(async (resolve, reject) => {
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

        console.log(encodedParams)
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

const getToken = (type = "access_token") => {
    return new Promise(async (resolve) => {
        let cacheData = await client.get(process.env.CACHE_KEY);
        let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJDb21wYW55IiwiYXV0aENsYXNzSWQiOiI2NFlseDVQa2FRNUFoTldkdUtpeSIsInNvdXJjZSI6IklOVEVHUkFUSU9OIiwic291cmNlSWQiOiI2NWZjMDFhNDMzMDAwZmU1NWEzZTU4M2EtbHUxMmJqM20iLCJjaGFubmVsIjoiT0FVVEgiLCJwcmltYXJ5QXV0aENsYXNzSWQiOiI2NFlseDVQa2FRNUFoTldkdUtpeSIsIm9hdXRoTWV0YSI6eyJzY29wZXMiOlsiY2FsZW5kYXJzLndyaXRlIiwiY2FsZW5kYXJzL2V2ZW50cy53cml0ZSIsImNhbGVuZGFycy9ncm91cHMud3JpdGUiLCJjYWxlbmRhcnMvcmVzb3VyY2VzLndyaXRlIiwibG9jYXRpb25zLndyaXRlIiwiY29udGFjdHMud3JpdGUiLCJ1c2Vycy5yZWFkb25seSIsInNhYXMvbG9jYXRpb24ud3JpdGUiLCJzdXJ2ZXlzLnJlYWRvbmx5Iiwid29ya2Zsb3dzLnJlYWRvbmx5IiwidXNlcnMud3JpdGUiLCJzYWFzL2xvY2F0aW9uLnJlYWQiLCJzYWFzL2NvbXBhbnkud3JpdGUiLCJzYWFzL2NvbXBhbnkucmVhZCIsInByb2R1Y3RzL3ByaWNlcy53cml0ZSIsInByb2R1Y3RzL3ByaWNlcy5yZWFkb25seSIsInByb2R1Y3RzLndyaXRlIiwicHJvZHVjdHMucmVhZG9ubHkiLCJwYXltZW50cy90cmFuc2FjdGlvbnMucmVhZG9ubHkiLCJwYXltZW50cy9zdWJzY3JpcHRpb25zLnJlYWRvbmx5IiwicGF5bWVudHMvb3JkZXJzLnJlYWRvbmx5Iiwib3Bwb3J0dW5pdGllcy5yZWFkb25seSIsIm9wcG9ydHVuaXRpZXMud3JpdGUiLCJmdW5uZWxzL3JlZGlyZWN0LndyaXRlIiwiZnVubmVscy9yZWRpcmVjdC5yZWFkb25seSIsIm1lZGlhcy53cml0ZSIsIm1lZGlhcy5yZWFkb25seSIsImxvY2F0aW9ucy90ZW1wbGF0ZXMucmVhZG9ubHkiLCJsb2NhdGlvbnMvdGFncy53cml0ZSIsImxvY2F0aW9ucy90YWdzLnJlYWRvbmx5IiwibG9jYXRpb25zL3Rhc2tzLndyaXRlIiwiYnVzaW5lc3Nlcy5yZWFkb25seSIsImJ1c2luZXNzZXMud3JpdGUiLCJjb21wYW5pZXMucmVhZG9ubHkiLCJjYWxlbmRhcnMucmVhZG9ubHkiLCJjYWxlbmRhcnMvZ3JvdXBzLnJlYWRvbmx5IiwiY2FsZW5kYXJzL2V2ZW50cy5yZWFkb25seSIsImNhbGVuZGFycy9yZXNvdXJjZXMucmVhZG9ubHkiLCJjYW1wYWlnbnMucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy53cml0ZSIsImNvbnZlcnNhdGlvbnMvbWVzc2FnZS5yZWFkb25seSIsImNvbnZlcnNhdGlvbnMvbWVzc2FnZS53cml0ZSIsImNvbnRhY3RzLnJlYWRvbmx5IiwiZm9ybXMucmVhZG9ubHkiLCJmb3Jtcy53cml0ZSIsImludm9pY2VzLnJlYWRvbmx5IiwiaW52b2ljZXMud3JpdGUiLCJpbnZvaWNlcy9zY2hlZHVsZS5yZWFkb25seSIsImludm9pY2VzL3NjaGVkdWxlLndyaXRlIiwiaW52b2ljZXMvdGVtcGxhdGUucmVhZG9ubHkiLCJpbnZvaWNlcy90ZW1wbGF0ZS53cml0ZSIsImxpbmtzLnJlYWRvbmx5IiwibGlua3Mud3JpdGUiLCJsb2NhdGlvbnMucmVhZG9ubHkiLCJsb2NhdGlvbnMvY3VzdG9tVmFsdWVzLnJlYWRvbmx5IiwibG9jYXRpb25zL2N1c3RvbVZhbHVlcy53cml0ZSIsImxvY2F0aW9ucy9jdXN0b21GaWVsZHMucmVhZG9ubHkiLCJsb2NhdGlvbnMvY3VzdG9tRmllbGRzLndyaXRlIiwibG9jYXRpb25zL3Rhc2tzLnJlYWRvbmx5Iiwib2F1dGgud3JpdGUiLCJvYXV0aC5yZWFkb25seSJdLCJjbGllbnQiOiI2NWZjMDFhNDMzMDAwZmU1NWEzZTU4M2EiLCJjbGllbnRLZXkiOiI2NWZjMDFhNDMzMDAwZmU1NWEzZTU4M2EtbHUxMmJqM20iLCJhZ2VuY3lQbGFuIjoiYWdlbmN5X21vbnRobHlfNDk3In0sImlhdCI6MTcxMTM2MDIxNi40NTksImV4cCI6MTcxMTQ0NjYxNi40NTl9.WOVh2fL2s1mitfS9eMpV1b2nFNvDSioFUJfJn25wUss";
        if (cacheData) {
            cacheData = JSON.parse(cacheData);
            if (type === "access_token") {
                // token = cacheData.access_token;
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

function makeApiCall(uri, method = "GET", body = null, params = null, tokenType, locationId) {
    return new Promise(async (resolve, reject) => {
        try {
            locationId = locationId || params.locationId;
            const token = tokenType === 'location' ? await getLocationAccessToken(locationId) : await getToken();
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
                    Accept: 'application/json'
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

            if (checkTokenExp(error)) {
                const refresh = await getToken("refresh_token");
                if (refresh !== "") {
                    try {
                        await oauthToken(refresh, "refresh_token");
                        makeApiCall(...arguments).then(x => {
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
                } catch (e) {
                    reject(error);
                }
            }

        }
    })
}

module.exports = {oauthToken, getToken, makeApiCall};