import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    fullAddress: {
        type: String,
        required: [true, 'fullAddress is required'],
        trim: true,
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,

    },
    pinCode: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true,

    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
    },
    coordinates: {
        latitude: {
            type: Number,
            min: -90,
            max: 90
        },
        longitude: {
            type: Number,
            min: -180,
            max: 180
        }
    }
}, { _id: false });
const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Property title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Property description is required'],
        trim: true,
    },
    address: addressSchema,
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    propertyType: {
        type: String,
        required: [true, 'Property type is required'],
        enum: ['House', 'Apartment', 'Condo', 'Villa', 'Land']
    },
    status: {
        type: String,
        enum: ['For Sale', 'For Rent', 'Sold', 'Rented'],
        default: 'For Sale'
    },
    features: [{
        type: String,
        trim: true
    }],
    specifications: {
        bedrooms: {
            type: Number,
            min: 0
        },
        area: {
            type: Number,
            required: [true, 'Area is required'],
            min: 0
        },
        landArea: {
            type: Number,
            required: [true, 'Land area is required'],
        }
    },
    images: [String],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, {
    timestamps: true,
});

export const Property = mongoose.model('Property', propertySchema);