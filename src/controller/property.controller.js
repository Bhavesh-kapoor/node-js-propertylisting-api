import { Property } from "../model/property.model.js";
import s3ServiceWithProgress from "../config/awsS3.config.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { check, validationResult } from "express-validator";

const s3Service = new s3ServiceWithProgress();

const propertyValidator = [
    check("title").notEmpty().withMessage("title is required!"),
    check("description").notEmpty().withMessage("description is required!"),
    check("price").notEmpty().withMessage("price is required!"),
    check("propertyType").notEmpty().withMessage("propertyType is required!"),
    check("status").notEmpty().withMessage("status is required!"),
    check("features").notEmpty().withMessage("features is required!"),
]

/*---------------------------------------------------add a new property----------------------------------------*/
const createProperty = asyncHandler(async (req, res) => {
    console.log(req.body)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(new ApiError(400, "Validation Error", errors));
    }
    const { title, description, address, price, propertyType, status, features, specifications } = req.body;
    const user = req.user;
    const propertyData = {
        title,
        description,
        address,
        price,
        propertyType,
        status,
        features,
        specifications,
        owner: user._id,
    };

    if (req.files && req.files.length > 0) {
        const imageUploads = await Promise.all(req.files.map(async (file) => {
            const uploadResult = await s3Service.uploadFile(file, `properties/${Date.now()}_${file.originalname}`);
            return uploadResult.url
        }));
        propertyData.images = imageUploads;
    }
    const property = new Property(propertyData);
    await property.save();

    res.status(201).json(new ApiResponse(201, property, "Property created successfully"));
})
/*-------------------------------------------------get property list----------------------------------------*/
const getProperties = async (req, res) => {
    try {
        const {
            city,
            country,
            name,
            propertyType,
            minPrice,
            maxPrice,
            status,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;
        const filter = {};
        if (city) {
            filter['address.city'] = { $regex: city, $options: 'i' };
        }
        if (country) {
            filter['address.country'] = { $regex: country, $options: 'i' };
        }
        if (name) {
            filter.title = { $regex: name, $options: 'i' };
        }
        if (propertyType) {
            filter.propertyType = propertyType;
        }
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        if (status) {
            filter.status = status;
        }
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const properties = await Property.find(filter)
            .populate({
                path: 'owner',
                select: 'name email isVerified',
            })
            .sort({ 'owner.isVerified': -1, ...sortOptions })
            .skip(skip)
            .limit(limitNumber);

        const totalCount = await Property.countDocuments(filter);

        res.status(200).json(new ApiResponse(200, {
            result: properties,
            pagination: {
              totalPages: Math.ceil(totalCount / limitNumber),
              currentPage: pageNumber,
              totalItems: totalCount,
              itemsPerPage: limitNumber,
            },
          }, "properties fatched successfully."));
    } catch (error) {
        console.error("Error fetching properties:", error);
        res.status(500).json({ message: "Server Error" });
    }
};


const getProperty = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const property = await Property.findById(id).populate("owner");

    if (!property) {
        throw new ApiError(404, 'Property not found found!')
    }

    res.status(200).json(property);
})

/*------------------------------------------------- Update Property----------------------------------------*/
const updateProperty = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        title, description, address, price,
        propertyType, status, features, specifications, owner, images
    } = req.body;

    const property = await Property.findById(id);

    if (!property) {
        return res.status(404).json(new ApiResponse(404, null, "Property not found"));
    }

    // Update text fields
    if (title) property.title = title;
    if (description) property.description = description;
    if (price !== undefined) property.price = price;
    if (propertyType) property.propertyType = propertyType;
    if (status) property.status = status;
    if (features) property.features = features;
    if (owner) property.owner = owner;

    if (address) {
        property.address = {
            ...property.address,
            ...address
        };
    }

    if (specifications) {
        property.specifications = {
            ...property.specifications,
            ...specifications
        };
    }

    // Handle new image uploads
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
        const imageUploads = await Promise.all(req.files.map(async (file) => {
            const uploadResult = await s3Service.uploadFile(file, `properties/${Date.now()}_${file.originalname}`);
            return uploadResult.url;
        }));
        newImageUrls = imageUploads; // Store uploaded image URLs
    }
    const existingImageUrls = property.images || [];
    let updatedImages = existingImageUrls;

    if (images) {
        const imagesToKeep = Array.isArray(images) ? images : JSON.parse(images);
        const imagesToRemove = existingImageUrls.filter((existingImage) =>
            !imagesToKeep.includes(existingImage)
        );
        if (imagesToRemove.length > 0) {
            await Promise.all(imagesToRemove.map(async (image) => {
                await s3Service.deleteFile(image); // Delete file from S3
            }));
        }

        updatedImages = [
            ...imagesToKeep,
            ...newImageUrls
        ];
    } else if (newImageUrls.length > 0) {
        updatedImages = [
            ...existingImageUrls,
            ...newImageUrls
        ];
    }
    property.images = updatedImages;
    await property.save();

    res.status(200).json(new ApiResponse(200, property, "Property updated successfully"));
});

/*-------------------------------------------------- Delete Property--------------------------------*/
const deleteProperty = asyncHandler(async (req, res) => {

    const { id } = req.params;
    const property = await Property.findById(id);

    if (!property) {
        throw new ApiError(404, "Property not found")
    }

    if (property.images && property.images.length > 0) {
        await Promise.all(property.images.map(imageUrl => s3Service.deleteFile(imageUrl)));
    }
    await Property.findByIdAndDelete(id);
    res.status(200).json(new ApiResponse(200, null, "Property deleted successfully"))
})

export { createProperty, getProperties, getProperty, updateProperty, deleteProperty, propertyValidator }