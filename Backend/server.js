require("dotenv").config({
    path: __dirname + "/.env"
});

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

const Hospital = require("./models/Hospital");

const app = express();
const PORT = process.env.PORT || 5000;


// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(cors());
app.use(express.json());


// --------------------------------------------------
// HOME
// --------------------------------------------------

app.get("/", (req, res) => {

    res.send(
        "Hospital Recommendation Backend is running!"
    );

});


// --------------------------------------------------
// GET ALL HOSPITALS
// --------------------------------------------------

app.get("/api/hospitals", async (req, res) => {

    try {

        const hospitals =
            await Hospital.find();

        res.json(hospitals);

    } catch (error) {

        res.status(500).json({

            message:
                "Failed to fetch hospitals",

            error:
                error.message

        });

    }

});


// --------------------------------------------------
// SEARCH HOSPITALS
// --------------------------------------------------

app.get("/api/hospitals/search", async (req, res) => {

    try {

        const {
            disease,
            city,
            specialty,
            category
        } = req.query;


        let filter = {};


        if (disease) {

            filter.diseases = {

                $regex: disease,

                $options: "i"

            };

        }


        if (city) {

            filter.city = {

                $regex: city,

                $options: "i"

            };

        }


        if (specialty) {

            filter.specialties = {

                $regex: specialty,

                $options: "i"

            };

        }


        if (category) {

            filter.category = {

                $regex: category,

                $options: "i"

            };

        }


        const hospitals =
            await Hospital.find(filter);


        res.json(hospitals);


    } catch (error) {

        res.status(500).json({

            message:
                "Search failed",

            error:
                error.message

        });

    }

});


// --------------------------------------------------
// DISTANCE CALCULATION
// --------------------------------------------------

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371;


    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;


    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(
            lat1 * Math.PI / 180
        ) *

        Math.cos(
            lat2 * Math.PI / 180
        ) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return R * c;

}


// --------------------------------------------------
// RECOMMENDATION API
// --------------------------------------------------

