
require('dotenv').config();
const mongoose = require('mongoose');
const connectDb = require('../config/connectDB');
const Toilet = require('../models/toilet');

// Use your existing connectDb function instead of hardcoded connection
connectDb();

const sampleToilets = [
  {
    title: "Central Park Toilet",
    location: "Central Park, Nagpur",
    geometry: { type: "Point", coordinates: [79.0882, 21.1458] },
    description: "Clean and free to use",
    price: 0,
    genderAccess: "Unisex",
    isAccessible: true,
    hasSanitaryPadDisposal: true,
    isPaid: false,
    cleanlinessRating: 4,
    images: [{ url: "https://placehold.co/600x400", filename: "seed1" }]
  },
  {
    title: "Railway Station Toilet",
    location: "Nagpur Railway Station",
    geometry: { type: "Point", coordinates: [79.1000, 21.1500] },
    description: "Busy and sometimes crowded",
    price: 5,
    genderAccess: "Male",
    isAccessible: false,
    hasSanitaryPadDisposal: false,
    isPaid: true,
    cleanlinessRating: 3,
    images: [{ url: "https://placehold.co/600x400", filename: "seed2" }]
  },
  {
    title: "Bus Stand Toilet",
    location: "Nagpur Bus Stand",
    geometry: { type: "Point", coordinates: [79.1200, 21.1400] },
    description: "Paid toilet with average facilities",
    price: 2,
    genderAccess: "Female",
    isAccessible: false,
    hasSanitaryPadDisposal: true,
    isPaid: true,
    cleanlinessRating: 2,
    images: [{ url: "https://placehold.co/600x400", filename: "seed3" }]
  }
];

// Add more random toilets
for (let i = 4; i <= 10; i++) {
  sampleToilets.push({
    title: `Toilet #${i}`,
    location: `Area ${i}, Nagpur`,
    geometry: { type: "Point", coordinates: [79.09 + i*0.01, 21.14 + i*0.01] },
    description: "Sample description",
    price: i % 2 === 0 ? 0 : 5,
    genderAccess: ["Male", "Female", "Unisex"][i % 3],
    isAccessible: i % 2 === 0,
    hasSanitaryPadDisposal: i % 3 === 0,
    isPaid: i % 2 !== 0,
    cleanlinessRating: (i % 5) + 1,
    images: [{ url: "https://placehold.co/600x400", filename: `seed${i}` }]
  });
}

const seedDB = async () => {
  try {
    await Toilet.deleteMany({});
    await Toilet.insertMany(sampleToilets);
    console.log("10 toilets seeded!");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await mongoose.connection.close();
  }
}

seedDB().then(() => mongoose.connection.close());
