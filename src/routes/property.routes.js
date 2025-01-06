import express from "express";
import {
  createProperty,
  updateProperty,
  listedProperties,
  getProperty,
  deleteProperty,
  propertyValidator,
  getPropertyBySlug,
} from "../controller/property.controller.js";
import { multerUpload } from "../middlewere/multer.middlewere.js";

const propertyRouter = express.Router();

const multiUpload = multerUpload.fields([
  { name: "imagefiles", maxCount: 10 },
  { name: "videofile", maxCount: 1 },
]);

propertyRouter.post(
  "/add/:userId?",
  multiUpload,
  propertyValidator,
  createProperty
);

propertyRouter.put(
  "/update/:id",
  multiUpload,
  propertyValidator,
  updateProperty
);

propertyRouter.get("/listed-properties", listedProperties);

propertyRouter.get("/get/:id", getProperty);
propertyRouter.get("/get-by-slug/:slug", getPropertyBySlug);
propertyRouter.delete("/delete-property/:id", deleteProperty);

export default propertyRouter;
