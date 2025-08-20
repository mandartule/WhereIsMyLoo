// routes/toilets.js
const express = require('express');
const router = express.Router();
const Toilet = require('../models/toilet');

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
router.get('/new', (req, res) => {
    console.log("New toilet form");
});

// POST new toilet
router.post('/', async (req, res) => {
    const toilet = new Toilet(req.body.toilet);
    await toilet.save();
    console.log("Toilet created:", toilet);
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
    console.log("Edit toilet form for:", toilet);
});

// PUT update toilet
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    await Toilet.findByIdAndUpdate(id, req.body.toilet);
    console.log("Toilet updated:", { id, ...req.body.toilet });
});

// DELETE toilet
router.delete('/:id', async (req, res) => {
    await Toilet.findByIdAndDelete(req.params.id);
    console.log("Toilet deleted:", req.params.id);
});

module.exports = router;
