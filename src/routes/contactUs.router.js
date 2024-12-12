import { Router } from "express";
import { raiseQuery, changeQueryStatus, getQueryList, getQueryById } from "../controller/contactUsController.js";

const router = Router();

router.get("/query-list", getQueryList);
router.post("/raise-query", raiseQuery);
router.get("/get/:_id", getQueryById);
router.put("/update-status/:_id", changeQueryStatus);

export default router;
