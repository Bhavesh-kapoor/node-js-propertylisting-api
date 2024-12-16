import express from 'express';
import { createProperty, updateProperty, getProperties, getProperty, deleteProperty, propertyValidator } from '../controller/property.controller.js';
import { multerUpload } from '../middlewere/multer.middlewere.js';
const propertyRouter = express.Router();

const multiUpload = multerUpload.fields([
    { name: "imagefiles", maxCount: 10 },
    { name: "videofiles", maxCount: 2 }
])

propertyRouter.post("/add", multiUpload, propertyValidator, createProperty);

propertyRouter.put("/update/:id", multiUpload, propertyValidator, updateProperty);
propertyRouter.get("/get-list", getProperties)
propertyRouter.get("/get/:id", getProperty)
propertyRouter.delete("/delete-property", deleteProperty)

export default propertyRouter; 