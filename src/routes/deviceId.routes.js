import { createOrUpdateDevice,addFavoriteProperty,removeFavoriteProperty,getFavoriteProperties,clearFavoriteProperties } from "../controller/deviceId.controller.js";
import express from "express";

const deviceRouter = express.Router();
deviceRouter.post("/add-update", createOrUpdateDevice)

/*--------------------------------------------------favorites------------------------------------*/
deviceRouter.post("/add-to-favorites", addFavoriteProperty)
deviceRouter.post("/remove-from-favorites", removeFavoriteProperty)
deviceRouter.get("/get-favorites/:deviceId", getFavoriteProperties)
deviceRouter.delete("/clear-favorites", clearFavoriteProperties)

export default deviceRouter;