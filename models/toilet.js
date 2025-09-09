const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');

const ImageSchema = new Schema({
    url: String,
    filename: String
});

// Schema for toilets
const ToiletSchema = new Schema({
    title: String,
    location: String,

    geometry: {
        type: {
            type: String,
            enum: ['Point'], // GeoJSON Point
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },

    description: String,
    price: Number, // if any entry fee or maintenance charge

    genderAccess: {
        type: String,
        enum: ['Male', 'Female', 'Unisex'],
        required: true
    },

    isAccessible: {
        type: Boolean,
        default: false // for wheelchair accessibility
    },

    hasSanitaryPadDisposal: {
        type: Boolean,
        default: false
    },

    isPaid: {
        type: Boolean,
        default: false
    },

    cleanlinessRating: {
        type: Number,
        min: 1,
        max: 5
    },

    images: [ImageSchema],

    datePosted: {
        type: Date,
        default: Date.now
    },

    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],

    averageRating: {
        type: Number,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    }



});

//average rating calculations 

ToiletSchema.methods.calculateAverageRating = async function() {
    const reviews = await Review.find({ toilet: this._id });
    if (reviews.length === 0) {
        this.averageRating = 0;
        this.reviewCount = 0;
    } else {
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        this.averageRating = Math.round((total / reviews.length) * 10) / 10; // Round to 1 decimal
        this.reviewCount = reviews.length;
    }
    await this.save();
};

module.exports = mongoose.model('Toilet', ToiletSchema);
