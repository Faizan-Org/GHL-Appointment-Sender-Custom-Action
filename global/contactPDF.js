const {jsPDF} = require('jspdf');
const {makeApiCall} = require("./globalFns");


const cKeys = {
    'firstName': "First Name",
    "lastName": "Last Name",
    "email": 'Email',
    "phone": "Phone",
    "address1": "Address",
    "country": "Country",
    "state": "State",
    "city": "City",
    "postalCode": "Postal code",
}


const MimicSurvey = [
    "Do you or anyone in your household applying for coverage have Medicare, Medicaid or VA coverage?",
    "First Name",
    "Last Name",
    "Phone",
    "Email",
    "Address",
    "Country",
    "City",
    "State",
    "Postal code",
    "Gender",
    "Date of birth",
    "Main applicant's Social Security (We need this to verify your marketplace application)",
    "Social Security Number",
    "Main Applicant Date of Birth:",
    "Please select your Marital Status",
    "Please enter your Spouse's First Name",
    "Please enter your Spouse's Last Name",
    "Spouse Gender",
    "Spouse Date Of Birth",
    "Do you want to enroll spouse as well?",
    "Spouse SSN:",
    "Do you have tax dependents (typically children)?",
    "Number of Tax Dependents (Typically children)",
    "Do you wish to enroll your dependents as well?",
    "Please list all your tax dependents Full Names and Date of Births - make sure the information provided is accurate",
    "I certify that I will be making the minimum income required for the subsidized healthcare based on the chart below:",
    "Projected annual income for this year",
    "Income Source: Employed / Self Employed / Other",
    "Income Chart",
    "Plan Name",
    "Plan Carrier Name",
    "Plan type",
    "Selected Plan Image",
    "Plan Confirmation Signature",
    '1. Personal and Income Information Accuracy: I hereby confirm that all personal and income-related information I have provided is accurate and true to the best of my knowledge. This information will be used to determine my eligibility for health insurance and any potential subsidies.  2. Agent of Record Consent:',
    'By signing below, you attest that the previously provided information constitutes the information used to create your Marketplace application',
    "Signature",
    "I have reviewed my application information above, and here is my signature"
]


function sortBySurveyOrder(arr) {
    try {
        arr.sort((a, b) => compareWithOrder(a, b, MimicSurvey));
        arr.sort((a, b) => compareWithOrder(a, b, MustInLast));
    } catch (e) {

    }
}

const MustInLast = [
    "By signing below, you attest that the previously provided information constitutes the information used to create your Marketplace application",
    "Signature",
    "I have reviewed my application information above, and here is my signature"
];


function compareWithOrder(a, b, order) {
    let aKey = a.key;
    let bKey = b.key;
    if (bKey?.includes("Agent:")) {
        bKey = bKey.replace(/Email|email/gm, '');
    }
    if (aKey?.includes("Agent:")) {
        aKey = aKey.replace(/Email|email/gm, '');
    }
    const indexA = order.findIndex((question) => aKey?.includes(question) || aKey === question);
    const indexB = order.findIndex((question) => bKey?.includes(question) || bKey === question);

    if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
    }

    if (indexA !== -1) {
        return -1;
    }
    if (indexB !== -1) {
        return 1;
    }

    return 0;
}

function compare(a, b) {
    if (a.value.meta && a.value.meta.isSignature) {
        return 1;
    } else if (b.value.meta && b.value.meta.isSignature) {
        return -1;
    } else {
        return 0;
    }
}

function getContactData(contactId, locationId) {
    return new Promise(async (resolve, reject) => {
        try {
            const {contact} = await makeApiCall("contacts/" + contactId, 'GET', null, null, "location", locationId);
            contact.customFields.forEach(cf => {
                try {
                    const val = cf.value;
                    if (val instanceof Array) {
                        cf.value = val.join(", ");
                    } else if (typeof val === "string") {
                        cf.value = val.replaceAll('\n', ', ');
                    }
                } catch (e) {
                    console.error('Error processing customFields:', e);
                }
            })
            contact.customFields.sort(compare);
            resolve(contact);
        } catch (e) {
            reject(e);
        }
    })
}

function getCustomFields(locationId) {
    return new Promise(async (resolve, reject) => {
        try {
            const {customFields} = await makeApiCall("locations/" + locationId + "/customFields", 'get', null, null, "location", locationId);
            const ar = [];
            customFields.forEach(cf => {
                ar[cf.id] = cf.name;
            })
            resolve(ar);
        } catch (e) {
            reject(e);
        }
    })
}

