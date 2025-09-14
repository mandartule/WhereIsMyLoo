// routes/toilets.js
const express = require('express');
const router = express.Router();
const Toilet = require('../models/toilet');
const { Types } = require('mongoose');
const { isLoggedIn, isAuthor } = require('../middleware');
const axios = require('axios');
const multer = require('multer')
const { storage , cloudinary} = require('../cloudinary')
const upload = multer({ storage })

// GET all toilets
router.get('/', async (req, res) => {
  const { paid, minRating, location } = req.query;
  let filter = {};

  if (paid === "true") filter.isPaid = true;
  if (paid === "false") filter.isPaid = false;

  if (minRating && !isNaN(minRating)) {
    filter.cleanlinessRating = { $gte: parseInt(minRating) };
  }

  let toilets = await Toilet.find(filter);

  // If location search is provided, calculate distances and sort
  if (location) {
    try {
      // Enhanced geocoding with better place types
      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?country=IN&types=poi,place,address,neighborhood&proximity=79.0882,21.1458&access_token=${process.env.MAPBOX_TOKEN}`;
      const geoResponse = await axios.get(geocodeUrl);

      if (geoResponse.data.features && geoResponse.data.features.length > 0) {
        const searchCoords = geoResponse.data.features[0].center; // [lng, lat]

        // Calculate distance for each toilet and add distance field
        toilets = toilets.map(toilet => {
          const distance = calculateDistance(
            searchCoords[1], searchCoords[0], // search lat, lng
            toilet.geometry.coordinates[1], toilet.geometry.coordinates[0] // toilet lat, lng
          );
          return {
            ...toilet.toObject(),
            distance: Math.round(distance * 10) / 10 // Round to 1 decimal
          };
        });

        // Filter toilets within 1km radius
        toilets = toilets.filter(toilet => toilet.distance <= 100.0);

        // Sort by distance (closest first)
        toilets.sort((a, b) => a.distance - b.distance);
      }
    } catch (err) {
      console.error('Error geocoding location:', err);
      req.flash('error', 'Could not find the specified location');
    }
  }

  res.render('toilets/index', { toilets, paid, minRating, location });
});

// helper function for calculating distance (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}


// Show form to create new toilet
router.get('/new', isLoggedIn, (req, res) => {
  res.render('toilets/new');
  console.log("New toilet form");
});

// POST new toilet
router.post('/new', isLoggedIn, upload.array('image'), async (req, res) => {
  try {
    console.log("Incoming toilet data:", req.body);

    const address = req.body.toilet.location;
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.MAPBOX_TOKEN}`;

    const geoResponse = await axios.get(geocodeUrl);

    if (!geoResponse.data.features || geoResponse.data.features.length === 0) {
      req.flash('error', 'Could not find location. Please enter a more specific address.');
      return res.redirect('/toilets/new');
    }

    // Get coordinates from Mapbox response
    const coordinates = geoResponse.data.features[0].center; // [lng, lat]

    const toilet = new Toilet(req.body.toilet);

    // Set the geometry with geocoded coordinates
    toilet.geometry = {
      type: "Point",
      coordinates: coordinates
    };

    toilet.author = req.user._id;
    toilet.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    await toilet.save();
    console.log("Toilet created:", toilet);
    req.flash('success', 'Toilet added successfully!');
    res.redirect(`/toilets/${toilet._id}`);
  } catch (err) {
    console.error("Error creating toilet:", err);
    req.flash('error', 'Error creating toilet. Please try again.');
    res.redirect('/toilets/new');
  }
});

// Show page - details for one toilet
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const toilet = await Toilet.findById(id)
    .populate('author')
    .populate({
      path: 'reviews',
      populate: {
        path: 'author'
      }
    });

  if (!toilet) {
    req.flash('error', 'Toilet not found');
    return res.redirect('/toilets');
  }
  res.render('toilets/show', { toilet });
});


// Edit form
router.get('/:id/edit', isLoggedIn, isAuthor, async (req, res) => {
  const toilet = await Toilet.findById(req.params.id);
  if (!toilet) {
    req.flash('error', 'Toilet not found');
    return res.redirect('/toilets');
  }
  res.render('toilets/edit', { toilet });
});

// PUT update toilet
router.put('/:id', isLoggedIn, isAuthor, upload.array('image'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      req.flash('error', 'Invalid toilet ID!');
      return res.redirect('/toilets');
    }

    // Geocode new address
    const address = req.body.toilet.location;
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.MAPBOX_TOKEN}`;
    const geoResponse = await axios.get(geocodeUrl);

    if (!geoResponse.data.features || geoResponse.data.features.length === 0) {
      req.flash('error', 'Could not find location. Please enter a more specific address.');
      return res.redirect('/toilets/new');
    }

    const coordinates = geoResponse.data.features[0].center; // [lng, lat]

    // Find toilet
    const toilet = await Toilet.findById(id);
    if (!toilet) {
      req.flash('error', 'Toilet not found!');
      return res.redirect('/toilets');
    }

    // Update fields
    toilet.set({
      ...req.body.toilet,
      geometry: { type: "Point", coordinates }
    });

    // Delete selected images
    if (req.body.deleteImages) {
      // Ensure deleteImages is always an array
      const deleteImages = Array.isArray(req.body.deleteImages) ? req.body.deleteImages : [req.body.deleteImages];
      for (let filename of deleteImages) {
        await cloudinary.uploader.destroy(filename); 
      }
      toilet.images = toilet.images.filter(img => !deleteImages.includes(img.filename));
    }

    
    // Add new images
    if (req.files && req.files.length > 0) {
      const images = req.files.map(f => ({ url: f.path, filename: f.filename }));
      toilet.images.push(...images);
    }

    await toilet.save();
    req.flash('success', 'Successfully updated toilet');
    res.redirect(`/toilets/${toilet._id}`);
  } catch (err) {
    console.error("Error updating toilet:", err);
    req.flash('error', 'Error updating toilet');
    res.redirect('/toilets');
  }
});



// DELETE toilet
router.delete('/:id', isLoggedIn, isAuthor, async (req, res) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) {
    req.flash('error', 'Invalid toilet ID!');
    return res.redirect('/toilets');
  }

  await Toilet.findByIdAndDelete(id)
  req.flash('success', 'Successfully deleted toilet')
  res.redirect('/toilets')
});

module.exports = router;
