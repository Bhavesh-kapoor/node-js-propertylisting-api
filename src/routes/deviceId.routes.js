import { createOrUpdateDevice } from "../controller/deviceId.controller.js";
import express from "express";

const deviceRouter = express.Router();
deviceRouter.post("/add-update", createOrUpdateDevice)

export default deviceRouter;