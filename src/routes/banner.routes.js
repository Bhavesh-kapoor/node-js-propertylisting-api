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
import { multerUpload } from "../middlewere/multer.middlewere.js";
const bannerRouter = Router();

bannerRouter.post("/create", multerUpload.single("imageFile"), createBanner);
bannerRouter.put("/update/:id", multerUpload.single("imageFile"), updateBanner);
bannerRouter.get("/get/:id", getBannerById);
bannerRouter.get("/get-active-banners", getActiveBanners);
bannerRouter.put("/toggle-banner-status/:id", toggleBannerStatus);
bannerRouter.delete("/delete/:id", deleteBanner);
bannerRouter.delete("/delete-multiples", deleteMultipleBanners);
bannerRouter.get("/get-list", getBanners);

export default bannerRouter;