app.get(
    "/api/hospitals/recommend",
    async (req, res) => {

        try {

            const {

                disease,

                specialty,

                city,

                budget,

                minBudget,

                maxBudget,

                maxDistance,

                outcomeAvailableOnly,

                hospitalType,

                facilities,

                minRating,

                userLat,

                userLng,

                sortBy = "recommended"

            } = req.query;


            // ------------------------------------------
            // DATABASE FILTER
            // ------------------------------------------

            let filter = {};


            if (disease) {

                filter.diseases = {

                    $regex: disease,

                    $options: "i"

                };

            }


            if (specialty) {

                filter.specialties = {

                    $regex: specialty,

                    $options: "i"

                };

            }


            if (city) {

                filter.city = {

                    $regex: city,

                    $options: "i"

                };

            }


            if (hospitalType) {

                filter.category = {

                    $regex: hospitalType,

                    $options: "i"

                };

            }


            // ------------------------------------------
            // GET HOSPITALS
            // ------------------------------------------

            const hospitals =
                await Hospital.find(filter);


            // ------------------------------------------
            // USER LOCATION
            // ------------------------------------------

            const hasUserLocation =

                userLat !== undefined &&

                userLng !== undefined &&

                userLat !== "" &&

                userLng !== "" &&

                !isNaN(Number(userLat)) &&

                !isNaN(Number(userLng));


            // ------------------------------------------
            // BUDGET
            // ------------------------------------------

            let minimumBudget = null;

            let maximumBudget = null;


            if (

                minBudget !== undefined &&

                minBudget !== "" &&

                !isNaN(Number(minBudget))

            ) {

                minimumBudget =
                    Number(minBudget);

            }


            if (

                maxBudget !== undefined &&

                maxBudget !== "" &&

                !isNaN(Number(maxBudget))

            ) {

                maximumBudget =
                    Number(maxBudget);

            }


            if (

                maximumBudget === null &&

                budget !== undefined &&

                budget !== "" &&

                !isNaN(Number(budget))

            ) {

                maximumBudget =
                    Number(budget);

            }


            const hasBudget =

                minimumBudget !== null ||

                maximumBudget !== null;


            // ------------------------------------------
            // MAX DISTANCE
            // ------------------------------------------

            const hasMaxDistance =

                maxDistance !== undefined &&

                maxDistance !== "" &&

                !isNaN(Number(maxDistance));


            const maximumDistance =

                hasMaxDistance

                    ? Number(maxDistance)

                    : null;


            // ------------------------------------------
            // OUTCOME FILTER
            // ------------------------------------------

            const onlyWithOutcome =

                outcomeAvailableOnly === true ||

                outcomeAvailableOnly === "true";


            // ------------------------------------------
            // RATING FILTER
            // ------------------------------------------

            const hasMinRating =

                minRating !== undefined &&

                minRating !== "" &&

                !isNaN(Number(minRating));


            const minimumRating =

                hasMinRating

                    ? Number(minRating)

                    : null;


            // ------------------------------------------
            // FACILITIES
            // ------------------------------------------

            let requestedFacilities = [];


            if (facilities) {

                requestedFacilities =

                    facilities
                        .split(",")
                        .map(item =>
                            item.trim()
                        )
                        .filter(Boolean);

            }


            // ------------------------------------------
            // PROCESS HOSPITALS
            // ------------------------------------------

            const results =

                hospitals

                    .map(hospital => {

                        let distanceKm = null;


                        // ----------------------------------
                        // DISTANCE
                        // ----------------------------------

                        if (

                            hasUserLocation &&

                            hospital.location &&

                            hospital.location.latitude != null &&

                            hospital.location.longitude != null

                        ) {

                            distanceKm =

                                calculateDistance(

                                    Number(userLat),

                                    Number(userLng),

                                    Number(
                                        hospital.location.latitude
                                    ),

                                    Number(
                                        hospital.location.longitude
                                    )

                                );


                            distanceKm =

                                Number(
                                    distanceKm.toFixed(2)
                                );

                        }


                        // ----------------------------------
                        // DISEASE-SPECIFIC TREATMENT DATA
                        // ----------------------------------

                        let treatmentData = null;


                        if (

                            disease &&

                            Array.isArray(
                                hospital.treatments
                            )

                        ) {

                            treatmentData =

                                hospital.treatments.find(

                                    treatment =>

                                        treatment &&

                                        treatment.disease &&

                                        treatment.disease
                                            .toLowerCase()
                                            .includes(
                                                disease.toLowerCase()
                                            )

                                );

                        }


                        // ----------------------------------
                        // OUTCOME
                        // ----------------------------------

                        let effectiveOutcome = null;

                        let effectiveOutcomeSource = "";

                        let effectiveOutcomeYear = null;


                        if (treatmentData) {

                            effectiveOutcome =

                                treatmentData.successRate ??
                                null;


                            effectiveOutcomeSource =

                                treatmentData.source ||
                                "";


                            effectiveOutcomeYear =

                                treatmentData.year ||
                                null;

                        }

                        else if (!disease) {

                            effectiveOutcome =

                                hospital.outcomeRate ??
                                null;


                            effectiveOutcomeSource =

                                hospital.outcomeSource ||
                                "";


                            effectiveOutcomeYear =

                                hospital.outcomeYear ||
                                null;

                        }


                        const outcomeStatus =

                            effectiveOutcome != null

                                ? "Available"

                                : "N/A";


                        // ----------------------------------
                        // COST
                        // ----------------------------------

                        let effectiveCostMin = null;

                        let effectiveCostMax = null;


                        if (treatmentData) {

                            const averageCost =

                                treatmentData.averageCost ??
                                null;


                            if (averageCost != null) {

                                effectiveCostMin =
                                    averageCost;

                                effectiveCostMax =
                                    averageCost;

                            }

                        }

                        else if (!disease) {

                            effectiveCostMin =

                                hospital.cost?.min ??
                                null;


                            effectiveCostMax =

                                hospital.cost?.max ??
                                null;

                        }


                        // ----------------------------------
                        // BUDGET STATUS
                        // ----------------------------------

                        let budgetStatus =
                            "Unknown";


                        if (

                            hasBudget &&

                            effectiveCostMin != null &&

                            effectiveCostMax != null

                        ) {

                            if (

                                minimumBudget !== null &&

                                maximumBudget !== null

                            ) {

                                if (

                                    effectiveCostMax >=
                                    minimumBudget &&

                                    effectiveCostMin <=
                                    maximumBudget

                                ) {

                                    budgetStatus =
                                        "Within Budget";

                                }

                                else if (

                                    effectiveCostMin >
                                    maximumBudget

                                ) {

                                    budgetStatus =
                                        "Above Budget";

                                }

                                else {

                                    budgetStatus =
                                        "Below Budget";

                                }

                            }

                            else if (

                                maximumBudget !== null

                            ) {

                                if (

                                    effectiveCostMax <=
                                    maximumBudget

                                ) {

                                    budgetStatus =
                                        "Within Budget";

                                }

                                else if (

                                    effectiveCostMin <=
                                    maximumBudget

                                ) {

                                    budgetStatus =
                                        "Partially Within Budget";

                                }

                                else {

                                    budgetStatus =
                                        "Above Budget";

                                }

                            }

                            else if (

                                minimumBudget !== null

                            ) {

                                if (

                                    effectiveCostMax >=
                                    minimumBudget

                                ) {

                                    budgetStatus =
                                        "Within Budget";

                                }

                                else {

                                    budgetStatus =
                                        "Below Budget";

                                }

                            }

                        }


                        // ----------------------------------
                        // BUDGET FILTER
                        // ----------------------------------

                        if (

                            maximumBudget !== null &&

                            effectiveCostMin != null &&

                            effectiveCostMin >
                            maximumBudget

                        ) {

                            return null;

                        }


                        // ----------------------------------
                        // OUTCOME FILTER
                        // ----------------------------------

                        if (

                            onlyWithOutcome &&

                            effectiveOutcome == null

                        ) {

                            return null;

                        }


                        // ----------------------------------
                        // DISTANCE FILTER
                        // ----------------------------------

                        if (

                            hasMaxDistance &&

                            hasUserLocation &&

                            distanceKm != null &&

                            distanceKm >
                            maximumDistance

                        ) {

                            return null;

                        }


                        if (

                            hasMaxDistance &&

                            hasUserLocation &&

                            distanceKm == null

                        ) {

                            return null;

                        }


                        // ----------------------------------
                        // RATING FILTER
                        // ----------------------------------

                        if (hasMinRating) {

                            if (

                                hospital.rating == null ||

                                Number(hospital.rating) <
                                minimumRating

                            ) {

                                return null;

                            }

                        }


                        // ----------------------------------
                        // FACILITIES FILTER
                        // ----------------------------------

                        if (
                            requestedFacilities.length > 0
                        ) {

                            const hospitalFacilities =

                                Array.isArray(
                                    hospital.facilities
                                )

                                    ? hospital.facilities

                                    : [];


                            const hasAllFacilities =

                                requestedFacilities.every(

                                    requested =>

                                        hospitalFacilities.some(

                                            available =>

                                                String(
                                                    available
                                                )
                                                    .toLowerCase()
                                                    .includes(
                                                        requested
                                                            .toLowerCase()
                                                    )

                                        )

                                );


                            if (!hasAllFacilities) {

                                return null;

                            }

                        }


                        // ----------------------------------
                        // RECOMMENDATION MATCH
                        // ----------------------------------

                        let recommendationScore = 0;


                        if (disease) {

                            recommendationScore += 40;

                        }


                        if (
                            effectiveOutcome != null
                        ) {

                            recommendationScore +=

                                (
                                    Number(
                                        effectiveOutcome
                                    ) / 100
                                ) * 30;

                        }


                        if (

                            hasBudget &&

                            budgetStatus ===
                            "Within Budget"

                        ) {

                            recommendationScore += 20;

                        }

                        else if (

                            hasBudget &&

                            budgetStatus ===
                            "Partially Within Budget"

                        ) {

                            recommendationScore += 10;

                        }


                        if (distanceKm != null) {

                            if (
                                distanceKm <= 5
                            ) {

                                recommendationScore += 10;

                            }

                            else if (
                                distanceKm <= 10
                            ) {

                                recommendationScore += 8;

                            }

                            else if (
                                distanceKm <= 25
                            ) {

                                recommendationScore += 5;

                            }

                            else {

                                recommendationScore += 2;

                            }

                        }


                        recommendationScore =

                            Number(
                                recommendationScore.toFixed(2)
                            );


                        // ----------------------------------
                        // FINAL RESULT
                        // ----------------------------------

                        return {

                            ...hospital.toObject(),


                            cost: {

                                ...(hospital.cost
                                    ? hospital.cost.toObject
                                        ? hospital.cost.toObject()
                                        : hospital.cost
                                    : {}),

                                min:
                                    effectiveCostMin,

                                max:
                                    effectiveCostMax

                            },


                            outcomeRate:
                                effectiveOutcome,


                            outcomeSource:
                                effectiveOutcomeSource,


                            outcomeYear:
                                effectiveOutcomeYear,


                            outcomeStatus,


                            budgetStatus,


                            distanceKm,


                            recommendationScore

                        };

                    })

                    .filter(Boolean);


            // ------------------------------------------
            // SORTING
            // ------------------------------------------

            if (
                sortBy === "distance"
            ) {

                results.sort((a, b) => {

                    if (
                        a.distanceKm === null
                    ) {
                        return 1;
                    }

                    if (
                        b.distanceKm === null
                    ) {
                        return -1;
                    }

                    return (
                        a.distanceKm -
                        b.distanceKm
                    );

                });

            }


            if (
                sortBy === "cost"
            ) {

                results.sort((a, b) => {

                    const aCost =
                        a.cost?.min;

                    const bCost =
                        b.cost?.min;


                    if (
                        aCost == null
                    ) {
                        return 1;
                    }

                    if (
                        bCost == null
                    ) {
                        return -1;
                    }

                    return aCost - bCost;

                });

            }


            if (
                sortBy === "outcome"
            ) {

                results.sort((a, b) => {

                    if (
                        a.outcomeRate == null
                    ) {
                        return 1;
                    }

                    if (
                        b.outcomeRate == null
                    ) {
                        return -1;
                    }

                    return (
                        b.outcomeRate -
                        a.outcomeRate
                    );

                });

            }


            if (
                sortBy === "recommended"
            ) {

                results.sort((a, b) => {

                    return (
                        b.recommendationScore -
                        a.recommendationScore
                    );

                });

            }


            res.json(results);


        } catch (error) {

            console.error(
                "Recommendation error:",
                error
            );


            res.status(500).json({

                message:
                    "Recommendation failed",

                error:
                    error.message

            });

        }

    }
);


