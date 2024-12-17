import { createOrUpdateDevice,addFavoriteProperty } from "../controller/deviceId.controller.js";
import express from "express";

const deviceRouter = express.Router();
deviceRouter.post("/add-update", createOrUpdateDevice)

/*--------------------------------------------------favorites------------------------------------*/
deviceRouter.post("/add-to-favorites", createOrUpdateDevice)
deviceRouter.post("/remove-from-favorites", addFavoriteProperty)
deviceRouter.post("/add-update", createOrUpdateDevice)
deviceRouter.post("/add-update", createOrUpdateDevice)

export default deviceRouter;