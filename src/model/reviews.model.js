import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    photographerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Photographer',
        required: true,
        index: true
    },
    stars: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String
    }
}, {
    timestamps: true
});

export const Review = mongoose.model('Review', reviewSchema);
