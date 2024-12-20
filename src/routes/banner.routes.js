import { Router } from "express";
import {
  createBanner,
  getActiveBanners,
  getBannerById,
  updateBanner,
  toggleBannerStatus,
  getBanners,
  deleteBanner,
  deleteMultipleBanners,
} from "../controller/banner.controller.js";
const bannerRouter = Router();

bannerRouter.post("/create", createBanner);
bannerRouter.put("/update/:id", updateBanner);
bannerRouter.get("/get/:id", getBannerById);
bannerRouter.get("/get-active-banners", getActiveBanners);
bannerRouter.put("/toggle-banner-status/:id", toggleBannerStatus);
bannerRouter.delete("/delete", deleteBanner);
bannerRouter.delete("/delete-multiples", deleteMultipleBanners);
bannerRouter.get("/get-list", getBanners);

export default bannerRouter;
