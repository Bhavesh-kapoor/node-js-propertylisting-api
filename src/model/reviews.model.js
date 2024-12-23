import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email:{
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
    },
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
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
