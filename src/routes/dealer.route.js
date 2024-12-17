import { Router } from "express";
import {
  listDealerData,
  deleteDealerData,
  getDealerDataById,
} from "../controller/dealer.controller.js";
import { multerUpload } from "../middlewere/multer.middlewere.js";
import {
  registerUser,
  updateAdminDetails,
} from "../controller/admin.controller.js";

const router = Router();

router.post("/create", multerUpload.single("avatarUrl"), registerUser);

router.put(
  "/update/:id",
  multerUpload.single("profileImage"),
  updateAdminDetails
);

router.delete("/delete/:_id", deleteDealerData);

router.get("/list-all", listDealerData);

router.get("/get/:_id", getDealerDataById);

export default router;
