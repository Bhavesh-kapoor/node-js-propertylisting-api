import express from 'express';
import { createProperty,updateProperty,getProperties,getProperty,deleteProperty, propertyValidator } from '../controller/property.controller.js';
import { multerUpload } from '../middlewere/multer.middlewere.js';
const propertyRouter = express.Router();

propertyRouter.post("/add",multerUpload.array("imagefiles",10),propertyValidator,createProperty)
propertyRouter.put("/update/:id",multerUpload.array("imagefiles",10),propertyValidator,updateProperty)
propertyRouter.get("/get-list",getProperties)
propertyRouter.get("/get/:id",getProperty)
propertyRouter.delete("/delete-property",deleteProperty)

export default propertyRouter; 