function generatePDF(data, surveyName = 'test') {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new jsPDF();
            doc.text("APPLY NOW FOR SUBSIDIZED HEALTHCARE AND BENEFITS", 15, 15);
            doc.setFontSize(12);
            let yPosition = 30;
            let pageCount = 1;

            function addPage() {
                doc.addPage();
                yPosition = 30;
                pageCount++;
            }

            data.forEach((data, index) => {
                try {

                    let meta = null;
                    let isSignature = false;
                    let {value} = data;
                    if (typeof value === "object") {
                        meta = value.meta;
                        ({isSignature} = meta ?? {});
                        data.value = value.url ?? '';
                    } else {
                        data.value = value.toString();
                    }

                    if (data.value?.trim && !data.value?.trim() || !data.key) return;
                    /*Split the text into multiple lines if it exceeds the page width*/
                    const textLinesQuestion = doc.splitTextToSize(`${index + 1}: ${data.key}`, doc.internal.pageSize.width - 20);
                    const textLinesResponse = doc.splitTextToSize(`     ${data.value}`, doc.internal.pageSize.width - 20);
                    const lineHeight = 6;

                    const textHeight = Math.max(textLinesQuestion.length, textLinesResponse.length) * lineHeight;
                    if (yPosition + textHeight >= doc.internal.pageSize.height - 20) {
                        addPage();
                    }

                    /*Add the question and response to the document*/
                    doc.text(10, yPosition, textLinesQuestion);
                    yPosition += textHeight;
                    if ((isSignature && meta) || meta?.mimetype?.includes("image")) {
                        let height = data.isPlan ? 200 : 40;
                        if (yPosition + height + 20 >= doc.internal.pageSize.height - 20) {
                            addPage();
                        }
                        try {
                            if (data.isPlan && data.value) {
                                doc.addImage(data.value, 'JPEG', 10, yPosition, 100, height);
                            } else {
                                doc.addImage(data.value, 'JPEG', 10, yPosition, 100, height);
                            }

                            yPosition += height;
                        } catch (e) {
                            doc.text(10, yPosition, textLinesResponse);
                            yPosition += 10;
                        }

                        if (meta?.timestamp) {
                            let timestamp = parseInt(meta?.timestamp + "000");
                            timestamp = isNaN(timestamp) ? meta?.timestamp : formatDate(timestamp, true);
                            doc.text(10, yPosition, "Time Signed: " + timestamp);
                        }

                    } else if (data.key === "Income Chart") {
                        if (yPosition + 80 >= doc.internal.pageSize.height - 20) {
                            addPage();
                            yPosition = 15;
                        }

                        doc.addImage(chartURL, 'PNG', 10, yPosition, 100, 80);
                        yPosition += 90;
                    } else {
                        doc.text(10, yPosition, textLinesResponse);
                    }
                    yPosition += 12;
                    // doc.text(10, yPosition, textLinesResponse);

                } catch (e) {

                }
            });

            const pdfBlob = doc.output('blob');
            const file = new File([pdfBlob], `${surveyName}.pdf`, {type: 'application/pdf'});
            resolve(file);
        } catch (e) {
            reject(e + "Initiator: generatePDF");
        }
    })
}

/*
{
    "locationId": "vziY4BfTo6yssDoovkSU",
    "contactId": "w8eMg5lAh78zjQWwFHL2"
}
*/

function createContactPDF({contactId, locationId}) {
    return new Promise(async (resolve, reject) => {
        try {

            if (typeof contactId !== "string" || typeof locationId !== "string") {
                return reject("fun: Contact PDF, Invalid parameters, or data type.");
            }

            let pdfData = [];
            const contactData = await getContactData(contactId, locationId);
            const cfs = await getCustomFields(locationId);
            Object.keys(cKeys).forEach(x => {
                const obj = {}
                if (!!contactData[x]) {
                    obj.key = cKeys[x]?.trim();
                    obj.value = x.includes('date') ? formatDate(contactData[x]) : contactData[x];
                    pdfData.push(obj);
                }
            });


            for (let cf of contactData.customFields) {
                let isPlan = false;
                if (!Array.isArray(cf.value) && typeof cf.value === "object" && !cf.value.url) {
                    let ky = Object.keys(cf.value)[0];
                    if (cf.value[ky]) {
                        isPlan = true;
                        cf.value = cf.value[ky];
                    }
                }
                pdfData.push({key: (cfs[cf.id]?.trim() ?? null), value: cf.value, isPlan});
            }

            const mustInLast = pdfData.flatMap(entry => MustInLast.some(phrase => entry.key.includes(phrase)) ? entry.key : []);

            sortBySurveyOrder(pdfData);

            const c = pdfData.findIndex(x => mustInLast.some(y => x.key.includes(y)));
            if (c !== -1 && c < mustInLast.length) {
                let f = pdfData.splice(0, mustInLast.length);
                pdfData = pdfData.concat(f);
            }

            const file = await generatePDF(pdfData, contactData.firstName);
            resolve(file);
        } catch (e) {
            reject("fun-> createContactPDF, Reason: " + (e.message || e))
        }
    })
}


module.exports = {createContactPDF, getContactData, getCustomFields};