// models/review.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
    body: {
        type: String,
        required: true,
        maxLength: 500
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toilet: {
        type: Schema.Types.ObjectId,
        ref: 'Toilet',
        required: true
    },
    datePosted: {
        type: Date,
        default: Date.now
    }
});

// Prevent duplicate reviews from same user for same toilet
ReviewSchema.index({ author: 1, toilet: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);