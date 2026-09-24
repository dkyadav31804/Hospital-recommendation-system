/**
 * api.js
 * Real Backend API Layer
 */

const API_BASE_URL =
    "http://localhost:5000/api";


// --------------------------------------------------
// NORMALIZE HOSPITAL
// --------------------------------------------------

function normalizeHospital(hospital) {

    return {

        ...hospital,

        hospitalId:
            hospital._id ||
            hospital.hospitalId,


        name:
            hospital.name ||
            "Unknown Hospital",


        state:
            hospital.state ||
            "",


        city:
            hospital.city ||
            "",


        address:
            hospital.address ||
            "",


        pincode:
            hospital.pincode ||
            "",


        disease:
            Array.isArray(
                hospital.diseases
            ) &&
            hospital.diseases.length
                ? hospital.diseases[0]
                : "",


        specialization:
            Array.isArray(
                hospital.specialties
            ) &&
            hospital.specialties.length
                ? hospital.specialties[0]
                : "",


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


        // IMPORTANT:
        // Use actual disease-specific
        // treatment data.
        treatments:
            Array.isArray(
                hospital.treatments
            )
                ? hospital.treatments
                : [],


        hospitalType:
            hospital.category ||
            "",


        costMin:
            hospital.cost?.min ??
            null,


        costMax:
            hospital.cost?.max ??
            null,


        distance:
            hospital.distanceKm != null
                ? hospital.distanceKm
                : null,


        outcomeRate:
            hospital.outcomeRate != null
                ? hospital.outcomeRate
                : null,


        outcomeSource:
            hospital.outcomeSource ||
            "",


        outcomeYear:
            hospital.outcomeYear ||
            null,


        outcomeStatus:
            hospital.outcomeStatus ||
            "N/A",


        budgetStatus:
            hospital.budgetStatus ||
            "Unknown",


        recommendationScore:
            hospital.recommendationScore != null
                ? hospital.recommendationScore
                : null,


        location:
            hospital.location ||
            {},


        phone:
            hospital.phone ||
            "",


        website:
            hospital.website ||
            "",


        source:
            hospital.source ||
            "",


        rating:
            hospital.rating != null
                ? hospital.rating
                : null,


        facilities:
            Array.isArray(
                hospital.facilities
            )
                ? hospital.facilities
                : [],


        image:
            hospital.image ||
            "assets/images/hospital-1.svg"

    };
}


// --------------------------------------------------
// GET ALL HOSPITALS
// --------------------------------------------------

export async function getAllHospitals() {

    const response =
        await fetch(
            `${API_BASE_URL}/hospitals`
        );


    if (!response.ok) {

        throw new Error(
            "Failed to load hospitals"
        );

    }


    const hospitals =
        await response.json();


    return hospitals.map(
        normalizeHospital
    );
}


// --------------------------------------------------
// SEARCH / RECOMMEND HOSPITALS
// --------------------------------------------------

