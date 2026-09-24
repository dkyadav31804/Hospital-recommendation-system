const fs = require("fs");
const path = require("path");

// ============================================================
// FILE PATHS
// ============================================================

const BASE_FILE = path.join(__dirname, "../data/clean_hospitals.json");

const TREATMENT_FILE = path.join(
    __dirname,
    "../data/disease_treatments.json"
);

const OUTPUT_FILE = path.join(
    __dirname,
    "../data/clean_hospitals_enriched.json"
);

const UNMATCHED_FILE = path.join(
    __dirname,
    "../data/unmatched_treatments.json"
);


// ============================================================
// HELPERS
// ============================================================

function normalizeText(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


function normalizeHospitalName(name) {
    let value = normalizeText(name);

    // Common hospital-name variations
    value = value
        .replace(/\bthe\b/g, "")
        .replace(/\bhospital\b/g, "")
        .replace(/\bhospitals\b/g, "")
        .replace(/\bmedical centre\b/g, "medical center")
        .replace(/\bcentre\b/g, "center")
        .replace(/\bpvt\b/g, "")
        .replace(/\bltd\b/g, "")
        .replace(/\blimited\b/g, "")
        .replace(/\bprivate\b/g, "")
        .replace(/\s+/g, " ")
        .trim();

    return value;
}


function normalizeCity(city) {
    return normalizeText(city)
        .replace(/\bdistrict\b/g, "")
        .trim();
}


function normalizeDisease(disease) {
    const value = normalizeText(disease);

    // Broad disease normalization
    if (
        value.includes("heart disease") ||
        value.includes("cardiovascular") ||
        value.includes("cardiac")
    ) {
        return "Heart Disease / Cardiovascular Conditions";
    }

    if (
        value === "cancer" ||
        value.includes("cancer") ||
        value.includes("tumor") ||
        value.includes("tumour") ||
        value.includes("oncology") ||
        value.includes("aml") ||
        value.includes("gist") ||
        value.includes("bone marrow transplant")
    ) {
        return "Cancer";
    }

    if (
        value.includes("kidney") ||
        value.includes("renal") ||
        value.includes("ckd")
    ) {
        return "Kidney Disease";
    }

    if (
        value.includes("diabetes")
    ) {
        return "Diabetes";
    }

    if (
        value.includes("stroke")
    ) {
        return "Stroke";
    }

    if (
        value.includes("parkinson")
    ) {
        return "Parkinson's Disease";
    }

    if (
        value.includes("osteoarthritis")
    ) {
        return "Osteoarthritis";
    }

    if (
        value.includes("pneumonia")
    ) {
        return "Pneumonia";
    }

    if (
        value.includes("dengue")
    ) {
        return "Dengue";
    }

    if (
        value.includes("tuberculosis") ||
        value.includes("tb")
    ) {
        return "Tuberculosis";
    }

    if (
        value.includes("thyroid") ||
        value.includes("hypothyroidism") ||
        value.includes("endocrine")
    ) {
        return "Thyroid / Endocrine Disorders";
    }

    if (
        value.includes("spinal cord")
    ) {
        return "Spinal Cord Injury";
    }

    if (
        value.includes("liver") ||
        value.includes("cirrhosis")
    ) {
        return "Liver Disease";
    }

    return String(disease).trim();
}


// ============================================================
// CONVERT DIFFERENT INPUT FORMATS INTO ONE FORMAT
// ============================================================

function convertTreatmentRecord(record) {

    // --------------------------------------------------------
    // FORMAT 1
    // 2025-style data
    // --------------------------------------------------------

    if (record.hospital_name) {

        return {
            hospitalName: record.hospital_name,
            city: record.city,
            state: record.state,
            pincode: record.pincode,

            disease: normalizeDisease(record.disease_or_condition),

            originalDisease: record.disease_or_condition,

            patientsTreated: Number(record.patients_treated) || null,

            successRate:
                record.success_rate_percentage !== undefined
                    ? Number(record.success_rate_percentage)
                    : null,

            averageCost:
                record.average_treatment_cost_inr !== undefined
                    ? Number(record.average_treatment_cost_inr)
                    : null,

            source: record.source || null,

            year:
                record.year !== undefined
                    ? Number(record.year)
                    : null
        };
    }


    // --------------------------------------------------------
    // FORMAT 2
    // 2023-style data
    // --------------------------------------------------------

    if (record.name) {

        let successRate = null;

        if (record.disease_specific_success_rate !== undefined) {

            const parsed = parseFloat(
                String(record.disease_specific_success_rate)
                    .replace("%", "")
                    .trim()
            );

            if (!Number.isNaN(parsed)) {
                successRate = parsed;
            }
        }

        return {
            hospitalName: record.name,
            city: record.city,
            state: record.state,
            pincode: record.pincode,

            disease: normalizeDisease(record.disease),

            originalDisease: record.disease,

            patientsTreated:
                record.patients_treated !== undefined
                    ? Number(record.patients_treated)
                    : null,

            successRate,

            averageCost:
                record.average_treatment_cost_inr !== undefined
                    ? Number(record.average_treatment_cost_inr)
                    : null,

            source: record.source || null,

            year:
                record.year !== undefined
                    ? Number(record.year)
                    : null
        };
    }


    return null;
}


// ============================================================
// FIND BEST HOSPITAL MATCH
// ============================================================

function findHospitalMatch(hospitals, treatment) {

    const treatmentName = normalizeHospitalName(
        treatment.hospitalName
    );

    const treatmentCity = normalizeCity(
        treatment.city
    );

    const treatmentState = normalizeText(
        treatment.state
    );

    const treatmentPincode = normalizeText(
        treatment.pincode
    );


    // --------------------------------------------------------
    // STEP 1: Exact normalized name + city
    // --------------------------------------------------------

    let match = hospitals.find(hospital => {

        const hospitalName = normalizeHospitalName(
            hospital.name
        );

        const hospitalCity = normalizeCity(
            hospital.city
        );

        return (
            hospitalName === treatmentName &&
            hospitalCity === treatmentCity
        );
    });

    if (match) {
        return match;
    }


    // --------------------------------------------------------
    // STEP 2: Name + state
    // --------------------------------------------------------

    match = hospitals.find(hospital => {

        const hospitalName = normalizeHospitalName(
            hospital.name
        );

        const hospitalState = normalizeText(
            hospital.state
        );

        return (
            hospitalName === treatmentName &&
            hospitalState === treatmentState
        );
    });

    if (match) {
        return match;
    }


    // --------------------------------------------------------
    // STEP 3: Name only
    // --------------------------------------------------------

    const nameMatches = hospitals.filter(hospital => {

        const hospitalName = normalizeHospitalName(
            hospital.name
        );

        return hospitalName === treatmentName;
    });


    if (nameMatches.length === 1) {
        return nameMatches[0];
    }


    // --------------------------------------------------------
    // STEP 4: Pincode + partial name
    // --------------------------------------------------------

    if (treatmentPincode) {

        match = hospitals.find(hospital => {

            const hospitalPincode = normalizeText(
                hospital.pincode
            );

            const hospitalName = normalizeHospitalName(
                hospital.name
            );

            return (
                hospitalPincode === treatmentPincode &&
                (
                    hospitalName.includes(treatmentName) ||
                    treatmentName.includes(hospitalName)
                )
            );
        });

        if (match) {
            return match;
        }
    }


    return null;
}


// ============================================================
// DUPLICATE CHECK
// ============================================================

function treatmentAlreadyExists(hospital, treatment) {

    if (!Array.isArray(hospital.treatments)) {
        return false;
    }

    return hospital.treatments.some(existing => {

        const sameDisease =
            normalizeText(existing.disease) ===
            normalizeText(treatment.disease);

        const sameYear =
            Number(existing.year || 0) ===
            Number(treatment.year || 0);

        const sameSource =
            normalizeText(existing.source) ===
            normalizeText(treatment.source);

        return sameDisease && sameYear && sameSource;
    });
}


// ============================================================
// MAIN
// ============================================================

console.log("\n========================================");
console.log(" Hospital Treatment Data Merge");
console.log("========================================\n");


if (!fs.existsSync(BASE_FILE)) {

    console.error("❌ Base hospital file not found:");
    console.error(BASE_FILE);
    process.exit(1);
}


if (!fs.existsSync(TREATMENT_FILE)) {

    console.error("❌ Treatment data file not found:");
    console.error(TREATMENT_FILE);

    console.error(
        "\nCreate this file first:"
    );

    console.error(
        "data/disease_treatments.json"
    );

    process.exit(1);
}


// ------------------------------------------------------------
// READ FILES
// ------------------------------------------------------------

let hospitals;
let rawTreatments;


try {

    hospitals = JSON.parse(
        fs.readFileSync(BASE_FILE, "utf8")
    );

} catch (error) {

    console.error("❌ Could not read clean_hospitals.json");
    console.error(error.message);
    process.exit(1);
}


try {

    rawTreatments = JSON.parse(
        fs.readFileSync(TREATMENT_FILE, "utf8")
    );

} catch (error) {

    console.error("❌ Could not read disease_treatments.json");
    console.error(error.message);
    process.exit(1);
}


// ------------------------------------------------------------
// VALIDATE BASE DATA
// ------------------------------------------------------------

if (!Array.isArray(hospitals)) {

    console.error(
        "❌ clean_hospitals.json must contain an array."
    );

    process.exit(1);
}


if (!Array.isArray(rawTreatments)) {

    console.error(
        "❌ disease_treatments.json must contain an array."
    );

    process.exit(1);
}


console.log(
    `Base hospitals: ${hospitals.length}`
);

console.log(
    `Treatment records: ${rawTreatments.length}\n`
);


// ------------------------------------------------------------
// INITIALIZE TREATMENTS
// ------------------------------------------------------------

for (const hospital of hospitals) {

    if (!Array.isArray(hospital.treatments)) {
        hospital.treatments = [];
    }
}


// ------------------------------------------------------------
// PROCESS TREATMENTS
// ------------------------------------------------------------

let matched = 0;
let unmatched = 0;
let duplicates = 0;

const unmatchedRecords = [];


for (const rawRecord of rawTreatments) {

    const treatment =
        convertTreatmentRecord(rawRecord);


    if (!treatment) {

        unmatched++;

        unmatchedRecords.push({
            reason: "Invalid treatment record",
            record: rawRecord
        });

        continue;
    }


    const hospital =
        findHospitalMatch(
            hospitals,
            treatment
        );


    if (!hospital) {

        unmatched++;

        unmatchedRecords.push({
            reason: "Hospital not found in base dataset",
            hospitalName: treatment.hospitalName,
            city: treatment.city,
            state: treatment.state,
            pincode: treatment.pincode,
            disease: treatment.originalDisease,
            year: treatment.year
        });

        continue;
    }


    // --------------------------------------------------------
    // ADD TREATMENT
    // --------------------------------------------------------

    const treatmentData = {

        disease: treatment.disease,

        patientsTreated:
            treatment.patientsTreated,

        successRate:
            treatment.successRate,

        averageCost:
            treatment.averageCost,

        source:
            treatment.source,

        year:
            treatment.year
    };


    // Remove undefined values
    for (const key of Object.keys(treatmentData)) {

        if (
            treatmentData[key] === undefined
        ) {
            delete treatmentData[key];
        }
    }


    // --------------------------------------------------------
    // DUPLICATE CHECK
    // --------------------------------------------------------

    if (
        treatmentAlreadyExists(
            hospital,
            treatmentData
        )
    ) {

        duplicates++;
        continue;
    }


    hospital.treatments.push(
        treatmentData
    );

    matched++;

    console.log(
        `✅ ${hospital.name} ← ${treatment.disease} (${treatment.year})`
    );
}


// ============================================================
// SAVE ENRICHED DATA
// ============================================================

fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(hospitals, null, 2),
    "utf8"
);


// ============================================================
// SAVE UNMATCHED RECORDS
// ============================================================

fs.writeFileSync(
    UNMATCHED_FILE,
    JSON.stringify(
        unmatchedRecords,
        null,
        2
    ),
    "utf8"
);


// ============================================================
// FINAL REPORT
// ============================================================

console.log("\n========================================");
console.log(" MERGE COMPLETED");
console.log("========================================");

console.log(
    `Original hospitals : ${hospitals.length}`
);

console.log(
    `Matched treatments : ${matched}`
);

console.log(
    `Duplicate records  : ${duplicates}`
);

console.log(
    `Unmatched records  : ${unmatched}`
);

console.log(
    `\nOutput file: ${OUTPUT_FILE}`
);

console.log(
    `Unmatched file: ${UNMATCHED_FILE}`
);

console.log("\n========================================\n");