import { Router } from "express";
import {
  fetchUser,
  getCurrentUser,
  logoutUser,
  changeCurrentPassword,
  refreshAccessToken,
  updateAccountDetails,
  changeAvatarImage
} from "../controller/admin.controller.js";
import { multerUpload } from "../middlewere/multer.middlewere.js";

const router = Router();

router.get("/fetch-users",fetchUser)
router.get("/get-current-user", getCurrentUser);
router.put("/update-user", updateAccountDetails);
router.get("/logout", logoutUser);
router.put("/change-current-password", changeCurrentPassword);
router.post("/refresh-access-token", refreshAccessToken);
router.post("/update-avatar", multerUpload.single("avatar"), changeAvatarImage);
router.post("/get-user-list", changeAvatarImage);


export default router;
