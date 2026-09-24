const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: __dirname + "/.env" });

const Hospital = require("./models/Hospital");

async function importHospitals() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");

        // Read JSON file
       const filePath = path.join(
    __dirname,
    "..",
    "data",
    "clean_hospitals_enriched.json"
);

        const fileData = fs.readFileSync(filePath, "utf8");
        const hospitals = JSON.parse(fileData);

        // Check data
        if (!Array.isArray(hospitals)) {
            throw new Error("clean_hospitals.json does not contain an array");
        }

        console.log(`JSON records found: ${hospitals.length}`);

        // Remove old demo hospitals
        await Hospital.deleteMany({});

        console.log("Old hospital records removed");

        // Import all hospitals
        const result = await Hospital.insertMany(hospitals, {
            ordered: false
        });

        console.log(`Successfully imported: ${result.length} hospitals`);

        await mongoose.connection.close();

        console.log("MongoDB connection closed");
    } catch (error) {
        console.error("Import failed:", error.message);

        await mongoose.connection.close();

        process.exit(1);
    }
}

importHospitals();