export async function searchHospitals(
    filters = {}
) {

    const params =
        new URLSearchParams();


    // ------------------------------------------
    // DISEASE
    // ------------------------------------------

    if (filters.disease) {

        params.set(
            "disease",
            filters.disease
        );

    }


    // ------------------------------------------
    // SPECIALIZATION
    // ------------------------------------------
    //
    // app.js uses:
    // specialization
    //
    // backend expects:
    // specialty
    // ------------------------------------------

    if (filters.specialization) {

        params.set(
            "specialty",
            filters.specialization
        );

    }


    // ------------------------------------------
    // CITY
    // ------------------------------------------

    if (filters.city) {

        params.set(
            "city",
            filters.city
        );

    }


    // ------------------------------------------
    // MINIMUM BUDGET
    // ------------------------------------------

    if (
        filters.minBudget !== undefined &&
        filters.minBudget !== null &&
        filters.minBudget !== ""
    ) {

        params.set(
            "minBudget",
            filters.minBudget
        );

    }


    // ------------------------------------------
    // MAXIMUM BUDGET
    // ------------------------------------------

    if (
        filters.maxBudget !== undefined &&
        filters.maxBudget !== null &&
        filters.maxBudget !== ""
    ) {

        params.set(
            "maxBudget",
            filters.maxBudget
        );

    }


    // ------------------------------------------
    // BACKWARD COMPATIBILITY
    // ------------------------------------------

    if (
        !filters.minBudget &&
        !filters.maxBudget &&
        filters.budget !== undefined &&
        filters.budget !== null &&
        filters.budget !== ""
    ) {

        params.set(
            "budget",
            filters.budget
        );

    }


    // ------------------------------------------
    // MAX DISTANCE
    // ------------------------------------------

    if (
        filters.maxDistance !== undefined &&
        filters.maxDistance !== null &&
        filters.maxDistance !== ""
    ) {

        params.set(
            "maxDistance",
            filters.maxDistance
        );

    }


    // ------------------------------------------
    // OUTCOME AVAILABLE ONLY
    // ------------------------------------------

    if (
        filters.outcomeAvailableOnly
    ) {

        params.set(
            "outcomeAvailableOnly",
            "true"
        );

    }


    // ------------------------------------------
    // HOSPITAL TYPE
    // ------------------------------------------

    if (filters.hospitalType) {

        params.set(
            "hospitalType",
            filters.hospitalType
        );

    }


    // ------------------------------------------
    // FACILITIES
    // ------------------------------------------

    if (
        Array.isArray(
            filters.facilities
        ) &&
        filters.facilities.length > 0
    ) {

        params.set(
            "facilities",
            filters.facilities.join(",")
        );

    }


    // ------------------------------------------
    // MINIMUM RATING
    // ------------------------------------------

    if (
        filters.minRating !== undefined &&
        filters.minRating !== null &&
        filters.minRating !== ""
    ) {

        params.set(
            "minRating",
            filters.minRating
        );

    }


    // ------------------------------------------
    // USER LATITUDE
    // ------------------------------------------

    if (
        filters.latitude !== undefined &&
        filters.latitude !== null &&
        filters.latitude !== ""
    ) {

        params.set(
            "userLat",
            filters.latitude
        );

    }


    // ------------------------------------------
    // USER LONGITUDE
    // ------------------------------------------

    if (
        filters.longitude !== undefined &&
        filters.longitude !== null &&
        filters.longitude !== ""
    ) {

        params.set(
            "userLng",
            filters.longitude
        );

    }


    // ------------------------------------------
    // SORTING
    // ------------------------------------------

    const sortMap = {

        recommended:
            "recommended",

        nearest:
            "distance",

        distance:
            "distance",

        cost:
            "cost",

        outcome:
            "outcome",

        rating:
            "recommended"

    };


    params.set(

        "sortBy",

        sortMap[
            filters.sortBy
        ] || "recommended"

    );


    // ------------------------------------------
    // BACKEND REQUEST
    // ------------------------------------------

    const response =
        await fetch(

            `${API_BASE_URL}/hospitals/recommend?${params.toString()}`

        );


    if (!response.ok) {

        throw new Error(
            "Hospital search failed"
        );

    }


    const hospitals =
        await response.json();


    return hospitals.map(
        normalizeHospital
    );
}


// --------------------------------------------------
// GET SINGLE HOSPITAL
// --------------------------------------------------

export async function getHospitalById(
    hospitalId
) {

    const response =
        await fetch(

            `${API_BASE_URL}/hospitals/${encodeURIComponent(
                hospitalId
            )}`

        );


    if (response.status === 404) {

        return null;

    }


    if (!response.ok) {

        throw new Error(
            "Failed to load hospital"
        );

    }


    const hospital =
        await response.json();


    return normalizeHospital(
        hospital
    );
}


// --------------------------------------------------
// GET HOSPITALS BY IDS
// --------------------------------------------------

export async function getHospitalsByIds(
    ids
) {

    const hospitals =
        await getAllHospitals();


    return hospitals.filter(
        hospital =>
            ids.includes(
                hospital.hospitalId
            )
    );
}


// --------------------------------------------------
// GET SPECIALTIES
// --------------------------------------------------

export async function getSpecialties() {

    const hospitals =
        await getAllHospitals();


    return [

        ...new Set(

            hospitals
                .flatMap(
                    hospital =>

                        Array.isArray(
                            hospital.specialties
                        )
                            ? hospital.specialties
                            : []
                )

                .filter(Boolean)

        )

    ].sort();
}


// --------------------------------------------------
// GET CITY SUGGESTIONS
// --------------------------------------------------

export async function getCitySuggestions() {

    const hospitals =
        await getAllHospitals();


    return [

        ...new Set(

            hospitals

                .map(
                    hospital =>
                        hospital.city
                )

                .filter(Boolean)

        )

    ].sort();
}