// --------------------------------------------------
// GEMINI AI
// --------------------------------------------------

const GEMINI_MODEL =
    "gemini-3.5-flash";


let geminiApiKey = null;


function getGeminiApiKey() {

    if (geminiApiKey) {

        return geminiApiKey;

    }


    if (!process.env.GEMINI_API_KEY) {

        throw new Error(
            "GEMINI_API_KEY is not configured."
        );

    }


    geminiApiKey =
        process.env.GEMINI_API_KEY;


    return geminiApiKey;

}


// --------------------------------------------------
// GEMINI REST REQUEST
// --------------------------------------------------

async function generateGeminiContentWithRetry(
    request,
    maxRetries = 4
) {

    const apiKey =
        getGeminiApiKey();


    let lastError = null;


    for (
        let attempt = 0;
        attempt <= maxRetries;
        attempt++
    ) {

        try {

            const response =

                await fetch(

                    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "x-goog-api-key":
                                apiKey

                        },

                        body: JSON.stringify({

                            systemInstruction:
                                request.systemInstruction,

                            contents:
                                request.contents,

                            tools:
                                request.tools

                        })

                    }

                );


            const data =
                await response.json();


            if (!response.ok) {

                const error =
                    new Error(

                        JSON.stringify(
                            data.error ||
                            data
                        )

                    );


                error.status =
                    response.status;


                throw error;

            }


            const candidate =
                data.candidates?.[0];


            if (!candidate) {

                throw new Error(
                    "Gemini returned no candidate."
                );

            }


            const modelContent =
                candidate.content;


            const parts =
                modelContent?.parts ||
                [];


            const functionCalls =

                parts

                    .filter(
                        part =>
                            part.functionCall
                    )

                    .map(
                        part =>
                            part.functionCall
                    );


            const text =

                parts

                    .filter(
                        part =>
                            typeof part.text ===
                            "string"
                    )

                    .map(
                        part =>
                            part.text
                    )

                    .join("\n");


            return {

                raw:
                    data,

                candidates:
                    data.candidates,

                functionCalls,

                text

            };

        } catch (error) {

            lastError =
                error;


            const errorText =
                error?.message ||
                String(error);


            const temporaryError =

                error?.status === 429 ||

                error?.status === 500 ||

                error?.status === 502 ||

                error?.status === 503 ||

                error?.status === 504 ||

                errorText.includes("429") ||

                errorText.includes("500") ||

                errorText.includes("502") ||

                errorText.includes("503") ||

                errorText.includes("504") ||

                errorText.includes(
                    "UNAVAILABLE"
                ) ||

                errorText.includes(
                    "high demand"
                );


            if (

                !temporaryError ||

                attempt === maxRetries

            ) {

                throw error;

            }


            const delay =

                Math.min(

                    1000 *
                    Math.pow(
                        2,
                        attempt
                    ),

                    8000

                );


            console.log(

                `Gemini temporary error. Retry ${attempt + 1}/${maxRetries} in ${delay}ms...`

            );


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        delay
                    )
            );

        }

    }


    throw lastError;

}


