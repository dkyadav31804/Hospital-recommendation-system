const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
    // Basic hospital information
    name: {
        type: String,
        required: true
    },

    state: String,

    city: String,

    address: String,

    pincode: String,

    category: String,

    // Medical specialties
    specialties: [String],

    // Diseases / conditions treated by the hospital
    diseases: [String],

    // Disease-specific treatment information
    treatments: [
        {
            disease: String,

            patientsTreated: Number,

            successRate: {
                type: Number,
                min: 0,
                max: 100
            },

            averageCost: Number,

            source: String,

            year: Number
        }
    ],

    // Estimated treatment cost
    cost: {
        min: Number,
        max: Number,
        currency: {
            type: String,
            default: "INR"
        }
    },

    // Treatment outcome / success information
    outcomeRate: {
        type: Number,
        min: 0,
        max: 100
    },

    outcomeSource: String,

    outcomeYear: Number,

    // Location coordinates for distance calculation
    location: {
        latitude: Number,
        longitude: Number
    },

    // Contact information
    phone: String,

    website: String,

    // Data source
    source: String
});

module.exports = mongoose.model("Hospital", hospitalSchema);