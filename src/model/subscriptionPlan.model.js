import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Plan name is required'],
        trim: true,
    },
    title: {
        type: String,
        required: [true, 'Plan title is required'],
        trim: true,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String,
        required: [true, 'Plan description is required'],
        trim: true,
    },
    price: {
        Monthly: {
            type: Number,
            required: [true, 'Monthly price is required'],
            min: [0, 'Price cannot be negative'],
        },
        Quarterly: {
            type: Number,
            required: [true, 'Quarterly price is required'],
            min: [0, 'Price cannot be negative'],
        },
        Yearly: {
            type: Number,
            required: [true, 'Yearly price is required'],
            min: [0, 'Price cannot be negative'],
        },
    },
    maxProperties: {
        type: Number,
        required: [true, 'Maximum properties allowed is required'],
        min: [1, 'Must allow at least 1 property'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
