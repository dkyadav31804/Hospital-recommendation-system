/**
 * mock-data.js
 * ------------------------------------------------------------------
 * DEMO DATA — Replace with verified backend data.
 *
 * This file holds hand-written sample hospital records so the frontend
 * has something realistic to render before a backend exists. Nothing
 * here is real medical or facility information.
 *
 * outcomeRate / outcomeSource / outcomeYear are intentionally `null`
 * for hospitals with no verified figure — the UI must show
 * "Outcome data unavailable" rather than inventing a number.
 *
 * The UI layer never imports this file directly; it only goes through
 * js/api.js, so swapping this module for a real network call later
 * does not require touching any rendering code.
 * ------------------------------------------------------------------
 */

export const MOCK_HOSPITALS = [
  {
    hospitalId: "H001",
    name: "Sundar Heart Institute",
    city: "Jalandhar",
    state: "Punjab",
    address: "Demo address, Civil Lines, Jalandhar",
    specialization: "Cardiology",
    disease: "Heart Disease",
    treatments: ["Angioplasty", "Bypass Surgery", "Cardiac Rehabilitation"],
    hospitalType: "Multi-specialty",
    costMin: 40000,
    costMax: 70000,
    outcomeRate: null,
    outcomeSource: null,
    outcomeYear: null,
    rating: 4.3,
    distance: 12.4,
    latitude: 31.326,
    longitude: 75.576,
    facilities: ["24/7 Emergency", "ICU", "Cath Lab", "Ambulance", "Pharmacy"],
    doctors: [
      { name: "Dr. Demo Arora", specialty: "Interventional Cardiologist", experience: "14 yrs (demo)" },
      { name: "Dr. Demo Kapoor", specialty: "Cardiac Surgeon", experience: "9 yrs (demo)" }
    ],
    contact: { phone: "+91 98000 00001", email: "care@demo-sundarheart.example" },
    hours: "Open 24 hours",
    image: "assets/images/hospital-1.svg"
  },
  {
    hospitalId: "H002",
    name: "Greenfield Orthopedic Centre",
    city: "Jalandhar",
    state: "Punjab",
    address: "Demo address, Model Town, Jalandhar",
    specialization: "Orthopedics",
    disease: "Joint & Bone Conditions",
    treatments: ["Knee Replacement", "Hip Replacement", "Sports Injury Care"],
    hospitalType: "Specialty",
    costMin: 90000,
    costMax: 160000,
    outcomeRate: 92,
    outcomeSource: "Hospital-reported registry (demo)",
    outcomeYear: 2024,
    rating: 4.6,
    distance: 6.1,
    latitude: 31.322,
    longitude: 75.582,
    facilities: ["ICU", "Physiotherapy Unit", "Diagnostic Lab", "Wheelchair Access"],
    doctors: [
      { name: "Dr. Demo Sethi", specialty: "Orthopedic Surgeon", experience: "18 yrs (demo)" }
    ],
    contact: { phone: "+91 98000 00002", email: "care@demo-greenfield.example" },
    hours: "8:00 AM – 9:00 PM",
    image: "assets/images/hospital-2.svg"
  },
  {
    hospitalId: "H003",
    name: "Lakeside Cardiac Care",
    city: "Ludhiana",
    state: "Punjab",
    address: "Demo address, Sarabha Nagar, Ludhiana",
    specialization: "Cardiology",
    disease: "Heart Disease",
    treatments: ["Angioplasty", "Pacemaker Implant", "Preventive Cardiology"],
    hospitalType: "Multi-specialty",
    costMin: 35000,
    costMax: 62000,
    outcomeRate: 88,
    outcomeSource: "State health survey (demo)",
    outcomeYear: 2023,
    rating: 4.1,
    distance: 41.8,
    latitude: 30.901,
    longitude: 75.857,
    facilities: ["24/7 Emergency", "ICU", "Cath Lab", "Blood Bank"],
    doctors: [
      { name: "Dr. Demo Bhatia", specialty: "Cardiologist", experience: "11 yrs (demo)" }
    ],
    contact: { phone: "+91 98000 00003", email: "care@demo-lakeside.example" },
    hours: "Open 24 hours",
    image: "assets/images/hospital-3.svg"
  },
  {
    hospitalId: "H004",
    name: "Nirvana Cancer Centre",
    city: "Chandigarh",
    state: "Chandigarh",
    address: "Demo address, Sector 34, Chandigarh",
    specialization: "Oncology",
    disease: "Cancer",
    treatments: ["Chemotherapy", "Radiation Therapy", "Surgical Oncology"],
    hospitalType: "Specialty",
    costMin: 150000,
    costMax: 400000,
    outcomeRate: null,
    outcomeSource: null,
    outcomeYear: null,
    rating: 4.5,
    distance: 108.3,
    latitude: 30.733,
    longitude: 76.779,
    facilities: ["ICU", "Radiation Unit", "Blood Bank", "Counselling Services"],
    doctors: [
      { name: "Dr. Demo Chawla", specialty: "Medical Oncologist", experience: "16 yrs (demo)" },
      { name: "Dr. Demo Grewal", specialty: "Radiation Oncologist", experience: "10 yrs (demo)" }
    ],
    contact: { phone: "+91 98000 00004", email: "care@demo-nirvana.example" },
    hours: "8:00 AM – 8:00 PM",
    image: "assets/images/hospital-4.svg"
  },
  {
    hospitalId: "H005",
    name: "Riverside Mother & Child Hospital",
    city: "Jalandhar",
    state: "Punjab",
    address: "Demo address, Urban Estate, Jalandhar",
    specialization: "Gynecology",
    disease: "Maternity & Women's Health",
    treatments: ["Normal Delivery", "C-Section", "Prenatal Care"],
    hospitalType: "Specialty",
    costMin: 25000,
    costMax: 55000,
    outcomeRate: 96,
    outcomeSource: "Hospital-reported registry (demo)",
    outcomeYear: 2024,
    rating: 4.7,
    distance: 3.9,
    latitude: 31.318,
    longitude: 75.573,
    facilities: ["NICU", "24/7 Emergency", "Ambulance", "Pharmacy"],
    doctors: [
      { name: "Dr. Demo Nair", specialty: "Obstetrician", experience: "13 yrs (demo)" }
    ],
    contact: { phone: "+91 98000 00005", email: "care@demo-riverside.example" },
    hours: "Open 24 hours",
    image: "assets/images/hospital-5.svg"
  },
  {
    hospitalId: "H006",
    name: "Metro Neuro Sciences Hospital",
    city: "Ludhiana",
    state: "Punjab",
    address: "Demo address, Ferozepur Road, Ludhiana",
    specialization: "Neurology",
    disease: "Neurological Disorders",
    treatments: ["Stroke Care", "Epilepsy Management", "Spine Surgery"],
    hospitalType: "Multi-specialty",
    costMin: 60000,
    costMax: 220000,
    outcomeRate: null,
    outcomeSource: null,
    outcomeYear: null,
    rating: 3.9,
    distance: 39.2,
    latitude: 30.911,
    longitude: 75.851,
    facilities: ["ICU", "24/7 Emergency", "Diagnostic Lab", "Rehabilitation Unit"],
    doctors: [
      { name: "Dr. Demo Malhotra", specialty: "Neurologist", experience: "20 yrs (demo)" }
    ],
    contact: { phone: "+91 98000 00006", email: "care@demo-metroneuro.example" },
    hours: "Open 24 hours",
    image: "assets/images/hospital-6.svg"
  },
  {
    hospitalId: "H007",
    name: "Sunrise General Hospital",
    city: "Amritsar",
    state: "Punjab",
    address: "Demo address, Ranjit Avenue, Amritsar",
    specialization: "General Medicine",
    disease: "General & Preventive Care",
    treatments: ["Health Checkups", "Diabetes Management", "Minor Surgery"],
    hospitalType: "General",
    costMin: 8000,
    costMax: 25000,
    outcomeRate: null,
    outcomeSource: null,
    outcomeYear: null,
    rating: 4.0,
    distance: 78.6,
    latitude: 31.634,
    longitude: 74.872,
    facilities: ["24/7 Emergency", "Diagnostic Lab", "Pharmacy", "Wheelchair Access"],
    doctors: [
      { name: "Dr. Demo Gill", specialty: "General Physician", experience: "8 yrs (demo)" }
    ],
    contact: { phone: "+91 98000 00007", email: "care@demo-sunrise.example" },
    hours: "7:00 AM – 11:00 PM",
    image: "assets/images/hospital-7.svg"
  },
  {
    hospitalId: "H008",
    name: "Crescent Kidney & Urology Institute",
    city: "Jalandhar",
    state: "Punjab",
    address: "Demo address, GT Road, Jalandhar",
    specialization: "Nephrology",
    disease: "Kidney Disease",
    treatments: ["Dialysis", "Kidney Transplant", "Stone Removal"],
    hospitalType: "Specialty",
    costMin: 45000,
    costMax: 500000,
    outcomeRate: 84,
    outcomeSource: "State health survey (demo)",
    outcomeYear: 2022,
    rating: 4.2,
    distance: 9.7,
    latitude: 31.334,
    longitude: 75.579,
    facilities: ["Dialysis Unit", "ICU", "24/7 Emergency", "Blood Bank"],
    doctors: [
      { name: "Dr. Demo Chopra", specialty: "Nephrologist", experience: "15 yrs (demo)" }
    ],
    contact: { phone: "+91 98000 00008", email: "care@demo-crescent.example" },
    hours: "Open 24 hours",
    image: "assets/images/hospital-8.svg"
  }
];

