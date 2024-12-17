import { Router } from "express";
import {
  listSeoData,
  createSeoData,
  updateSeoData,
  deleteSeoData,
  getSeoDataById,
  validateSeoData,
} from "../controller/metaData.controller.js";

const router = Router();

router.post("/create", validateSeoData, createSeoData);

router.put("/update/:_id", updateSeoData);

router.delete("/delete/:_id", deleteSeoData);

router.get("/list-seo-data", listSeoData);

router.get("/seo-data/:_id", getSeoDataById);

export default router;