// --------------------------------------------------
// SEARCH HOSPITALS FOR GEMINI
// --------------------------------------------------

async function searchHospitalsForAI(args) {

    const {

        disease,

        specialty,

        city,

        minBudget,

        maxBudget,

        maxDistance,

        userLat,

        userLng

    } = args;


    const params =
        new URLSearchParams();


    if (disease) {

        params.set(
            "disease",
            String(disease)
        );

    }


    if (specialty) {

        params.set(
            "specialty",
            String(specialty)
        );

    }


    if (city) {

        params.set(
            "city",
            String(city)
        );

    }


    if (
        minBudget !== undefined &&
        minBudget !== null
    ) {

        params.set(
            "minBudget",
            String(minBudget)
        );

    }


    if (
        maxBudget !== undefined &&
        maxBudget !== null
    ) {

        params.set(
            "maxBudget",
            String(maxBudget)
        );

    }


    if (
        maxDistance !== undefined &&
        maxDistance !== null
    ) {

        params.set(
            "maxDistance",
            String(maxDistance)
        );

    }


    if (

        userLat !== undefined &&
        userLat !== null &&

        userLng !== undefined &&
        userLng !== null

    ) {

        params.set(
            "userLat",
            String(userLat)
        );


        params.set(
            "userLng",
            String(userLng)
        );

    }


    params.set(
        "sortBy",
        "recommended"
    );


    const url =

        `http://localhost:${PORT}` +
        `/api/hospitals/recommend?` +
        params.toString();


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            `Hospital recommendation API failed: ${response.status}`
        );

    }


    const hospitals =
        await response.json();


    return hospitals

        .slice(0, 10)

        .map(hospital => ({

            name:
                hospital.name || null,


            city:
                hospital.city || null,


            state:
                hospital.state || null,


            address:
                hospital.address || null,


            specialties:
                Array.isArray(
                    hospital.specialties
                )
                    ? hospital.specialties
                    : [],


            diseases:
                Array.isArray(
                    hospital.diseases
                )
                    ? hospital.diseases
                    : [],


            treatment:
                Array.isArray(
                    hospital.treatments
                )
                    ? hospital.treatments
                    : [],


            costMin:
                hospital.cost?.min ?? null,


            costMax:
                hospital.cost?.max ?? null,


            outcomeRate:
                hospital.outcomeRate ?? null,


            outcomeStatus:
                hospital.outcomeStatus ||
                "N/A",


            outcomeSource:
                hospital.outcomeSource ||
                null,


            outcomeYear:
                hospital.outcomeYear ||
                null,


            budgetStatus:
                hospital.budgetStatus ||
                "Unknown",


            distanceKm:
                hospital.distanceKm ??
                null,


            recommendationScore:
                hospital.recommendationScore ??
                null,


            phone:
                hospital.phone ||
                null,


            website:
                hospital.website ||
                null

        }));

}


