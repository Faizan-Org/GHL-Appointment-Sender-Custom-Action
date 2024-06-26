const {makeApiCall} = require("../global/globalFns");
const {addLogs} = require("../global/globalFns");

if (process.env.NODE_ENV !== 'production') {
    require("dotenv").config();
}

async function searchContact(locationId, query) {
    const {contacts} = await makeApiCall(`contacts/`, 'GET', null, {
        locationId: locationId,
        query: query,
    }, 'location');
    return contacts;
}

function created3MonthAgo(dateAdded) {
    const currentDate = new Date();
    const createdDate = new Date(dateAdded);
    const timeDifference = currentDate.getTime() - createdDate.getTime();
    const daysAgo = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const monthsAgo = Math.floor(daysAgo / 30);
    return monthsAgo >= +process.env.DUPLICATE_CONTACT_AGE_IN_MONTHS;
}

function deleteDuplicate(contact) {
    return new Promise(async (resolve) => {
        let timeLogName = (Math.random() + 1).toString(36).substring(7);
        try {
            console.time(timeLogName);
            console.log("Start", timeLogName);
            let {email, phone, name = "", firstName = '', lastName = '', id: contactId, locationId} = contact;
            name = name || (`${firstName} ${lastName}`).trim() || "example$512673612376@gmail.com";
            const query = email || phone || name;
            const {locations} = await makeApiCall("/locations/search", 'GET', null, {
                limit: '1000',
                companyId: process.env.COMPANY_ID
            });
            let skipLocation = process.env.SKIP_LOCATIONS + "," + locationId;
            for (const location of locations) {
                // console.log("In Process", location.id)
                if (skipLocation.includes(location.id)) continue;

                let contacts = await searchContact(location.id, query);
                if (contacts.length > 0) {
                    let {dateAdded} = contacts[0];
                    let isExpire = created3MonthAgo(dateAdded);
                    if (isExpire) {
                        const {contact} = await makeApiCall("contacts/" + contactId, 'GET', null, null, "location", locationId);

                        addLogs(contact, true).then(() => {
                        });

                        console.log("delete contacts");
                        /*makeApiCall("/contact/" + contactId, "DELETE", undefined, undefined, 'location', locationId).then(() => {
                        });*/
                        break;
                    }
                }
            }
            console.timeEnd(timeLogName);
            console.log("success");
            resolve("success");
        } catch (err) {
            console.log(timeLogName, err);
            resolve(err);
        }
    })
}

/*deleteDuplicate({email: "stixxs34@gmail.com",locationId: "jk5ihRg0RjAFEMudpwPz",id:"qJvrrdTiypOWupQB0LUV"});
deleteDuplicate({email: "stixxs34@gmail.com",locationId: "jk5ihRg0RjAFEMudpwPz",id:"qJvrrdTiypOWupQB0LUV"});
deleteDuplicate({email: "stixxs34@gmail.com",locationId: "jk5ihRg0RjAFEMudpwPz",id:"qJvrrdTiypOWupQB0LUV"});
deleteDuplicate({email: "stixxs34@gmail.com",locationId: "jk5ihRg0RjAFEMudpwPz",id:"qJvrrdTiypOWupQB0LUV"});
deleteDuplicate({email: "stixxs34@gmail.com",locationId: "jk5ihRg0RjAFEMudpwPz",id:"qJvrrdTiypOWupQB0LUV"});*/

module.exports = {deleteDuplicate}