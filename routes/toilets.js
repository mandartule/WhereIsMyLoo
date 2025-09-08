// routes/toilets.js
const express = require('express');
const router = express.Router();
const Toilet = require('../models/toilet');
const { Types } = require('mongoose');
const { isLoggedIn, isAuthor } = require('../middleware');

router.get('/api', async (req, res) => {
    try {
      const { paid, minRating } = req.query;
      let filter = {};
  
      // Apply paid filter if user selected it
      if (paid === "true") filter.isPaid = true;
      if (paid === "false") filter.isPaid = false;
  
      // Apply rating filter if user selected it
      if (minRating && !isNaN(minRating)) {
        filter.cleanlinessRating = { $gte: parseInt(minRating) };
      }
  
      // Fetch toilets from DB
      const toilets = await Toilet.find(filter);
  
      // Send JSON response
      res.json(toilets);

      //res.render('toilets/index', { toilets, paid, minRating }); 
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  


// GET all toilets
router.get('/', async (req, res) => {
    const { paid, minRating } = req.query;
    let filter = {};
  
    if (paid === "true") filter.isPaid = true;
    if (paid === "false") filter.isPaid = false;
  
    if (minRating && !isNaN(minRating)) {
      filter.cleanlinessRating = { $gte: parseInt(minRating) };
    }
  
    const toilets = await Toilet.find(filter);
    res.render('toilets/index', { toilets, paid, minRating }); // <-- rendering HTML
  });
  
  
// Show form to create new toilet
router.get('/new', isLoggedIn, (req, res) => {
    res.render('toilets/new');
    console.log("New toilet form");
});

// POST new toilet
router.post('/new', isLoggedIn, async (req, res) => {
  try {
    console.log("Incoming toilet data:", req.body);

    const toilet = new Toilet(req.body.toilet);

    // attach author only if logged in
    if (req.user) {
      toilet.author = req.user._id;
    }

    await toilet.save();
    console.log("Toilet created:", toilet);
    res.redirect(`/toilets/${toilet._id}`);
  } catch (err) {
    console.error("Error creating toilet:", err);
    res.status(500).json({ error: err.message });
  }
});

// Show page - details for one toilet
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const toilet = await Toilet.findById(id);
    if (!toilet) {
      req.flash('error', 'Toilet not found');
      return res.redirect('/toilets');
    }
    res.render('toilets/show', { toilet });
  });
  

// Edit form
router.get('/:id/edit', async (req, res) => {
    const toilet = await Toilet.findById(req.params.id);
    if (!toilet) {
      req.flash('error', 'Toilet not found');
      return res.redirect('/toilets');
    }
    res.render('toilets/edit', { toilet });
    console.log("Edit toilet form for:", toilet);
});

// PUT update toilet
router.put('/:id', isLoggedIn, isAuthor, async (req, res) => {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
        req.flash('error', 'Invalid toilet ID!');
        return res.redirect('/toilets');
    }

    const toilet = await Toilet.findByIdAndUpdate(id, { ...req.body.toilet }, { new: true, runValidators: true });
    req.flash('success', 'Successfully updated toilet');
    res.redirect(`/toilets/${toilet._id}`);
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