/** Specialties derived from the demo records, used to populate selects. */
export const SPECIALTIES = [...new Set(MOCK_HOSPITALS.map(h => h.specialization))].sort();

/** Cities derived from the demo records — these are the only cities that will actually return a match against the current mock dataset. */
export const CITIES = [...new Set(MOCK_HOSPITALS.map(h => h.city))].sort();

/**
 * Broad list of major Indian cities used only as autocomplete
 * *suggestions* for the city field, so the person isn't limited to
 * typing one of the ~8 cities that happen to be in the demo dataset.
 * This is NOT a filter allowlist — the city field is free text, and
 * once a real backend is connected any city it returns will work.
 * Kept short and representative rather than exhaustive.
 */
export const INDIA_CITIES = [
  "Delhi", "Mumbai", "Pune", "Bengaluru", "Hyderabad", "Chennai", "Kolkata",
  "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Amritsar", "Jalandhar",
  "Ludhiana", "Surat", "Nagpur", "Indore", "Bhopal", "Patna", "Kochi",
  "Coimbatore", "Visakhapatnam", "Vadodara", "Agra", "Varanasi", "Guwahati",
  "Ranchi", "Raipur", "Dehradun", "Noida", "Gurugram"
];

/**
 * Very small keyword → specialty lookup table used by the mock AI
 * assistant (js/ai-assistant.js) to turn free text into a specialty.
 * This is NOT a diagnostic tool — see ai-assistant.js for the
 * disclaimers that must ship alongside any use of this table.
 */
export const SYMPTOM_TO_SPECIALTY = [
  { keywords: ["heart", "chest pain", "cardiac", "blood pressure", "palpitation"], specialty: "Cardiology" },
  { keywords: ["knee", "joint", "bone", "fracture", "hip", "back pain"], specialty: "Orthopedics" },
  { keywords: ["cancer", "tumor", "tumour", "oncology", "chemo"], specialty: "Oncology" },
  { keywords: ["pregnan", "delivery", "maternity", "gynec", "women"], specialty: "Gynecology" },
  { keywords: ["brain", "nerve", "seizure", "stroke", "spine", "headache"], specialty: "Neurology" },
  { keywords: ["kidney", "dialysis", "urine", "urolog"], specialty: "Nephrology" },
  { keywords: ["fever", "checkup", "general", "diabetes", "cold", "cough"], specialty: "General Medicine" }
];
