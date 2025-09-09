// routes/reviews.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // Important for nested routes
const Review = require('../models/review');
const Toilet = require('../models/toilet');
const { isLoggedIn } = require('../middleware');

// POST - Create new review
router.post('/', isLoggedIn, async (req, res) => {
    try {
        const toilet = await Toilet.findById(req.params.id);
        if (!toilet) {
            req.flash('error', 'Toilet not found');
            return res.redirect('/toilets');
        }

        // Check if user already reviewed this toilet
        const existingReview = await Review.findOne({ 
            author: req.user._id, 
            toilet: toilet._id 
        });

        if (existingReview) {
            req.flash('error', 'You have already reviewed this toilet');
            return res.redirect(`/toilets/${toilet._id}`);
        }

        

        const review = new Review({
            body: req.body.review.body,
            rating: parseInt(req.body.review.rating),
            author: req.user._id,
            toilet: toilet._id
        });

        await review.save();
        toilet.reviews.push(review);
        await toilet.save();
        
        // Recalculate average rating
        await toilet.calculateAverageRating();

        req.flash('success', 'Review added successfully!');
        res.redirect(`/toilets/${toilet._id}`);
    } catch (err) {
        req.flash('error', 'Error adding review');
        res.redirect(`/toilets/${req.params.id}`);
    }
});

// PUT - Update existing review
router.put('/:reviewId', isLoggedIn, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        
        if (!review) {
            req.flash('error', 'Review not found');
            return res.redirect(`/toilets/${req.params.id}`);
        }

        // Check if user owns this review
        if (!review.author.equals(req.user._id)) {
            req.flash('error', 'You can only edit your own reviews');
            return res.redirect(`/toilets/${req.params.id}`);
        }

        review.body = req.body.review.body;
        review.rating = parseInt(req.body.review.rating);
        await review.save();

        // Recalculate average rating
        const toilet = await Toilet.findById(req.params.id);
        await toilet.calculateAverageRating();

        req.flash('success', 'Review updated successfully!');
        res.redirect(`/toilets/${req.params.id}`);
    } catch (err) {
        req.flash('error', 'Error updating review');
        res.redirect(`/toilets/${req.params.id}`);
    }
});

// DELETE - Remove review
router.delete('/:reviewId', isLoggedIn, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        
        if (!review) {
            req.flash('error', 'Review not found');
            return res.redirect(`/toilets/${req.params.id}`);
        }

        // Check if user owns this review
        if (!review.author.equals(req.user._id)) {
            req.flash('error', 'You can only delete your own reviews');
            return res.redirect(`/toilets/${req.params.id}`);
        }

        await Review.findByIdAndDelete(req.params.reviewId);
        
        // Remove review from toilet's reviews array
        await Toilet.findByIdAndUpdate(req.params.id, {
            $pull: { reviews: req.params.reviewId }
        });

        // Recalculate average rating
        const toilet = await Toilet.findById(req.params.id);
        await toilet.calculateAverageRating();

        req.flash('success', 'Review deleted successfully!');
        res.redirect(`/toilets/${req.params.id}`);
    } catch (err) {
        req.flash('error', 'Error deleting review');
        res.redirect(`/toilets/${req.params.id}`);
    }
});

module.exports = router;