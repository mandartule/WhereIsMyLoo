// routes/toilets.js
const express = require('express');
const router = express.Router();
const Toilet = require('../models/toilet');
const { Types } = require('mongoose');
const { isLoggedIn, isAuthor } = require('../middleware');
const axios = require('axios');
const multer = require('multer')
const { storage, cloudinary } = require('../cloudinary')
const upload = multer({ storage })

// Update your toilets.js GET route to pass location info to template
router.get('/', async (req, res) => {
  const { paid, minRating, location } = req.query;
  let filter = {};

  // Apply paid filter
  if (paid === "true") filter.isPaid = true;
  if (paid === "false") filter.isPaid = false;

  // Apply rating filter
  if (minRating && !isNaN(minRating)) {
    filter.cleanlinessRating = { $gte: parseInt(minRating) };
  }

  let toilets = await Toilet.find(filter);
  let searchedCity = null;

  // IMPROVED location search
  if (location && location.trim() !== '') {
    try {
      // More flexible geocoding - removed restrictive types
      const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?country=IN&proximity=79.0882,21.1458&limit=1&access_token=${process.env.MAPBOX_TOKEN}`;
      
      const geoResponse = await axios.get(geocodeUrl);
      
      if (geoResponse.data.features && geoResponse.data.features.length > 0) {
        const cityCenter = geoResponse.data.features[0].center; // [lng, lat]
        const cityName = geoResponse.data.features[0].place_name;
        
        // Extract just city name (before comma)
        searchedCity = cityName.split(',')[0];
        
        // Calculate distances and filter by proximity (100km radius - increased)
        toilets = toilets.filter(toilet => {
          if (toilet.geometry && toilet.geometry.coordinates) {
            const distance = calculateDistance(
              cityCenter[1], cityCenter[0], // lat, lng of city
              toilet.geometry.coordinates[1], toilet.geometry.coordinates[0] // lat, lng of toilet
            );
            toilet.distance = Math.round(distance * 100) / 100; // Round to 2 decimal places
            return distance <= 100; // Increased from 50km to 100km
          }
          return false;
        }).sort((a, b) => a.distance - b.distance);

        // Set flash messages based on results
        if (toilets.length > 0) {
          req.flash('success', `Found ${toilets.length} toilet${toilets.length > 1 ? 's' : ''} in ${searchedCity}`);
        } else {
          req.flash('error', `No toilets found within 100km of ${searchedCity}. Try a broader search or add the first toilet in this area.`);
        }
      } else {
        req.flash('error', 'Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      req.flash('error', 'Could not search for that location. Please try again.');
    }
  }

  // Don't show flash messages for normal browsing
  let successMessage = null;
  let errorMessage = null;
  
  if (location) {
    successMessage = req.flash('success');
    errorMessage = req.flash('error');
  }

  res.render('toilets/index', { 
    toilets, 
    paid, 
    minRating, 
    location,
    searchedCity,
    success: successMessage,
    error: errorMessage
  });
});


// Distance calculation helper function
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
  res.render('toilets/show', {
    toilet,
    searchedCity: null
  });
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
