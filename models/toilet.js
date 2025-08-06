const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }]
});

module.exports = mongoose.model('Toilet', ToiletSchema);
