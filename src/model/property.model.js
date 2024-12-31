import mongoose from "mongoose";
import slugify from "slugify";
const addressSchema = new mongoose.Schema(
  {
    fullAddress: {
      type: String,
      required: [true, "fullAddress is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    pinCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
    },
  },
  { _id: false }
);
const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      sparse: true,
    },
    description: {
      type: String,
      required: [true, "Property description is required"],
      trim: true,
    },
    address: addressSchema,
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    propertyType: {
      type: String,
      required: [true, "Property type is required"],
      enum: ["House", "Apartment", "Condo", "Villa", "Land", "Commercial"],
    },
    status: {
      type: String,
      enum: ["For-Sale", "For-Rent", "Sold", "Rented"],
      default: "For-Sale",
    },
    amenities: [
      {
        type: String,
        trim: true,
        enum: [
          // Indoor Features
          "WiFi",
          "Air Conditioning",
          "Heating",
          "Fireplace",
          "Ceiling Fans",
          "Furnished",
          "Elevator",

          // Outdoor Features
          "Balcony",
          "Garden",
          "Patio",
          "Terrace",
          "Deck",
          "Swimming Pool",
          "Jacuzzi",
          "BBQ Area",
          "Outdoor Kitchen",

          // Building Features
          "Gym",
          "Laundry Room",
          "Game Room",
          "Sauna",
          "Spa",
          "Conference Room",
          "Business Center",

          // Security Features
          "Security Cameras",
          "24/7 Security",
          "Smoke Detectors",
          "Fire Alarm",
          "Secure Parking",

          // Utilities
          "Solar Panels",
          "Backup Generator",
          "Water Softener",
          "Filtered Water",
          "Electric Charging Station",

          // Accessibility Features
          "Wheelchair Access",
          "Handicap Parking",
          "Ramps",

          // Parking
          "Garage",
          "Covered Parking",
          "Open Parking",
          "Bike Storage",

          // Entertainment
          "Home Theater",
          "Cable TV",
          "Satellite TV",
          "Gaming Area",

          // Kitchen Features
          "Dishwasher",
          "Microwave",
          "Refrigerator",
          "Oven",

          // Other
          "Pets Allowed",
          "Storage Space",
          "Guest Parking",
          "Private Entrance",
        ],
        message: "{VALUE} is not a valid amenity",
      },
    ],
    specifications: {
      bedrooms: {
        type: Number,
        required: [true, "Number of bedrooms is required"],
        min: 0,
      },
      bathrooms: {
        type: Number,
        required: [true, "Number of bathrooms is required"],
        min: 0,
      },
      area: {
        type: Number,
        required: [true, "Area is required"],
        min: 0,
      },
      landArea: {
        type: Number,
        required: [true, "Land area is required"],
        min: 0,
      },
      floors: {
        type: Number,
        min: 0,
      },
      parkingSpaces: {
        type: Number,
        min: 0,
      },
      yearBuilt: {
        type: Number,
      },
      //   facingDirection: {
      //     type: String,
      //     enum: [
      //       "North",
      //       "South",
      //       "East",
      //       "West",
      //       "North-East",
      //       "North-West",
      //       "South-East",
      //       "South-West",
      //     ],
      //   },
      //   furnishingStatus: {
      //     type: String,
      //     enum: ["Furnished", "Semi-Furnished", "Unfurnished"],
      //     default: "Unfurnished",
      //   },
      powerBackup: {
        type: Boolean,
      },
      waterSupply: {
        type: String,
        enum: ["Municipal", "Borewell", "Both"],
      },
      flooringType: {
        type: String,
        enum: [
          "Marble",
          "Wooden",
          "Tile",
          "Granite",
          "Cement",
          "Vinyl",
          "Carpet",
        ],
      },
      servantQuarters: {
        type: Boolean,
      },
    },
    video: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    images: [String],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

propertySchema.pre("validate", async function (next) {
  if (this.isNew) {
    let baseSlug = slugify(`${this.address.city} ${this.title}`, {
      lower: true,
      strict: true,
    });
    let slug = baseSlug;
    let counter = 1;

    while (await mongoose.models.Property.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }
  next();
});

export const Property = mongoose.model("Property", propertySchema);
