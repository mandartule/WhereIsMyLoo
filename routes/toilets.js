// routes/toilets.js
const express = require('express');
const router = express.Router();
const Toilet = require('../models/toilet');

// GET all toilets
router.get('/', async (req, res) => {
    const toilets = await Toilet.find({});
    console.log(toilets);
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


// Show single toilet
router.get('/:id', async (req, res) => {
    const toilet = await Toilet.findById(req.params.id);
    console.log("Toilet details:", toilet);
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