// --------------------------------------------------
// GEMINI CHAT API
// --------------------------------------------------

app.post(
    "/api/ai/chat",
    async (req, res) => {

        try {

            const {

                message,

                history = [],

                userLat,

                userLng

            } = req.body;


            // ------------------------------------------
            // VALIDATE
            // ------------------------------------------

            if (

                !message ||

                typeof message !== "string" ||

                !message.trim()

            ) {

                return res.status(400).json({

                    message:
                        "Please provide a message."

                });

            }


            getGeminiApiKey();


            // ------------------------------------------
            // SEARCH TOOL
            // ------------------------------------------

            const searchHospitalsFunction = {

                name:
                    "search_hospitals",


                description:

                    "Search the real hospital database using the user's medical condition, specialty, city, budget and distance requirements. Use this tool when the user wants hospital recommendations. Never invent hospital data.",


                parameters: {

                    type:
                        "OBJECT",


                    properties: {

                        disease: {

                            type:
                                "STRING",

                            description:
                                "Searchable disease or condition such as Cancer, Heart Disease, Neurological Condition, Bone and Joint Condition, Skin Condition, Eye Condition, Kidney Condition, Digestive Condition, Respiratory Condition, Child Health or Women's Health."

                        },


                        specialty: {

                            type:
                                "STRING",

                            description:
                                "Medical specialty such as Oncology, Cardiology, Neurology, Orthopedics, Dermatology, Ophthalmology, Nephrology, Gastroenterology, Pediatrics, Gynecology, Dentistry or Pulmonology."

                        },


                        city: {

                            type:
                                "STRING",

                            description:
                                "City where the user wants the hospital. Only provide this when the user specifies a city."

                        },


                        minBudget: {

                            type:
                                "NUMBER",

                            description:
                                "Minimum treatment budget in Indian rupees if specified by the user."

                        },


                        maxBudget: {

                            type:
                                "NUMBER",

                            description:
                                "Maximum treatment budget in Indian rupees if specified by the user."

                        },


                        maxDistance: {

                            type:
                                "NUMBER",

                            description:
                                "Maximum acceptable hospital distance in kilometers if specified by the user."

                        }

                    }

                }

            };


            // ------------------------------------------
            // SYSTEM INSTRUCTION
            // ------------------------------------------

            const systemInstruction = {

                parts: [

                    {

                        text: `You are the AI hospital search assistant for the Vitality hospital recommendation website.

Your purpose is to understand normal human language and help users find suitable hospitals from the application's real hospital database.

You are NOT a doctor.

MEDICAL SAFETY:

- Do not diagnose diseases.
- Do not prescribe medicines.
- Do not provide treatment instructions.
- Do not claim symptoms prove a disease.
- You may identify a broad searchable category or specialty only for hospital search.
- For emergencies, tell the user to seek immediate professional or emergency medical care.

DATABASE RULES:

- The application's hospital database is the source of truth.
- Never invent a hospital.
- Never invent hospital cost.
- Never invent success rate.
- Never invent outcome rate.
- Never invent distance.
- Never invent patient counts.
- Never invent ratings.
- If a value is unavailable or null, say it is unavailable.
- Never turn missing data into an estimate.
- Never claim Recommendation Match is a probability of success.
- Recommendation Match is only the application's matching score.

SEARCH RULES:

When the user wants hospitals, ALWAYS use the search_hospitals function.

Understand natural language such as:

"Mujhe heart ka hospital chahiye"
"Mere paas cancer hai"
"Mujhe Delhi mein 2 lakh ke andar hospital chahiye"
"I need a hospital near Mumbai"
"Brain stroke ke liye hospital chahiye"
"Bone fracture ka treatment chahiye"

Convert the user's request into appropriate searchable disease and specialty categories.

If the user gives a city, use that city.

If the user gives a budget, convert it to INR.

If the user gives a maximum distance, use kilometers.

If important information is missing, search using the information that is available instead of asking unnecessary questions.

After receiving hospital results:

- Explain the results in simple language.
- Mention only information actually returned by the database.
- Do not invent missing values.
- Clearly say when cost or outcome data is unavailable.
- Keep the response concise but useful.

RECOMMENDATION PRIORITY:

Disease
→ Success Rate
→ Budget
→ Distance

Do not change this order.

IMPORTANT:

You must use the search_hospitals tool for hospital recommendations.
Do not answer hospital-search questions from your own general knowledge.`
                    }

                ]

            };


            // ------------------------------------------
            // CONVERSATION HISTORY
            // ------------------------------------------

            const contents = [];


            const safeHistory =

                Array.isArray(history)

                    ? history.slice(-10)

                    : [];


            for (
                const item of safeHistory
            ) {

                if (

                    !item ||

                    !item.role ||

                    !item.text

                ) {

                    continue;

                }


                contents.push({

                    role:

                        item.role === "assistant"

                            ? "model"

                            : "user",


                    parts: [

                        {

                            text:
                                String(
                                    item.text
                                )

                        }

                    ]

                });

            }


            // ------------------------------------------
            // CURRENT USER MESSAGE
            // ------------------------------------------

            contents.push({

                role:
                    "user",

                parts: [

                    {

                        text:
                            message.trim()

                    }

                ]

            });


            // ------------------------------------------
            // FIRST GEMINI REQUEST
            // ------------------------------------------

            let response =

                await generateGeminiContentWithRetry({

                    systemInstruction,

                    contents,

                    tools: [

                        {

                            functionDeclarations: [

                                searchHospitalsFunction

                            ]

                        }

                    ]

                });


            // ------------------------------------------
            // FUNCTION CALL LOOP
            // ------------------------------------------

            let toolUsed = false;


            for (
                let round = 0;
                round < 3;
                round++
            ) {

                const functionCalls =

                    response.functionCalls ||
                    [];


                // --------------------------------------
                // NO TOOL CALL
                // --------------------------------------

                if (
                    functionCalls.length === 0
                ) {

                    break;

                }


                toolUsed = true;


                // --------------------------------------
                // PRESERVE COMPLETE MODEL CONTENT
                // --------------------------------------

                const modelContent =

                    response.candidates?.[0]?.content;


                if (!modelContent) {

                    throw new Error(
                        "Gemini returned a function call without model content."
                    );

                }


                contents.push(
                    modelContent
                );


                // --------------------------------------
                // EXECUTE FUNCTIONS
                // --------------------------------------

                for (
                    const functionCall
                    of functionCalls
                ) {

                    if (

                        functionCall.name !==
                        "search_hospitals"

                    ) {

                        continue;

                    }


                    const args = {

                        ...(functionCall.args || {})

                    };


                    // Location is supplied by application,
                    // never invented by Gemini.

                    if (

                        userLat !== undefined &&

                        userLng !== undefined &&

                        userLat !== null &&

                        userLng !== null

                    ) {

                        args.userLat =
                            Number(userLat);


                        args.userLng =
                            Number(userLng);

                    }


                    console.log(
                        "Gemini hospital search:",
                        args
                    );


                    const toolResult =

                        await searchHospitalsForAI(
                            args
                        );


                    console.log(
                        "Hospitals found:",
                        toolResult.length
                    );


                    // ----------------------------------
                    // FUNCTION RESPONSE
                    // ----------------------------------

                    contents.push({

                        role:
                            "user",

                        parts: [

                            {

                                functionResponse: {

                                    id:
                                        functionCall.id,

                                    name:
                                        functionCall.name,

                                    response: {

                                        hospitals:
                                            toolResult

                                    }

                                }

                            }

                        ]

                    });

                }


                // --------------------------------------
                // NEXT GEMINI REQUEST
                // --------------------------------------

                response =

                    await generateGeminiContentWithRetry({

                        systemInstruction,

                        contents,

                        tools: [

                            {

                                functionDeclarations: [

                                    searchHospitalsFunction

                                ]

                            }

                        ]

                    });

            }


            // ------------------------------------------
            // FINAL RESPONSE
            // ------------------------------------------

            let reply =
                response.text;


            if (
                !reply ||
                !reply.trim()
            ) {

                reply =
                    "I couldn't generate a response right now.";

            }


            res.json({

                reply,

                toolUsed

            });


        } catch (error) {

            console.error(
                "Gemini AI error:",
                error
            );


            res.status(500).json({

                message:
                    "AI assistant failed.",

                error:
                    error.message

            });

        }

    }
);


