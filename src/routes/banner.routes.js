import { Router } from "express";
import { createBanner,getActiveBanners,getBannerById,updateBanner,toggleBannerStatus,getBanners,deleteBanner,deleteMultipleBanners } from "../controller/banner.controller.js";
const bannerRouter = Router();

bannerRouter.get('/create',createBanner);
bannerRouter.get('/update/:id',updateBanner);
bannerRouter.get('/get/:id',getBannerById);
bannerRouter.get('/get-active-banners',getActiveBanners);
bannerRouter.get('/toggleBannerStatus/:id',toggleBannerStatus);
bannerRouter.get('/delete',deleteBanner);
bannerRouter.get('/delete-multiples',deleteMultipleBanners);
bannerRouter.get('/get-list',getBanners);

export default bannerRouter;