// --------------------------------------------------
// GET SINGLE HOSPITAL
// --------------------------------------------------

app.get(
    "/api/hospitals/:id",
    async (req, res) => {

        try {

            const hospital =

                await Hospital.findById(
                    req.params.id
                );


            if (!hospital) {

                return res.status(404).json({

                    message:
                        "Hospital not found"

                });

            }


            res.json(hospital);


        } catch (error) {

            res.status(500).json({

                message:
                    "Failed to fetch hospital",

                error:
                    error.message

            });

        }

    }
);


// --------------------------------------------------
// ADD HOSPITAL
// --------------------------------------------------

app.post(
    "/api/hospitals",
    async (req, res) => {

        try {

            const hospital =
                new Hospital(req.body);


            const savedHospital =
                await hospital.save();


            res.status(201).json(
                savedHospital
            );


        } catch (error) {

            res.status(500).json({

                message:
                    "Failed to add hospital",

                error:
                    error.message

            });

        }

    }
);


// --------------------------------------------------
// DELETE HOSPITAL
// --------------------------------------------------

app.delete(
    "/api/hospitals/:id",
    async (req, res) => {

        try {

            const deletedHospital =

                await Hospital.findByIdAndDelete(
                    req.params.id
                );


            if (!deletedHospital) {

                return res.status(404).json({

                    message:
                        "Hospital not found"

                });

            }


            res.json({

                message:
                    "Hospital deleted successfully"

            });


        } catch (error) {

            res.status(500).json({

                message:
                    "Failed to delete hospital",

                error:
                    error.message

            });

        }

    }
);

// --------------------------------------------------
// AI CHATBOT - GEMINI
// --------------------------------------------------



// --------------------------------------------------
// GEMINI REQUEST HELPER
// --------------------------------------------------

async function callGemini(requestBody) {

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": process.env.GEMINI_API_KEY
            },

            body: JSON.stringify(requestBody)
        }
    );


    const data = await response.json();


    if (!response.ok) {

        console.error(
            "Gemini API error:",
            JSON.stringify(data, null, 2)
        );

        throw new Error(
            data?.error?.message ||
            "Gemini API request failed"
        );

    }


    return data;
}



// --------------------------------------------------
// AI HOSPITAL SEARCH TOOL
// --------------------------------------------------

async function searchHospitalsForAI(args) {

    try {

        const params = new URLSearchParams();


        if (args.disease) {
            params.set(
                "disease",
                args.disease
            );
        }


        if (args.specialty) {
            params.set(
                "specialty",
                args.specialty
            );
        }


        if (args.city) {
            params.set(
                "city",
                args.city
            );
        }


        if (args.maxBudget != null) {
            params.set(
                "maxBudget",
                String(args.maxBudget)
            );
        }


        if (args.minBudget != null) {
            params.set(
                "minBudget",
                String(args.minBudget)
            );
        }


        if (args.maxDistance != null) {
            params.set(
                "maxDistance",
                String(args.maxDistance)
            );
        }


        params.set(
            "sortBy",
            "recommended"
        );


        const response = await fetch(
            `http://localhost:${PORT}/api/hospitals/recommend?${params.toString()}`
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data?.error ||
                data?.message ||
                "Hospital search failed"
            );

        }


        return data;

    }
    catch (error) {

        console.error(
            "AI hospital search error:",
            error
        );

        return {
            error: error.message
        };

    }

}



// --------------------------------------------------
// AI CHAT ROUTE
// --------------------------------------------------

app.post(
    "/api/ai/chat",
    async (req, res) => {

        try {

            const userMessage =
                String(
                    req.body?.message || ""
                ).trim();


            if (!userMessage) {

                return res.status(400).json({

                    error:
                        "Message is required"

                });

            }


            if (!process.env.GEMINI_API_KEY) {

                return res.status(500).json({

                    error:
                        "GEMINI_API_KEY is missing in backend/.env"

                });

            }



            // --------------------------------------------------
            // SYSTEM INSTRUCTION
            // --------------------------------------------------

            const systemInstruction = `
You are Vitality AI, an AI assistant for a hospital recommendation system.

Your job is to understand the user's natural-language hospital request
and help them find hospitals from the Vitality hospital database.

IMPORTANT RULES:

1. You do NOT diagnose diseases.
2. You do NOT prescribe medicines.
3. You do NOT invent hospitals.
4. You do NOT invent success rates, costs, ratings, distances,
   patient counts, or other hospital information.
5. Hospital-specific information must come from the database tool.
6. If the user gives a disease/condition, map it to the closest
   relevant disease or medical specialty for searching.
7. If the user gives a city, use that city.
8. If the user gives a budget, use it as maxBudget.
9. Disease matching is the highest priority.
10. After disease matching, the recommendation system considers
    success/outcome rate, budget, and distance.
11. Missing database information must be described as unavailable,
    not guessed.
12. Give a concise, helpful answer in simple language.
13. If the user asks for hospitals, use the search_hospitals tool
    before answering.
14. Mention that recommendations are based on the Vitality database
    when appropriate.
`;



            // --------------------------------------------------
            // GEMINI TOOL
            // --------------------------------------------------

            const tools = [
                {
                    function_declarations: [
                        {
                            name: "search_hospitals",

                            description:
                                "Search the Vitality hospital database using disease, specialty, city, budget and distance.",

                            parameters: {

                                type: "OBJECT",

                                properties: {

                                    disease: {
                                        type: "STRING",
                                        description:
                                            "Disease or medical condition the user needs a hospital for."
                                    },

                                    specialty: {
                                        type: "STRING",
                                        description:
                                            "Medical specialty such as Oncology, Cardiology, Neurology, Orthopedics, etc."
                                    },

                                    city: {
                                        type: "STRING",
                                        description:
                                            "City where the user wants the hospital."
                                    },

                                    maxBudget: {
                                        type: "NUMBER",
                                        description:
                                            "Maximum treatment budget in Indian Rupees."
                                    },

                                    minBudget: {
                                        type: "NUMBER",
                                        description:
                                            "Minimum treatment budget in Indian Rupees, if provided."
                                    },

                                    maxDistance: {
                                        type: "NUMBER",
                                        description:
                                            "Maximum acceptable distance in kilometres, if provided."
                                    }

                                },

                                required: []

                            }

                        }
                    ]
                }
            ];



            // --------------------------------------------------
            // FIRST GEMINI REQUEST
            // --------------------------------------------------

            let contents = [

                {
                    role: "user",

                    parts: [
                        {
                            text: userMessage
                        }
                    ]

                }

            ];


            const firstResponse =
                await callGemini({

                    system_instruction: {
                        parts: [
                            {
                                text:
                                    systemInstruction
                            }
                        ]
                    },

                    contents,

                    tools

                });



            const firstCandidate =
                firstResponse?.candidates?.[0];


            const firstContent =
                firstCandidate?.content;


            const firstParts =
                firstContent?.parts || [];


            const functionCallPart =
                firstParts.find(
                    part =>
                        part.functionCall
                );



            // --------------------------------------------------
            // NO TOOL CALL
            // --------------------------------------------------

            if (!functionCallPart) {

                const text =
                    firstParts
                        .filter(
                            part =>
                                typeof part.text === "string"
                        )
                        .map(
                            part =>
                                part.text
                        )
                        .join("\n")
                        .trim();


                return res.json({

                    reply:
                        text ||
                        "I couldn't generate a response."

                });

            }



            // --------------------------------------------------
            // TOOL CALL
            // --------------------------------------------------

            const functionCall =
                functionCallPart.functionCall;


            console.log(
                "AI hospital search:",
                functionCall
            );


            const toolResult =
                await searchHospitalsForAI(
                    functionCall.args || {}
                );



            // --------------------------------------------------
            // PRESERVE GEMINI MODEL RESPONSE
            // --------------------------------------------------

            contents.push(
                firstContent
            );



            // --------------------------------------------------
            // SEND TOOL RESULT BACK TO GEMINI
            // --------------------------------------------------

            contents.push({

                role: "user",

                parts: [

                    {

                        functionResponse: {

                            name:
                                functionCall.name,

                            response: {

                                hospitals:
                                    toolResult

                            }

                        },

                        ...(functionCallPart.thoughtSignature
                            ? {
                                thoughtSignature:
                                    functionCallPart.thoughtSignature
                            }
                            : {})

                    }

                ]

            });



            // --------------------------------------------------
            // SECOND GEMINI REQUEST
            // --------------------------------------------------

            const finalResponse =
                await callGemini({

                    system_instruction: {

                        parts: [
                            {
                                text:
                                    systemInstruction
                            }
                        ]

                    },

                    contents,

                    tools

                });



            const finalParts =
                finalResponse
                    ?.candidates?.[0]
                    ?.content
                    ?.parts || [];


            const finalText =
                finalParts
                    .filter(
                        part =>
                            typeof part.text === "string"
                    )
                    .map(
                        part =>
                            part.text
                    )
                    .join("\n")
                    .trim();



            return res.json({

                reply:
                    finalText ||
                    "I found the hospital data, but couldn't generate the final response."

            });

        }
        catch (error) {

            console.error(
                "Gemini AI error:",
                error
            );


            return res.status(500).json({

                error:
                    error.message ||
                    "AI assistant failed"

            });

        }

    }
);
// --------------------------------------------------
// MONGODB CONNECTION
// --------------------------------------------------

mongoose

    .connect(
        process.env.MONGO_URI
    )

    .then(() => {

        console.log(
            "MongoDB connected successfully"
        );


        app.listen(

            PORT,

            () => {

                console.log(
                    `Server running on http://localhost:${PORT}`
                );

            }

        );

    })

    .catch(error => {

        console.error(

            "MongoDB connection failed:",

            error.message

        );

    });